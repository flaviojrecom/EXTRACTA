# EXTRACTA

AI-Powered Knowledge Extraction Engine — Transform documents into AI-ready knowledge.

## Setup

```bash
npm install
npm run build
```

## Usage

```bash
# Process a single file with RAG preset (default)
extracta process document.pdf

# Use knowledge-base preset (full hierarchy, no chunking overhead)
extracta process document.pdf --preset knowledge-base

# Fine-tuning preset (JSONL output, aggressive cleaning)
extracta process document.epub --preset fine-tuning

# Custom format and chunk size
extracta process document.pdf --format md,json --chunk-size 500

# Batch mode — process all supported files in a directory
extracta process ./documents/ --preset rag --output ./results

# Dry run (analyze without exporting)
extracta process document.pdf --dry-run

# Verbose output with detailed progress
extracta process document.pdf --verbose

# Skip cache, force full reprocessing
extracta process document.pdf --no-cache
```

### CLI Options

```
extracta process <file|dir> [options]

  --preset <preset>      Processing preset: knowledge-base, rag, fine-tuning (default: rag)
  --format <formats>     Output formats, comma-separated: md, json, jsonl, txt
                         (default: derived from preset)
  --output <dir>         Output directory (default: ./output)
  --chunk-size <tokens>  Target tokens per chunk (default: 750)
  --no-cache             Disable extraction cache
  --verbose              Show detailed progress and metadata
  --dry-run              Analyze document without exporting
```

## Presets

| Preset | Cleaning | Chunking | Export | Use Case |
|--------|----------|----------|--------|----------|
| `knowledge-base` | light | standard | `.md` | Documentation, wikis |
| `rag` | standard | semantic overlap | `.json` | RAG retrieval systems |
| `fine-tuning` | aggressive | by section | `.jsonl` | LLM fine-tuning datasets |

## Output Formats

- **Markdown (.md)** — Full document with hierarchy, metadata frontmatter
- **JSON (.json)** — Structured data with metadata, sections, and chunks
- **JSONL (.jsonl)** — One chunk per line, ready for fine-tuning pipelines
- **Plain Text (.txt)** — Clean text without any formatting

## Quality Score

Each processing run produces a quality score (0-100) based on:

| Dimension | Weight | What it measures |
|-----------|--------|------------------|
| Structure | 40% | Heading detection accuracy, hierarchy depth |
| Chunk Consistency | 30% | Chunks within target range, size variance |
| Metadata | 30% | Title, author, language, chapter/section coverage |

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

**StandardHTML** is the intermediate format between extraction and processing. All extractors produce HTML using a permitted subset of tags.

## Cache

EXTRACTA caches the extraction result (StandardHTML) based on SHA-256 hash of the input file. The cache is stored in `.extracta-cache/` relative to the input file.

- Cache is used by default for faster reprocessing
- Use `--no-cache` to force full reprocessing
- Delete `.extracta-cache/` to clear the cache

## Supported Formats

| Format | Status |
|--------|--------|
| PDF (text-based) | ✓ Implemented |
| EPUB | ✓ Implemented |
| TXT | ✓ Implemented |

## Core Interfaces

| Interface | Location | Purpose |
|-----------|----------|---------|
| `IPipelineStage<TInput, TOutput>` | `src/core/types.ts` | Generic pipeline stage contract |
| `IExtractor` | `src/extractors/types.ts` | Document extraction (Buffer → HTML) |
| `IExporter` | `src/exporters/types.ts` | Output generation (Document + Chunks → files) |
| `ITokenizer` | `src/chunker/types.ts` | Token counting (cl100k_base) |
| `StructuredDocument` | `src/core/document.ts` | Internal document tree with sections |

## Project Structure

```
src/
├── cli/
│   ├── index.ts              # CLI entry point
│   └── commands/process.ts   # process command (single + batch)
├── core/
│   ├── types.ts              # IPipelineStage, StageOptions
│   ├── document.ts           # StructuredDocument, Section
│   ├── standard-html.ts      # StandardHTML validation
│   └── errors.ts             # Error hierarchy
├── extractors/
│   ├── pdf-text.ts           # PDF extractor (pdf-parse)
│   ├── epub.ts               # EPUB extractor (jszip + cheerio)
│   ├── txt.ts                # TXT extractor
│   └── registry.ts           # Format detection + extractor lookup
├── pipeline/
│   ├── runner.ts             # PipelineRunner (orchestrator)
│   ├── normalizer.ts         # Encoding, whitespace, Unicode
│   ├── cleaner.ts            # Noise removal (3 levels)
│   ├── structure-builder.ts  # Hierarchy reconstruction
│   ├── heading-detector.ts   # Multi-signal heading detection
│   ├── markdown-generator.ts # HTML → Markdown
│   └── language-detector.ts  # Stopwords-based (EN/PT/ES)
├── chunker/
│   ├── chunker.ts            # Smart chunking engine
│   ├── tokenizer.ts          # js-tiktoken (cl100k_base)
│   └── sentence-boundary.ts  # Sentence detection
├── exporters/
│   ├── markdown.ts           # .md exporter
│   ├── json.ts               # .json exporter
│   ├── jsonl.ts              # .jsonl exporter
│   └── plain-text.ts         # .txt exporter
├── quality/
│   └── scorer.ts             # Quality score calculator
├── cache/
│   └── file-cache.ts         # SHA-256 based file cache
└── index.ts                  # Barrel exports
```

## Development

```bash
npm test             # Run tests (201 tests)
npm run lint         # ESLint check
npm run typecheck    # TypeScript check
npm run format       # Prettier format
npm run build        # Production build
```

## Troubleshooting

**"Unsupported format" error**: EXTRACTA supports `.pdf`, `.epub`, and `.txt` files only.

**PDF extraction fails**: Scanned PDFs (image-only) are not supported in the MVP. The file must contain extractable text.

**Slow first run**: The tokenizer (js-tiktoken) loads lazily on first use. Subsequent runs are faster.

**Cache issues**: Delete `.extracta-cache/` or use `--no-cache` flag.

## License

Private
