# EXTRACTA — Pipeline Architecture

## 1. System Overview

```
                         EXTRACTA Pipeline
                         ─────────────────

  Input File ──→ [Analyzer] ──→ [Extractor] ──→ [Normalizer] ──→ [Cleaner]
  (PDF/EPUB/TXT)     │              │                │               │
                     ▼              ▼                ▼               ▼
               FileAnalysis    StandardHTML      NormalizedHTML   CleanHTML
                                    │
                                    ▼
                          ┌─────────────────┐
                          │  HTML Intermediário  │  ← Lingua Franca
                          │  (StandardHTML)      │
                          └─────────────────┘
                                    │
                                    ▼
                [Structure Builder] ──→ [Chunker] ──→ [Exporter]
                        │                  │              │
                        ▼                  ▼              ▼
                  StructuredDoc       Chunk[]        Output Files
                  (tree + metadata)   (with metadata)  (.md/.json/.jsonl/.txt)
```

## 2. Core Interfaces

### 2.1 Pipeline Stage Interface

```typescript
// src/core/types.ts

/** Every pipeline stage follows this contract */
interface IPipelineStage<TInput, TOutput> {
  name: string;
  process(input: TInput, options?: StageOptions): Promise<TOutput>;
}

interface StageOptions {
  verbose?: boolean;
  onProgress?: (percent: number, message: string) => void;
}
```

### 2.2 Extractor Interface (Adapter Pattern)

```typescript
// src/extractors/types.ts

interface IExtractor {
  /** Supported file extensions (e.g., ['.pdf']) */
  supportedExtensions: string[];

  /** Extract content from raw file buffer → StandardHTML */
  extract(input: Buffer, metadata?: FileMetadata): Promise<ExtractionResult>;

  /** Quick check if this extractor can handle the file */
  canHandle(extension: string, buffer?: Buffer): boolean;
}

interface ExtractionResult {
  html: string;            // StandardHTML content
  metadata: DocumentMetadata;
  warnings: string[];      // Non-fatal issues encountered
}

interface FileMetadata {
  fileName: string;
  extension: string;
  sizeBytes: number;
}

interface DocumentMetadata {
  title?: string;
  author?: string;
  language?: string;
  pageCount?: number;
  isScanned?: boolean;     // PDF only
  sourceFormat: string;
}
```

### 2.3 StandardHTML Schema

The intermediate HTML format that all extractors produce and all downstream stages consume.

```typescript
// src/core/standard-html.ts

/**
 * StandardHTML is a simplified HTML subset.
 * Allowed elements:
 *   - Structure: <article>, <section>, <div>
 *   - Headings:  <h1> through <h6>
 *   - Text:      <p>, <span>, <em>, <strong>, <a>
 *   - Lists:     <ul>, <ol>, <li>
 *   - Tables:    <table>, <thead>, <tbody>, <tr>, <th>, <td>
 *   - Code:      <pre>, <code>
 *   - Quotes:    <blockquote>
 *   - Breaks:    <br>, <hr>
 *
 * NOT allowed (stripped by extractors):
 *   - <script>, <style>, <iframe>, <form>, <input>
 *   - Inline styles (except data attributes for metadata)
 *   - CSS classes (except semantic ones like data-level)
 */
type StandardHTML = string; // Branded type in implementation
```

### 2.4 Document Structure (Post-Structure Builder)

```typescript
// src/core/document.ts

interface StructuredDocument {
  metadata: DocumentMetadata;
  sections: Section[];
  qualityIndicators: QualityIndicators;
}

interface Section {
  id: string;              // e.g., "ch1-s2-ss1"
  level: number;           // 1 = chapter, 2 = section, 3 = subsection
  title: string;
  content: string;         // Markdown content
  children: Section[];
  meta: SectionMetadata;
}

interface SectionMetadata {
  chapter?: string;
  section?: string;
  wordCount: number;
  charCount: number;
}

interface QualityIndicators {
  structurePreserved: number;  // 0-100
  noiseRemoved: number;        // 0-100
  metadataCompleteness: number; // 0-100
}
```

### 2.5 Chunking Interfaces

```typescript
// src/chunker/types.ts

interface ITokenizer {
  encode(text: string): number[];
  countTokens(text: string): number;
  name: string;  // e.g., "cl100k_base"
}

interface ChunkOptions {
  minTokens: number;       // default: 500
  maxTokens: number;       // default: 1000
  targetTokens: number;    // default: 750
  overlapStrategy: 'semantic' | 'fixed';
  preserveStructures: boolean;  // lists, tables, code blocks
}

interface Chunk {
  id: string;              // e.g., "chunk-001"
  content: string;         // Markdown content
  metadata: ChunkMetadata;
}

interface ChunkMetadata {
  chunkId: string;
  chapterTitle?: string;
  sectionTitle?: string;
  tokenCount: number;
  overlapTokens: number;
  position: {
    index: number;         // 0-based chunk index
    total: number;         // total chunks in document
  };
}
```

### 2.6 Exporter Interface (Strategy Pattern)

```typescript
// src/exporters/types.ts

interface IExporter {
  format: ExportFormat;
  export(doc: StructuredDocument, chunks: Chunk[], options: ExportOptions): Promise<ExportResult>;
}

type ExportFormat = 'md' | 'json' | 'jsonl' | 'txt';

interface ExportOptions {
  outputDir: string;
  preset: Preset;
  includeMetadata: boolean;
}

type Preset = 'knowledge-base' | 'rag' | 'fine-tuning';

interface ExportResult {
  files: string[];         // Paths of created files
  qualityScore: number;    // 0-100
  stats: ExportStats;
}

interface ExportStats {
  totalChunks: number;
  totalTokens: number;
  avgChunkSize: number;
  processingTimeMs: number;
}
```

## 3. Pipeline Runner

```typescript
// src/pipeline/runner.ts (conceptual)

interface PipelineConfig {
  cleaningLevel: 'light' | 'standard' | 'aggressive';
  chunkOptions: ChunkOptions;
  exportFormats: ExportFormat[];
  preset: Preset;
  cache: boolean;
  verbose: boolean;
}

/**
 * Pipeline execution order (strictly sequential):
 *
 * 1. Analyze   → Detect file type, validate support
 * 2. Extract   → File → StandardHTML (via appropriate IExtractor)
 * 3. Normalize → Fix encoding, whitespace, hyphens, Unicode
 * 4. Clean     → Remove noise (headers, footers, page numbers, ISBN)
 * 5. Structure → Rebuild hierarchy (chapters, sections, subsections)
 * 6. Chunk     → Split into token-bounded chunks with semantic overlap
 * 7. Export    → Write output files in requested formats
 *
 * Cache checkpoint: After step 2 (StandardHTML cached by file hash)
 */
```

## 4. Project Structure

```
extracta/
├── src/
│   ├── cli/
│   │   ├── index.ts           # CLI entry point (Commander.js)
│   │   └── commands/
│   │       └── process.ts     # `extracta process` command
│   ├── core/
│   │   ├── types.ts           # Shared types & interfaces
│   │   ├── document.ts        # StructuredDocument types
│   │   └── errors.ts          # Custom error classes
│   ├── extractors/
│   │   ├── types.ts           # IExtractor interface
│   │   ├── registry.ts        # Extractor registry (extension → extractor)
│   │   ├── pdf-text.ts        # PdfTextExtractor (pdf-parse)
│   │   ├── epub.ts            # EpubExtractor (jszip + cheerio)
│   │   └── txt.ts             # TxtExtractor
│   ├── pipeline/
│   │   ├── runner.ts          # Pipeline orchestrator
│   │   ├── analyzer.ts        # File analysis stage
│   │   ├── normalizer.ts      # Text normalization stage
│   │   ├── cleaner.ts         # Semantic cleaning stage
│   │   └── structure-builder.ts # Hierarchy reconstruction
│   ├── chunker/
│   │   ├── types.ts           # ITokenizer, ChunkOptions, Chunk
│   │   ├── chunker.ts         # Smart chunking engine
│   │   ├── tokenizer.ts       # tiktoken wrapper (ITokenizer impl)
│   │   └── sentence-boundary.ts # Sentence detection
│   ├── exporters/
│   │   ├── types.ts           # IExporter interface
│   │   ├── markdown.ts        # Markdown exporter
│   │   ├── json.ts            # JSON exporter
│   │   ├── jsonl.ts           # JSONL exporter
│   │   └── txt.ts             # Plain text exporter
│   ├── cache/
│   │   └── file-cache.ts      # Filesystem cache (hash-based)
│   └── quality/
│       └── scorer.ts          # Quality score calculator
├── test/
│   ├── fixtures/              # Sample files for testing
│   │   ├── pdf/               # Sample PDFs
│   │   ├── epub/              # Sample EPUBs
│   │   └── txt/               # Sample TXT files
│   ├── unit/                  # Unit tests (mirrors src/)
│   └── e2e/                   # End-to-end pipeline tests
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

## 5. Data Flow per Preset

### knowledge-base

```
File → Extract → Normalize → Clean(light) → Structure → Export(md)
                                                          ↳ Full hierarchy
                                                          ↳ No chunking
                                                          ↳ Single .md file
```

### rag

```
File → Extract → Normalize → Clean(standard) → Structure → Chunk → Export(json)
                                                             ↳ 500-1000 tokens
                                                             ↳ Semantic overlap
                                                             ↳ Full metadata per chunk
```

### fine-tuning

```
File → Extract → Normalize → Clean(aggressive) → Structure → Chunk → Export(jsonl)
                                                               ↳ Section-based chunks
                                                               ↳ Structured pairs
                                                               ↳ JSONL format
```

## 6. Error Handling Strategy

```typescript
// src/core/errors.ts

class ExtractaError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly stage: string,
    public readonly recoverable: boolean
  ) {
    super(message);
  }
}

// Specific errors
class UnsupportedFormatError extends ExtractaError { /* code: 'UNSUPPORTED_FORMAT' */ }
class ScannedPdfError extends ExtractaError { /* code: 'SCANNED_PDF' */ }
class ExtractionError extends ExtractaError { /* code: 'EXTRACTION_FAILED' */ }
class EmptyDocumentError extends ExtractaError { /* code: 'EMPTY_DOCUMENT' */ }
```

Pipeline stages should:
- Throw specific `ExtractaError` subclasses
- Include the stage name for debugging
- Mark errors as `recoverable` when the pipeline can continue with degraded output
- Log warnings for non-fatal issues (e.g., missing metadata)

## 7. Cache Strategy

```
Cache key: SHA-256 hash of file content
Cache location: .extracta-cache/ (in output dir or temp dir)
Cache structure:
  .extracta-cache/
    {hash}/
      standard.html     # Cached StandardHTML
      metadata.json     # Cached document metadata
      analysis.json     # Cached file analysis

Invalidation: --no-cache flag forces full reprocessing
TTL: None for MVP (manual cleanup)
```

## 8. Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Pipeline model | Sequential, synchronous | Simplicity for MVP. Async queues in Phase 2. |
| Intermediate format | StandardHTML | Universal, parseable, preserves structure. Cheerio works on it. |
| Adapter resolution | Extension + registry | Simple mapping. Magic bytes as secondary check. |
| Chunk overlap | Semantic (sentence boundary) | Better retrieval quality than fixed-token overlap. |
| Cache granularity | Post-extraction | Most expensive step. Re-processing with different presets is cheap. |
| Error strategy | Fail-fast with specific errors | Clear diagnostics. Recoverable flag for future graceful degradation. |
| Monorepo readiness | Single package, clean boundaries | No monorepo tooling overhead yet. Clean interfaces allow split later. |

---

*Architecture designed by Aria (Visionary) — @architect*
*Source: Epic 1 MVP EXTRACTA, PRD, Brainstorming 2026-02-23*
