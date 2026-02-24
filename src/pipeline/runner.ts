import { readFileSync } from 'node:fs';
import { extname, basename, dirname } from 'node:path';
import type { Chunk, ChunkOptions } from '../chunker/types.js';
import { SmartChunker } from '../chunker/chunker.js';
import { FileCache } from '../cache/file-cache.js';
import type { StructuredDocument } from '../core/document.js';
import type { ExportFormat, ExportResult, Preset } from '../exporters/types.js';
import { MarkdownExporter } from '../exporters/markdown.js';
import { JsonExporter } from '../exporters/json.js';
import { JsonlExporter } from '../exporters/jsonl.js';
import { PlainTextExporter } from '../exporters/plain-text.js';
import { computeQualityScore, type QualityBreakdown } from '../quality/scorer.js';
import { ExtractorRegistry } from '../extractors/registry.js';
import { PdfOcrExtractor } from '../extractors/pdf-ocr.js';
import { Normalizer } from './normalizer.js';
import { Cleaner, type CleanerResult, type CleaningLevel } from './cleaner.js';
import { StructureBuilder } from './structure-builder.js';

export interface OcrPipelineOptions {
  enabled: boolean;
  language: string;
  dpi: number;
  concurrency: number;
}

export const DEFAULT_OCR_PIPELINE_OPTIONS: OcrPipelineOptions = {
  enabled: true,
  language: 'eng',
  dpi: 300,
  concurrency: 4,
};

export interface PipelineConfig {
  cleaningLevel: CleaningLevel;
  chunkOptions: ChunkOptions;
  exportFormats: ExportFormat[];
  preset: Preset;
  cache: boolean;
  verbose: boolean;
  outputDir?: string;
  ocr?: Partial<OcrPipelineOptions>;
}

export interface PipelineResult {
  html: string;
  document: StructuredDocument;
  chunks: Chunk[];
  exportResults: ExportResult[];
  qualityScore: QualityBreakdown;
  cleanerAuditLog: CleanerResult['auditLog'];
}

const EXPORTERS = {
  md: new MarkdownExporter(),
  json: new JsonExporter(),
  jsonl: new JsonlExporter(),
  txt: new PlainTextExporter(),
};

export type ProgressCallback = (stage: string, step: number, total: number, message?: string) => void;

export class PipelineRunner {
  private readonly config: PipelineConfig;
  private readonly extractorRegistry: ExtractorRegistry;
  private readonly normalizer: Normalizer;
  private readonly cleaner: Cleaner;

  constructor(config: PipelineConfig) {
    this.config = config;
    const ocrOpts = { ...DEFAULT_OCR_PIPELINE_OPTIONS, ...config.ocr };
    this.extractorRegistry = new ExtractorRegistry({ ocrEnabled: ocrOpts.enabled });

    // If OCR enabled with custom config, replace default fallback with configured one
    if (ocrOpts.enabled && config.ocr) {
      const ocrExtractor = new PdfOcrExtractor({
        language: ocrOpts.language,
        dpi: ocrOpts.dpi,
        concurrency: ocrOpts.concurrency,
      });
      this.extractorRegistry.registerFallback(ocrExtractor);
    }

    this.normalizer = new Normalizer();
    this.cleaner = new Cleaner(config.cleaningLevel);
  }

  async run(filePath: string, onProgress?: ProgressCallback): Promise<PipelineResult> {
    const totalSteps = 7;
    const log = onProgress ?? (this.config.verbose
      ? (stage: string, _step: number, _total: number, msg?: string) =>
          console.log(`[pipeline] ${stage}${msg ? ': ' + msg : ''}`)
      : undefined);

    // 1. Analyze
    log?.('analyze', 1, totalSteps, `File: ${filePath}`);
    const ext = extname(filePath).toLowerCase();
    const buffer = readFileSync(filePath);

    // Check cache
    const cache = this.config.cache ? new FileCache(dirname(filePath)) : null;
    const hash = cache ? FileCache.hashContent(buffer) : '';

    // 2. Extract (with OCR fallback for scanned PDFs)
    log?.('extract', 2, totalSteps, `Format: ${ext}`);
    const extractor = this.extractorRegistry.getExtractor(ext, buffer);
    const fileMetadata = { fileName: basename(filePath), extension: ext, sizeBytes: buffer.length };
    const extraction = await this.extractorRegistry.extractWithFallback(
      extractor,
      buffer,
      fileMetadata,
      log ? (page, total) => log('extract', 2, totalSteps, `OCR page ${page}/${total}`) : undefined,
    );

    // 3. Normalize
    log?.('normalize', 3, totalSteps);
    let normalizedHtml: string;

    const cached = cache?.get(hash);
    if (cached) {
      log?.('normalize', 3, totalSteps, 'Using cached result');
      normalizedHtml = cached.html;
    } else {
      normalizedHtml = await this.normalizer.process(extraction.html, {
        verbose: this.config.verbose,
      });
    }

    // 4. Clean
    log?.('clean', 4, totalSteps, `Level: ${this.config.cleaningLevel}`);
    const cleanerResult = await this.cleaner.process(normalizedHtml, {
      verbose: this.config.verbose,
    });

    // Cache after extraction+normalization (most expensive steps)
    if (cache && !cached) {
      cache.set(hash, { html: normalizedHtml, metadata: extraction.metadata as unknown as Record<string, unknown> });
    }

    // 5. Structure
    log?.('structure', 5, totalSteps);
    const structureBuilder = new StructureBuilder(extraction.metadata);
    const document = await structureBuilder.process(cleanerResult.html, {
      verbose: this.config.verbose,
    });
    log?.('structure', 5, totalSteps, `Sections: ${document.sections.length}`);

    // 6. Chunk
    log?.('chunk', 6, totalSteps);
    const chunker = new SmartChunker(this.config.chunkOptions);
    const chunks = await chunker.process(document, {
      verbose: this.config.verbose,
    });
    log?.('chunk', 6, totalSteps, `${chunks.length} chunks`);

    // Quality score
    const qualityScore = computeQualityScore(document, chunks, this.config.chunkOptions);

    // 7. Export
    log?.('export', 7, totalSteps, `Formats: ${this.config.exportFormats.join(', ')}`);
    const exportResults: ExportResult[] = [];
    const outputDir = this.config.outputDir || './output';
    const includeMetadata = this.config.preset !== 'fine-tuning';

    for (const format of this.config.exportFormats) {
      const exporter = EXPORTERS[format];
      if (exporter) {
        const result = await exporter.export(document, chunks, {
          outputDir,
          preset: this.config.preset,
          includeMetadata,
        });
        result.qualityScore = qualityScore.overall;
        exportResults.push(result);
      }
    }

    return {
      html: cleanerResult.html,
      document,
      chunks,
      exportResults,
      qualityScore,
      cleanerAuditLog: cleanerResult.auditLog,
    };
  }
}
