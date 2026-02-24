import { describe, it, expect, beforeAll } from 'vitest';
import { SmartChunker } from '../../../src/chunker/chunker.js';
import type { StructuredDocument } from '../../../src/core/document.js';

function makeDoc(sections: { title: string; content: string; level?: number }[]): StructuredDocument {
  return {
    metadata: { title: 'Test', sourceFormat: 'txt' },
    sections: sections.map((s, i) => ({
      id: `s${i + 1}`,
      level: s.level ?? 1,
      title: s.title,
      content: s.content,
      children: [],
      meta: { wordCount: s.content.split(/\s+/).length, charCount: s.content.length },
    })),
    qualityIndicators: { structurePreserved: 80, noiseRemoved: 50, metadataCompleteness: 75 },
  };
}

// Generate long text with sentence boundaries
function generateText(sentenceCount: number): string {
  const sentences = [];
  for (let i = 0; i < sentenceCount; i++) {
    sentences.push(`This is sentence number ${i + 1} which contains several words to fill up token count properly.`);
  }
  return sentences.join(' ');
}

describe('SmartChunker', () => {
  const chunker = new SmartChunker({
    minTokens: 50,
    maxTokens: 200,
    targetTokens: 150,
    overlapStrategy: 'semantic',
    preserveStructures: true,
  });

  // Initialize tokenizer
  beforeAll(async () => {
    // Warm up by processing a tiny doc
    const tiny = makeDoc([{ title: 'Init', content: 'Hello.' }]);
    await chunker.process(tiny);
  });

  describe('Basic chunking', () => {
    it('should create a single chunk for small sections', async () => {
      const doc = makeDoc([{ title: 'Small', content: 'This is a small section with just a few words.' }]);
      const chunks = await chunker.process(doc);
      expect(chunks.length).toBe(1);
      expect(chunks[0].content).toContain('small section');
    });

    it('should split large sections into multiple chunks', async () => {
      const longText = generateText(50);
      const doc = makeDoc([{ title: 'Long', content: longText }]);
      const chunks = await chunker.process(doc);
      expect(chunks.length).toBeGreaterThan(1);
    });

    it('should handle multiple sections', async () => {
      const doc = makeDoc([
        { title: 'Section 1', content: 'First section content here.' },
        { title: 'Section 2', content: 'Second section content here.' },
      ]);
      const chunks = await chunker.process(doc);
      expect(chunks.length).toBeGreaterThanOrEqual(2);
    });

    it('should skip empty sections', async () => {
      const doc = makeDoc([
        { title: 'Empty', content: '' },
        { title: 'Real', content: 'Actual content here.' },
      ]);
      const chunks = await chunker.process(doc);
      expect(chunks.length).toBe(1);
    });
  });

  describe('Chunk metadata', () => {
    it('should generate sequential chunk IDs', async () => {
      const doc = makeDoc([
        { title: 'S1', content: 'Content one here.' },
        { title: 'S2', content: 'Content two here.' },
      ]);
      const chunks = await chunker.process(doc);
      expect(chunks[0].id).toBe('chunk-001');
      if (chunks.length > 1) {
        expect(chunks[1].id).toBe('chunk-002');
      }
    });

    it('should set position.total correctly', async () => {
      const doc = makeDoc([
        { title: 'S1', content: 'Content one.' },
        { title: 'S2', content: 'Content two.' },
      ]);
      const chunks = await chunker.process(doc);
      for (const chunk of chunks) {
        expect(chunk.metadata.position.total).toBe(chunks.length);
      }
    });

    it('should include chapter and section titles', async () => {
      const doc: StructuredDocument = {
        metadata: { title: 'Test', sourceFormat: 'txt' },
        sections: [
          {
            id: 'ch1',
            level: 1,
            title: 'Chapter One',
            content: 'Chapter intro.',
            children: [
              {
                id: 'ch1-s1',
                level: 2,
                title: 'Section A',
                content: 'Section details.',
                children: [],
                meta: { wordCount: 2, charCount: 16 },
              },
            ],
            meta: { wordCount: 2, charCount: 14 },
          },
        ],
        qualityIndicators: { structurePreserved: 80, noiseRemoved: 50, metadataCompleteness: 75 },
      };
      const chunks = await chunker.process(doc);
      const chapterChunk = chunks.find((c) => c.metadata.chapterTitle === 'Chapter One');
      expect(chapterChunk).toBeDefined();
      const sectionChunk = chunks.find((c) => c.metadata.sectionTitle === 'Section A');
      expect(sectionChunk).toBeDefined();
    });

    it('should track token count per chunk', async () => {
      const doc = makeDoc([{ title: 'S', content: 'Some words in a sentence.' }]);
      const chunks = await chunker.process(doc);
      expect(chunks[0].metadata.tokenCount).toBeGreaterThan(0);
    });
  });

  describe('Semantic overlap', () => {
    it('should include overlap from previous chunk', async () => {
      const longText = generateText(50);
      const doc = makeDoc([{ title: 'Long', content: longText }]);
      const chunks = await chunker.process(doc);

      if (chunks.length > 1) {
        // Second chunk should have overlap tokens > 0
        expect(chunks[1].metadata.overlapTokens).toBeGreaterThan(0);
        // First chunk has no overlap
        expect(chunks[0].metadata.overlapTokens).toBe(0);
      }
    });
  });

  describe('Structure preservation', () => {
    it('should keep lists intact', async () => {
      const content = 'Introduction text here.\n\n- Item one\n- Item two\n- Item three\n\nConclusion text.';
      const doc = makeDoc([{ title: 'Lists', content }]);
      const chunks = await chunker.process(doc);
      // At least one chunk should contain the full list
      const hasFullList = chunks.some(
        (c) => c.content.includes('- Item one') && c.content.includes('- Item three'),
      );
      expect(hasFullList).toBe(true);
    });

    it('should keep code blocks intact', async () => {
      const content = 'Some text.\n\n```\nconst x = 1;\nconst y = 2;\n```\n\nMore text.';
      const doc = makeDoc([{ title: 'Code', content }]);
      const chunks = await chunker.process(doc);
      const hasFullBlock = chunks.some(
        (c) => c.content.includes('```') && c.content.includes('const x = 1;'),
      );
      expect(hasFullBlock).toBe(true);
    });

    it('should keep tables intact', async () => {
      const content = 'Before table.\n\n| A | B |\n| --- | --- |\n| 1 | 2 |\n\nAfter table.';
      const doc = makeDoc([{ title: 'Table', content }]);
      const chunks = await chunker.process(doc);
      const hasFullTable = chunks.some(
        (c) => c.content.includes('| A | B |') && c.content.includes('| 1 | 2 |'),
      );
      expect(hasFullTable).toBe(true);
    });
  });

  describe('Fixed overlap strategy', () => {
    it('should use word-based overlap when strategy is fixed', async () => {
      const fixedChunker = new SmartChunker({
        minTokens: 50,
        maxTokens: 200,
        targetTokens: 150,
        overlapStrategy: 'fixed',
        preserveStructures: true,
      });
      const longText = generateText(50);
      const doc = makeDoc([{ title: 'Long', content: longText }]);
      const chunks = await fixedChunker.process(doc);
      if (chunks.length > 1) {
        expect(chunks[1].metadata.overlapTokens).toBeGreaterThan(0);
      }
    });
  });

  describe('Progress reporting', () => {
    it('should call onProgress', async () => {
      const progress: number[] = [];
      const doc = makeDoc([{ title: 'S', content: 'Hello world.' }]);
      await chunker.process(doc, { onProgress: (p) => progress.push(p) });
      expect(progress).toContain(0);
      expect(progress).toContain(100);
    });
  });

  describe('Benchmark', () => {
    it('should process ~100k tokens in < 5 seconds', async () => {
      // Generate a large document (~100k tokens ≈ ~75k words ≈ ~5000 sentences)
      const largeText = generateText(3000);
      const doc = makeDoc([
        { title: 'Part 1', content: largeText },
        { title: 'Part 2', content: largeText },
      ]);

      const bigChunker = new SmartChunker({
        minTokens: 500,
        maxTokens: 1000,
        targetTokens: 750,
        overlapStrategy: 'semantic',
        preserveStructures: true,
      });

      const start = Date.now();
      const chunks = await bigChunker.process(doc);
      const elapsed = Date.now() - start;

      expect(chunks.length).toBeGreaterThan(10);
      expect(elapsed).toBeLessThan(5000);
    }, 10000);
  });
});
