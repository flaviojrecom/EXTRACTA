// Core types
export type { IPipelineStage, StageOptions } from './core/types.js';

// Document types
export type {
  StructuredDocument,
  Section,
  SectionMetadata,
  QualityIndicators,
} from './core/document.js';

// Extractor types
export type {
  IExtractor,
  ExtractionResult,
  FileMetadata,
  DocumentMetadata,
} from './extractors/types.js';

// Chunker types
export type {
  ITokenizer,
  ChunkOptions,
  Chunk,
  ChunkMetadata,
} from './chunker/types.js';

// Exporter types
export type {
  IExporter,
  ExportFormat,
  ExportOptions,
  ExportResult,
  ExportStats,
  Preset,
} from './exporters/types.js';

// Errors
export {
  ExtractaError,
  UnsupportedFormatError,
  ScannedPdfError,
  ExtractionError,
  EmptyDocumentError,
} from './core/errors.js';

// Pipeline
export { PipelineRunner } from './pipeline/runner.js';
export type { PipelineConfig } from './pipeline/runner.js';
