import type { StructuredDocument } from '../core/document.js';
import type { Chunk } from '../chunker/types.js';

export interface IExporter {
  format: ExportFormat;
  export(
    doc: StructuredDocument,
    chunks: Chunk[],
    options: ExportOptions,
  ): Promise<ExportResult>;
}

export type ExportFormat = 'md' | 'json' | 'jsonl' | 'txt';

export interface ExportOptions {
  outputDir: string;
  preset: Preset;
  includeMetadata: boolean;
}

export type Preset = 'knowledge-base' | 'rag' | 'fine-tuning';

export interface ExportResult {
  files: string[];
  qualityScore: number;
  stats: ExportStats;
}

export interface ExportStats {
  totalChunks: number;
  totalTokens: number;
  avgChunkSize: number;
  processingTimeMs: number;
}
