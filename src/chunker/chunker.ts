import type { IPipelineStage, StageOptions } from '../core/types.js';
import type { StructuredDocument, Section } from '../core/document.js';
import type { Chunk, ChunkOptions, ITokenizer } from './types.js';
import { TiktokenTokenizer } from './tokenizer.js';
import { splitSentences } from './sentence-boundary.js';

const ATOMIC_BLOCK_PATTERNS = [
  // Code blocks
  /```[\s\S]*?```/g,
  // Tables (header + separator + rows)
  /\|[^\n]+\|\n\|[\s:|-]+\|\n(?:\|[^\n]+\|\n?)*/g,
];

const LIST_PATTERN = /^(?:[-*+]|\d+\.)\s/;

export class SmartChunker implements IPipelineStage<StructuredDocument, Chunk[]> {
  name = 'chunk';

  private readonly options: ChunkOptions;
  private tokenizer: ITokenizer;

  constructor(options?: Partial<ChunkOptions>, tokenizer?: ITokenizer) {
    this.options = {
      minTokens: 500,
      maxTokens: 1000,
      targetTokens: 750,
      overlapStrategy: 'semantic',
      preserveStructures: true,
      ...options,
    };
    this.tokenizer = tokenizer ?? new TiktokenTokenizer();
  }

  async process(input: StructuredDocument, stageOptions?: StageOptions): Promise<Chunk[]> {
    stageOptions?.onProgress?.(0, 'Initializing tokenizer');

    // Ensure tokenizer is initialized
    if (this.tokenizer instanceof TiktokenTokenizer) {
      await this.tokenizer.init();
    }

    stageOptions?.onProgress?.(10, 'Collecting sections');

    // Flatten sections into content blocks with metadata
    const blocks = this.flattenSections(input.sections);

    stageOptions?.onProgress?.(30, `Processing ${blocks.length} sections`);

    const chunks: Chunk[] = [];
    let lastOverlapText = '';

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const content = block.content.trim();
      if (!content) continue;

      const tokenCount = this.tokenizer.countTokens(content);

      if (tokenCount <= this.options.maxTokens) {
        // Section fits in one chunk
        const fullContent = lastOverlapText ? lastOverlapText + '\n\n' + content : content;
        const overlapTokens = lastOverlapText ? this.tokenizer.countTokens(lastOverlapText) : 0;

        chunks.push(this.createChunk(chunks.length, fullContent, block, overlapTokens));
        lastOverlapText = this.getOverlapText(content);
      } else {
        // Section needs splitting
        const subChunks = this.splitContent(content, block, lastOverlapText);
        for (const sc of subChunks) {
          chunks.push(this.createChunk(chunks.length, sc.content, block, sc.overlapTokens));
        }
        // Overlap from last sub-chunk
        const lastSc = subChunks[subChunks.length - 1];
        lastOverlapText = lastSc ? this.getOverlapText(lastSc.content) : '';
      }

      stageOptions?.onProgress?.(30 + Math.round((i / blocks.length) * 60), `Chunked section ${i + 1}/${blocks.length}`);
    }

    // Update position.total in all chunks
    for (const chunk of chunks) {
      chunk.metadata.position.total = chunks.length;
    }

    stageOptions?.onProgress?.(100, `${chunks.length} chunks created`);
    return chunks;
  }

  private flattenSections(sections: Section[], chapter?: string): ContentBlock[] {
    const blocks: ContentBlock[] = [];
    for (const section of sections) {
      const chapterTitle = section.level === 1 ? section.title : chapter;
      const sectionTitle = section.level >= 2 ? section.title : undefined;

      if (section.content.trim()) {
        blocks.push({
          content: section.content,
          chapterTitle,
          sectionTitle,
        });
      }

      if (section.children.length > 0) {
        blocks.push(...this.flattenSections(section.children, chapterTitle));
      }
    }
    return blocks;
  }

  private splitContent(
    content: string,
    block: ContentBlock,
    previousOverlap: string,
  ): { content: string; overlapTokens: number }[] {
    const results: { content: string; overlapTokens: number }[] = [];

    // Extract atomic blocks and replace with placeholders
    const { text: processedText, atomicBlocks } = this.extractAtomicBlocks(content);

    // Split into segments (sentences or atomic blocks)
    const segments = this.getSegments(processedText, atomicBlocks);

    let currentSegments: string[] = [];
    let currentTokens = 0;
    let overlapText = previousOverlap;

    for (const segment of segments) {
      const segTokens = this.tokenizer.countTokens(segment);

      // Atomic block that exceeds max — include as-is with warning
      if (segTokens > this.options.maxTokens && this.options.preserveStructures) {
        // Flush current
        if (currentSegments.length > 0) {
          const chunkContent = overlapText
            ? overlapText + '\n\n' + currentSegments.join(' ')
            : currentSegments.join(' ');
          const overlapTokens = overlapText ? this.tokenizer.countTokens(overlapText) : 0;
          results.push({ content: chunkContent, overlapTokens });
          overlapText = this.getOverlapText(currentSegments.join(' '));
          currentSegments = [];
          currentTokens = 0;
        }
        // Add oversized block as its own chunk
        const chunkContent = overlapText ? overlapText + '\n\n' + segment : segment;
        const overlapTokens = overlapText ? this.tokenizer.countTokens(overlapText) : 0;
        results.push({ content: chunkContent, overlapTokens });
        overlapText = this.getOverlapText(segment);
        continue;
      }

      if (currentTokens + segTokens > this.options.targetTokens && currentSegments.length > 0) {
        // Flush current chunk
        const chunkContent = overlapText
          ? overlapText + '\n\n' + currentSegments.join(' ')
          : currentSegments.join(' ');
        const overlapTokens = overlapText ? this.tokenizer.countTokens(overlapText) : 0;
        results.push({ content: chunkContent, overlapTokens });
        overlapText = this.getOverlapText(currentSegments.join(' '));
        currentSegments = [];
        currentTokens = 0;
      }

      currentSegments.push(segment);
      currentTokens += segTokens;
    }

    // Final chunk
    if (currentSegments.length > 0) {
      const chunkContent = overlapText
        ? overlapText + '\n\n' + currentSegments.join(' ')
        : currentSegments.join(' ');
      const overlapTokens = overlapText ? this.tokenizer.countTokens(overlapText) : 0;
      results.push({ content: chunkContent, overlapTokens });
    }

    return results;
  }

  private extractAtomicBlocks(text: string): { text: string; atomicBlocks: Map<string, string> } {
    const atomicBlocks = new Map<string, string>();
    let processed = text;
    let idx = 0;

    if (!this.options.preserveStructures) {
      return { text: processed, atomicBlocks };
    }

    for (const pattern of ATOMIC_BLOCK_PATTERNS) {
      processed = processed.replace(pattern, (match) => {
        const placeholder = `__ATOMIC_${idx++}__`;
        atomicBlocks.set(placeholder, match);
        return placeholder;
      });
    }

    // Extract list blocks (consecutive list items)
    const lines = processed.split('\n');
    let listStart = -1;
    const listRanges: { start: number; end: number; content: string }[] = [];

    for (let i = 0; i <= lines.length; i++) {
      const isListLine = i < lines.length && LIST_PATTERN.test(lines[i].trim());
      if (isListLine && listStart === -1) {
        listStart = i;
      } else if (!isListLine && listStart !== -1) {
        const listContent = lines.slice(listStart, i).join('\n');
        const placeholder = `__ATOMIC_${idx++}__`;
        atomicBlocks.set(placeholder, listContent);
        listRanges.push({ start: listStart, end: i, content: placeholder });
        listStart = -1;
      }
    }

    // Replace list blocks with placeholders (reverse order to preserve indices)
    for (let i = listRanges.length - 1; i >= 0; i--) {
      const range = listRanges[i];
      lines.splice(range.start, range.end - range.start, range.content);
    }
    processed = lines.join('\n');

    return { text: processed, atomicBlocks };
  }

  private getSegments(text: string, atomicBlocks: Map<string, string>): string[] {
    const segments: string[] = [];
    // Split by double newlines first (paragraph boundaries)
    const paragraphs = text.split(/\n\n+/).filter((p) => p.trim());

    for (const para of paragraphs) {
      const trimmed = para.trim();

      // Check if it's an atomic block placeholder
      if (atomicBlocks.has(trimmed)) {
        segments.push(atomicBlocks.get(trimmed)!);
        continue;
      }

      // Check for inline atomic placeholders
      if (trimmed.startsWith('__ATOMIC_') && trimmed.endsWith('__')) {
        segments.push(atomicBlocks.get(trimmed) ?? trimmed);
        continue;
      }

      // Split paragraph into sentences
      const sentences = splitSentences(trimmed);
      if (sentences.length > 0) {
        for (const s of sentences) {
          segments.push(s.text);
        }
      } else {
        segments.push(trimmed);
      }
    }

    return segments;
  }

  private getOverlapText(content: string): string {
    if (this.options.overlapStrategy === 'fixed') {
      // Fixed overlap: last N tokens worth of text (approximate)
      const words = content.split(/\s+/);
      const overlapWords = Math.min(Math.ceil(words.length * 0.1), 50);
      return words.slice(-overlapWords).join(' ');
    }

    // Semantic overlap: last complete sentence(s)
    const sentences = splitSentences(content);
    if (sentences.length <= 1) return '';

    // Take last sentence as overlap
    return sentences[sentences.length - 1].text;
  }

  private createChunk(
    index: number,
    content: string,
    block: ContentBlock,
    overlapTokens: number,
  ): Chunk {
    const id = `chunk-${String(index + 1).padStart(3, '0')}`;
    return {
      id,
      content,
      metadata: {
        chunkId: id,
        chapterTitle: block.chapterTitle,
        sectionTitle: block.sectionTitle,
        tokenCount: this.tokenizer.countTokens(content),
        overlapTokens,
        position: {
          index,
          total: 0, // Updated after all chunks are created
        },
      },
    };
  }
}

interface ContentBlock {
  content: string;
  chapterTitle?: string;
  sectionTitle?: string;
}
