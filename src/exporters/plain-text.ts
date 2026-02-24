import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import type { StructuredDocument, Section } from '../core/document.js';
import type { Chunk } from '../chunker/types.js';
import type { IExporter, ExportOptions, ExportResult } from './types.js';

export class PlainTextExporter implements IExporter {
  format = 'txt' as const;

  async export(
    doc: StructuredDocument,
    chunks: Chunk[],
    options: ExportOptions,
  ): Promise<ExportResult> {
    const start = Date.now();
    mkdirSync(options.outputDir, { recursive: true });

    // Strip markdown formatting to produce plain text
    let text = '';
    for (const section of flattenSections(doc.sections)) {
      if (section.title && section.title !== 'Document') {
        text += section.title + '\n\n';
      }
      text += stripMarkdown(section.content) + '\n\n';
    }

    const fileName = (doc.metadata.title || 'document').replace(/[^a-zA-Z0-9-_ ]/g, '').trim().replace(/\s+/g, '-').toLowerCase();
    const filePath = join(options.outputDir, `${fileName}.txt`);
    writeFileSync(filePath, text.trim() + '\n', 'utf-8');

    const totalTokens = chunks.reduce((sum, c) => sum + c.metadata.tokenCount, 0);

    return {
      files: [filePath],
      qualityScore: 0,
      stats: {
        totalChunks: chunks.length,
        totalTokens,
        avgChunkSize: chunks.length > 0 ? Math.round(totalTokens / chunks.length) : 0,
        processingTimeMs: Date.now() - start,
      },
    };
  }
}

function flattenSections(sections: Section[]): Section[] {
  const result: Section[] = [];
  for (const s of sections) {
    result.push(s);
    if (s.children.length > 0) {
      result.push(...flattenSections(s.children));
    }
  }
  return result;
}

function stripMarkdown(md: string): string {
  return md
    .replace(/^#{1,6}\s+/gm, '') // headings
    .replace(/\*\*([^*]+)\*\*/g, '$1') // bold
    .replace(/\*([^*]+)\*/g, '$1') // italic
    .replace(/`([^`]+)`/g, '$1') // inline code
    .replace(/```[\s\S]*?```/g, (m) => m.replace(/```\n?/g, '')) // code blocks
    .replace(/^\s*[-*+]\s+/gm, '  ') // list items
    .replace(/^\s*\d+\.\s+/gm, '  ') // ordered list
    .replace(/^>\s+/gm, '') // blockquotes
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
    .replace(/\|[^\n]+\|/g, (row) => row.replace(/\|/g, ' ').trim()) // tables
    .replace(/^[\s|:-]+$/gm, '') // table separators
    .replace(/---/g, '') // horizontal rules
    .replace(/\n{3,}/g, '\n\n') // multiple blank lines
    .trim();
}
