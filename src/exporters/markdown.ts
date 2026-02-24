import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import type { StructuredDocument, Section } from '../core/document.js';
import type { Chunk } from '../chunker/types.js';
import type { IExporter, ExportOptions, ExportResult } from './types.js';

export class MarkdownExporter implements IExporter {
  format = 'md' as const;

  async export(
    doc: StructuredDocument,
    chunks: Chunk[],
    options: ExportOptions,
  ): Promise<ExportResult> {
    const start = Date.now();
    mkdirSync(options.outputDir, { recursive: true });

    let md = '';

    // Document title
    if (doc.metadata.title) {
      md += `# ${doc.metadata.title}\n\n`;
    }

    // Metadata block
    if (options.includeMetadata) {
      md += '---\n';
      if (doc.metadata.author) md += `author: ${doc.metadata.author}\n`;
      if (doc.metadata.language) md += `language: ${doc.metadata.language}\n`;
      if (doc.metadata.sourceFormat) md += `source: ${doc.metadata.sourceFormat}\n`;
      if (doc.metadata.isScanned) {
        md += `ocr_engine: ${doc.metadata.ocrEngine ?? 'unknown'}\n`;
        md += `ocr_confidence: ${doc.metadata.ocrConfidence?.toFixed(1) ?? 'N/A'}%\n`;
      }
      md += '---\n\n';
    }

    // OCR provenance note
    if (doc.metadata.isScanned) {
      md += `> *Extracted via OCR (${doc.metadata.ocrEngine ?? 'unknown'}, confidence: ${doc.metadata.ocrConfidence?.toFixed(1) ?? 'N/A'}%)*\n\n`;
    }

    // Render sections recursively
    md += renderSections(doc.sections);

    const fileName = (doc.metadata.title || 'document').replace(/[^a-zA-Z0-9-_ ]/g, '').trim().replace(/\s+/g, '-').toLowerCase();
    const filePath = join(options.outputDir, `${fileName}.md`);
    writeFileSync(filePath, md, 'utf-8');

    const totalTokens = chunks.reduce((sum, c) => sum + c.metadata.tokenCount, 0);

    return {
      files: [filePath],
      qualityScore: 0, // Set by quality scorer
      stats: {
        totalChunks: chunks.length,
        totalTokens,
        avgChunkSize: chunks.length > 0 ? Math.round(totalTokens / chunks.length) : 0,
        processingTimeMs: Date.now() - start,
      },
    };
  }
}

function renderSections(sections: Section[], depth = 0): string {
  let md = '';
  for (const section of sections) {
    if (section.content.trim()) {
      md += section.content.trim() + '\n\n';
    }
    if (section.children.length > 0) {
      md += renderSections(section.children, depth + 1);
    }
  }
  return md;
}
