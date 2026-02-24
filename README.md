# EXTRACTA

AI-Powered Knowledge Extraction Engine — Transform documents into AI-ready knowledge.

## Setup

```bash
npm install
npm run build
```

## Usage

```bash
# Process a document with default settings (knowledge-base preset)
extracta process document.pdf

# Use a specific preset
extracta process document.pdf --preset rag

# Export as JSON with custom chunk size
extracta process document.pdf --format json --chunk-size 256

# Dry run (show what would happen)
extracta process document.pdf --dry-run --verbose

# All options
extracta process <file> [options]
  --preset <preset>      Export preset: knowledge-base, rag, fine-tuning (default: knowledge-base)
  --format <format>      Output format: markdown, json, jsonl (default: markdown)
  --output <dir>         Output directory (default: ./output)
  --chunk-size <tokens>  Target tokens per chunk (default: 512)
  --no-cache             Disable extraction cache
  --verbose              Show detailed progress
  --dry-run              Analyze without processing
```

## Pipeline Architecture

```
Input File
    │
    ▼
┌──────────┐   ┌───────────┐   ┌────────────┐   ┌─────────┐
│ Analyzer │──▶│ Extractor │──▶│ Normalizer │──▶│ Cleaner │
└──────────┘   └───────────┘   └────────────┘   └─────────┘
                                                      │
    ┌─────────────────────────────────────────────────┘
    ▼
┌───────────────────┐   ┌─────────┐   ┌──────────┐
│ Structure Builder │──▶│ Chunker │──▶│ Exporter │
└───────────────────┘   └─────────┘   └──────────┘
```

**StandardHTML** is the intermediate format between extraction and processing stages. All extractors produce HTML using a permitted subset of tags.

## Core Interfaces

| Interface | Location | Purpose |
|-----------|----------|---------|
| `IPipelineStage<TInput, TOutput>` | `src/core/types.ts` | Generic pipeline stage contract |
| `IExtractor` | `src/extractors/types.ts` | Document extraction (Buffer → ExtractionResult) |
| `IExporter` | `src/exporters/types.ts` | Output generation (StructuredDocument + Chunks → files) |
| `ITokenizer` | `src/chunker/types.ts` | Token counting for chunk sizing |
| `StructuredDocument` | `src/core/document.ts` | Internal document representation with sections |

## Project Structure

```
src/
├── cli/
│   ├── index.ts              # CLI entry point
│   └── commands/process.ts   # process command
├── core/
│   ├── types.ts              # IPipelineStage, StageOptions
│   ├── document.ts           # StructuredDocument, Section
│   └── errors.ts             # Error hierarchy
├── extractors/types.ts       # IExtractor, ExtractionResult
├── pipeline/runner.ts        # PipelineRunner (orchestrator)
├── chunker/types.ts          # ITokenizer, Chunk, ChunkOptions
├── exporters/types.ts        # IExporter, ExportOptions
├── cache/                    # (future) Extraction cache
├── quality/                  # (future) Quality scoring
└── index.ts                  # Barrel exports
```

## Development

```bash
npm run dev          # Run CLI in dev mode
npm test             # Run tests
npm run lint         # ESLint check
npm run typecheck    # TypeScript check
npm run format       # Prettier format
npm run build        # Production build
```

## Supported Formats (MVP)

| Format | Status |
|--------|--------|
| PDF (text-based) | Planned (Story 1.2) |
| EPUB | Planned (Story 1.2) |
| TXT | Planned (Story 1.2) |

## Test Fixtures

Located in `test/fixtures/`:
- `txt/sample.txt` — Sample text document
- `pdf/.gitkeep` — PDF fixtures (add real PDFs for Story 1.2)
- `epub/.gitkeep` — EPUB fixtures (add real EPUBs for Story 1.2)

## License

Private
