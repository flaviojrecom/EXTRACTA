import { readFileSync } from 'node:fs';
import { extname, basename } from 'node:path';
import type { Chunk, ChunkOptions } from '../chunker/types.js';
import { SmartChunker } from '../chunker/chunker.js';
import type { StructuredDocument } from '../core/document.js';
import type { ExportFormat, Preset } from '../exporters/types.js';
import { ExtractorRegistry } from '../extractors/registry.js';
import { Normalizer } from './normalizer.js';
import { Cleaner, type CleanerResult, type CleaningLevel } from './cleaner.js';
import { StructureBuilder } from './structure-builder.js';

export interface PipelineConfig {
  cleaningLevel: CleaningLevel;
  chunkOptions: ChunkOptions;
  exportFormats: ExportFormat[];
  preset: Preset;
  cache: boolean;
  verbose: boolean;
}

export interface PipelineResult {
  html: string;
  document: StructuredDocument;
  chunks: Chunk[];
  cleanerAuditLog: CleanerResult['auditLog'];
}

export class PipelineRunner {
  private readonly config: PipelineConfig;
  private readonly extractorRegistry: ExtractorRegistry;
  private readonly normalizer: Normalizer;
  private readonly cleaner: Cleaner;

  constructor(config: PipelineConfig) {
    this.config = config;
    this.extractorRegistry = new ExtractorRegistry();
    this.normalizer = new Normalizer();
    this.cleaner = new Cleaner(config.cleaningLevel);
  }

  async run(filePath: string): Promise<PipelineResult> {
    const log = this.config.verbose
      ? (stage: string, msg?: string) => console.log(`[pipeline] ${stage}${msg ? ': ' + msg : ''}`)
      : undefined;

    // Analyze
    log?.('analyze', `File: ${filePath}`);
    const ext = extname(filePath).toLowerCase();
    const buffer = readFileSync(filePath);

    // Extract
    log?.('extract', `Format: ${ext}`);
    const extractor = this.extractorRegistry.getExtractor(ext, buffer);
    const extraction = await extractor.extract(buffer, {
      fileName: basename(filePath),
      extension: ext,
      sizeBytes: buffer.length,
    });
    log?.('extract', `Pages: ${extraction.metadata.pageCount ?? 'N/A'}, Warnings: ${extraction.warnings.length}`);

    // Normalize
    log?.('normalize');
    const normalizedHtml = await this.normalizer.process(extraction.html, {
      verbose: this.config.verbose,
    });

    // Clean
    log?.('clean', `Level: ${this.config.cleaningLevel}`);
    const cleanerResult = await this.cleaner.process(normalizedHtml, {
      verbose: this.config.verbose,
    });
    log?.('clean', `Removals: ${cleanerResult.auditLog.length}`);

    // Structure
    log?.('structure');
    const structureBuilder = new StructureBuilder(extraction.metadata);
    const document = await structureBuilder.process(cleanerResult.html, {
      verbose: this.config.verbose,
    });
    log?.('structure', `Sections: ${document.sections.length}, Language: ${document.metadata.language ?? 'unknown'}`);

    // Chunk
    log?.('chunk');
    const chunker = new SmartChunker(this.config.chunkOptions);
    const chunks = await chunker.process(document, {
      verbose: this.config.verbose,
    });
    log?.('chunk', `${chunks.length} chunks created`);

    // Export — stub for future story
    log?.('export', '(stub)');

    return {
      html: cleanerResult.html,
      document,
      chunks,
      cleanerAuditLog: cleanerResult.auditLog,
    };
  }
}
