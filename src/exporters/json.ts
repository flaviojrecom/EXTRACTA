import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import type { StructuredDocument } from '../core/document.js';
import type { Chunk } from '../chunker/types.js';
import type { IExporter, ExportOptions, ExportResult } from './types.js';

export class JsonExporter implements IExporter {
  format = 'json' as const;

  async export(
    doc: StructuredDocument,
    chunks: Chunk[],
    options: ExportOptions,
  ): Promise<ExportResult> {
    const start = Date.now();
    mkdirSync(options.outputDir, { recursive: true });

    const output: Record<string, unknown> = {
      metadata: doc.metadata,
      qualityIndicators: doc.qualityIndicators,
    };

    if (options.includeMetadata) {
      output.sections = doc.sections.map((s) => ({
        id: s.id,
        title: s.title,
        level: s.level,
        meta: s.meta,
        childCount: s.children.length,
      }));
    }

    output.chunks = chunks.map((c) => ({
      id: c.id,
      content: c.content,
      metadata: c.metadata,
    }));

    const fileName = (doc.metadata.title || 'document').replace(/[^a-zA-Z0-9-_ ]/g, '').trim().replace(/\s+/g, '-').toLowerCase();
    const filePath = join(options.outputDir, `${fileName}.json`);
    writeFileSync(filePath, JSON.stringify(output, null, 2), 'utf-8');

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
