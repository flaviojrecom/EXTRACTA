import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import type { StructuredDocument } from '../core/document.js';
import type { Chunk } from '../chunker/types.js';
import type { IExporter, ExportOptions, ExportResult } from './types.js';

export class JsonlExporter implements IExporter {
  format = 'jsonl' as const;

  async export(
    doc: StructuredDocument,
    chunks: Chunk[],
    options: ExportOptions,
  ): Promise<ExportResult> {
    const start = Date.now();
    mkdirSync(options.outputDir, { recursive: true });

    const lines: string[] = [];

    for (const chunk of chunks) {
      const record: Record<string, unknown> = {
        text: chunk.content,
        chunk_id: chunk.id,
        token_count: chunk.metadata.tokenCount,
      };

      if (options.includeMetadata) {
        record.metadata = {
          title: doc.metadata.title,
          chapter: chunk.metadata.chapterTitle,
          section: chunk.metadata.sectionTitle,
          position: chunk.metadata.position,
        };
      }

      lines.push(JSON.stringify(record));
    }

    const fileName = (doc.metadata.title || 'document').replace(/[^a-zA-Z0-9-_ ]/g, '').trim().replace(/\s+/g, '-').toLowerCase();
    const filePath = join(options.outputDir, `${fileName}.jsonl`);
    writeFileSync(filePath, lines.join('\n') + '\n', 'utf-8');

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
