# EXTRACTA — OCR Architecture for Scanned PDFs

## 1. Problem Statement

EXTRACTA currently rejects scanned PDFs via `ScannedPdfError` when avg chars/page < 50. This architecture introduces OCR capability to extract text from scanned PDFs, integrating seamlessly with the existing pipeline.

## 2. Architecture Overview

```
  Input PDF ──→ [PdfTextExtractor]
                      │
                      ├── Text PDF (>50 chars/page) ──→ StandardHTML ──→ Pipeline continues...
                      │
                      └── ScannedPdfError thrown
                              │
                              ▼
                    [ExtractorRegistry: fallback]
                              │
                              ▼
                    [PdfOcrExtractor]
                        │
                        ├── 1. Rasterize (PDF → page images)
                        │       └── pdfjs-dist + node-canvas
                        │
                        ├── 2. Pre-process (optional)
                        │       └── Grayscale, contrast, deskew
                        │
                        ├── 3. OCR (image → text per page)
                        │       └── Tesseract.js (WASM, local)
                        │
                        ├── 4. Assemble (pages → StandardHTML)
                        │       └── <article><section data-page="N">...</section></article>
                        │
                        └── 5. Return ExtractionResult
                                └── { html, metadata: { isScanned: true }, warnings }
```

## 3. Design Decisions

### D1: Local-first OCR (Tesseract.js)
- **Decision:** Use Tesseract.js (WASM) as primary OCR engine
- **Rationale:** Zero cost, no API keys, works offline, sufficient quality for most scanned documents
- **Trade-off:** Slower than cloud APIs, lower accuracy on complex layouts
- **Future:** OcrProvider interface allows plugging Google Vision / AWS Textract later

### D2: Fallback Chain in Registry (not wrapping)
- **Decision:** Registry handles ScannedPdfError → routes to PdfOcrExtractor
- **Rationale:** Keeps extractors independent, single responsibility. PdfTextExtractor stays clean.
- **Alternative rejected:** Wrapping PdfTextExtractor to catch its own error — violates SRP

### D3: Page-level rasterization with pdfjs-dist
- **Decision:** Use pdfjs-dist (Mozilla's PDF.js for Node) to render pages to canvas
- **Rationale:** Pure JS, no system dependencies like graphicsmagick. Works cross-platform.
- **Dependency:** Requires `canvas` npm package (node-canvas) for server-side rendering

### D4: Configurable OCR via PipelineConfig
- **Decision:** Add `ocr` options to PipelineConfig
- **Rationale:** Users should control language, DPI, and whether OCR is enabled at all

## 4. Component Design

### 4.1 New Files

```
src/extractors/
  pdf-ocr.ts              ← PdfOcrExtractor (implements IExtractor)
  ocr/
    types.ts              ← OcrProvider interface, OcrConfig, OcrPageResult
    tesseract-provider.ts ← TesseractOcrProvider (implements OcrProvider)
    rasterizer.ts         ← PdfRasterizer (PDF → page images via pdfjs-dist)
```

### 4.2 Interfaces

```typescript
// src/extractors/ocr/types.ts

export interface OcrConfig {
  /** OCR language(s) — Tesseract format. Default: 'eng' */
  language: string;
  /** Render DPI for rasterization. Default: 300 */
  dpi: number;
  /** Max concurrent pages to OCR. Default: 4 */
  concurrency: number;
  /** Confidence threshold (0-100). Below this, add warning. Default: 60 */
  confidenceThreshold: number;
}

export const DEFAULT_OCR_CONFIG: OcrConfig = {
  language: 'eng',
  dpi: 300,
  concurrency: 4,
  confidenceThreshold: 60,
};

export interface OcrPageResult {
  pageNumber: number;
  text: string;
  confidence: number;
  warnings: string[];
}

export interface OcrProvider {
  name: string;
  initialize(config: OcrConfig): Promise<void>;
  recognizePage(imageBuffer: Buffer, pageNumber: number): Promise<OcrPageResult>;
  terminate(): Promise<void>;
}
```

### 4.3 PdfRasterizer

```typescript
// src/extractors/ocr/rasterizer.ts

export interface RasterizedPage {
  pageNumber: number;
  imageBuffer: Buffer;  // PNG buffer
  width: number;
  height: number;
}

export class PdfRasterizer {
  /**
   * Convert PDF buffer to array of page images.
   * Uses pdfjs-dist to render each page to a node-canvas,
   * then exports as PNG buffer.
   */
  async rasterize(pdfBuffer: Buffer, dpi: number): Promise<RasterizedPage[]>;

  /**
   * Rasterize a single page (for streaming/memory efficiency).
   */
  async rasterizePage(pdfBuffer: Buffer, pageNumber: number, dpi: number): Promise<RasterizedPage>;
}
```

**Implementation notes:**
- Scale factor = `dpi / 72` (PDF default is 72 DPI)
- Use `pdfjs-dist/legacy/build/pdf.mjs` for Node.js compatibility
- Canvas created per page, disposed after PNG export to limit memory

### 4.4 TesseractOcrProvider

```typescript
// src/extractors/ocr/tesseract-provider.ts

import { createWorker, type Worker } from 'tesseract.js';
import type { OcrProvider, OcrConfig, OcrPageResult } from './types.js';

export class TesseractOcrProvider implements OcrProvider {
  name = 'tesseract';
  private workers: Worker[] = [];

  async initialize(config: OcrConfig): Promise<void> {
    // Create worker pool based on concurrency config
    // Each worker loads language data once
  }

  async recognizePage(imageBuffer: Buffer, pageNumber: number): Promise<OcrPageResult> {
    // Get available worker from pool
    // Run recognition
    // Return text + confidence score
  }

  async terminate(): Promise<void> {
    // Terminate all workers, free WASM memory
  }
}
```

**Implementation notes:**
- Worker pool pattern: create N workers at init, reuse across pages
- Tesseract.js v5+ uses WASM, no native binaries needed
- Language data downloaded on first use, cached in `node_modules/.cache/tesseract`
- Worker scheduler handles concurrency automatically

### 4.5 PdfOcrExtractor

```typescript
// src/extractors/pdf-ocr.ts

import type { IExtractor, ExtractionResult, FileMetadata } from './types.js';
import type { OcrConfig, OcrProvider } from './ocr/types.js';
import { DEFAULT_OCR_CONFIG } from './ocr/types.js';
import { TesseractOcrProvider } from './ocr/tesseract-provider.js';
import { PdfRasterizer } from './ocr/rasterizer.js';

export class PdfOcrExtractor implements IExtractor {
  supportedExtensions = ['.pdf'];
  private config: OcrConfig;
  private provider: OcrProvider;
  private rasterizer: PdfRasterizer;

  constructor(config?: Partial<OcrConfig>, provider?: OcrProvider) {
    this.config = { ...DEFAULT_OCR_CONFIG, ...config };
    this.provider = provider ?? new TesseractOcrProvider();
    this.rasterizer = new PdfRasterizer();
  }

  canHandle(extension: string, buffer?: Buffer): boolean {
    // Only handles .pdf — but the registry routes here on ScannedPdfError
    return extension.toLowerCase() === '.pdf';
  }

  async extract(input: Buffer, metadata?: FileMetadata): Promise<ExtractionResult> {
    // 1. Initialize OCR provider
    // 2. Rasterize all pages
    // 3. OCR each page (concurrent, up to config.concurrency)
    // 4. Assemble StandardHTML
    // 5. Terminate provider
    // 6. Return result with isScanned: true
  }
}
```

### 4.6 StandardHTML Output Format (OCR)

```html
<article data-source="ocr" data-confidence="78.5">
  <section data-page="1">
    <p>Text extracted from page 1...</p>
    <p>Second paragraph from page 1...</p>
  </section>
  <section data-page="2">
    <p>Text extracted from page 2...</p>
  </section>
</article>
```

- `data-source="ocr"` — marks provenance for downstream quality scoring
- `data-confidence` — average OCR confidence across all pages
- `data-page` — preserves page boundaries for structure builder

## 5. Registry Integration (Fallback Chain)

### Current behavior:
```
registry.getExtractor('.pdf') → PdfTextExtractor → ScannedPdfError → CRASH
```

### New behavior:
```
registry.getExtractor('.pdf') → PdfTextExtractor
  ↓ (ScannedPdfError)
registry fallback → PdfOcrExtractor → ExtractionResult { isScanned: true }
```

### Changes to ExtractorRegistry

```typescript
// src/extractors/registry.ts — Changes

export class ExtractorRegistry {
  private extractors: Map<string, IExtractor> = new Map();
  private fallbacks: Map<string, IExtractor> = new Map();  // NEW

  private registerDefaults(): void {
    // ... existing registrations ...
    const pdfOcr = new PdfOcrExtractor();
    for (const ext of pdfOcr.supportedExtensions) {
      this.fallbacks.set(ext, pdfOcr);  // Register as fallback
    }
  }

  // NEW: Extract with fallback on ScannedPdfError
  async extractWithFallback(
    extractor: IExtractor,
    input: Buffer,
    metadata: FileMetadata,
  ): Promise<ExtractionResult> {
    try {
      return await extractor.extract(input, metadata);
    } catch (error) {
      if (error instanceof ScannedPdfError) {
        const fallback = this.fallbacks.get(metadata.extension);
        if (fallback) {
          return await fallback.extract(input, metadata);
        }
      }
      throw error;
    }
  }
}
```

### Changes to PipelineRunner

```typescript
// src/pipeline/runner.ts — Changes (minimal)

// Line 77-82: Change from direct extract to extractWithFallback
const extractor = this.extractorRegistry.getExtractor(ext, buffer);
const extraction = await this.extractorRegistry.extractWithFallback(
  extractor,
  buffer,
  { fileName: basename(filePath), extension: ext, sizeBytes: buffer.length },
);
```

## 6. PipelineConfig Extension

```typescript
// Add to PipelineConfig interface:
export interface PipelineConfig {
  // ... existing fields ...
  ocr?: {
    enabled: boolean;      // Default: true (auto-fallback on scanned PDFs)
    language: string;       // Default: 'eng'
    dpi: number;            // Default: 300
    concurrency: number;    // Default: 4
  };
}
```

### CLI Extension

```
extracta process document.pdf --ocr-language por --ocr-dpi 200
```

New CLI options:
- `--no-ocr` — Disable OCR fallback (keep current behavior: error on scanned)
- `--ocr-language <lang>` — Tesseract language code (default: eng)
- `--ocr-dpi <number>` — Render resolution (default: 300)

## 7. Dependencies

### New npm packages:

| Package | Purpose | Size | Note |
|---------|---------|------|------|
| `tesseract.js` | OCR engine (WASM) | ~800KB + language data | Language data ~4MB per lang, cached |
| `pdfjs-dist` | PDF rasterization | ~2.5MB | Mozilla's PDF.js |
| `canvas` | Node canvas for pdfjs | Native addon | Requires build tools on first install |

### Install command:
```bash
npm install tesseract.js pdfjs-dist canvas
```

### System requirements:
- `canvas` needs: `cairo`, `pango`, `libjpeg`, `giflib`, `librsvg`
- macOS: `brew install pkg-config cairo pango libpng jpeg giflib librsvg`
- Ubuntu: `apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev`

## 8. Performance Considerations

### Memory
- **Risk:** Large PDFs (100+ pages) at 300 DPI = ~50MB/page in memory
- **Mitigation:** Process one page at a time (streaming), dispose canvas after PNG export
- **Config:** `concurrency` limits parallel page processing

### Speed
- **Tesseract.js:** ~2-5 seconds per page at 300 DPI (depending on content density)
- **Rasterization:** ~0.5-1 second per page
- **Total estimate:** 100-page PDF ≈ 4-10 minutes
- **Progress callback:** Report per-page progress via existing `ProgressCallback`

### Caching
- OCR results should be cached using existing `FileCache`
- Cache key: file hash (already implemented)
- Avoids re-OCR on repeated processing

## 9. Quality & Confidence Tracking

### OCR-specific quality indicators:
```typescript
// Extension to DocumentMetadata
interface DocumentMetadata {
  // ... existing fields ...
  isScanned: boolean;        // true when OCR was used
  ocrConfidence?: number;    // Average confidence 0-100
  ocrEngine?: string;        // 'tesseract' | 'google-vision' | etc.
  lowConfidencePages?: number[];  // Pages below threshold
}
```

### Impact on Quality Score:
- OCR documents start with a penalty factor on `structurePreserved` (OCR loses formatting)
- `ocrConfidence` feeds into `metadataCompleteness` scoring
- Low confidence pages generate warnings in ExtractionResult

## 10. Error Handling

| Scenario | Behavior |
|----------|----------|
| Tesseract fails to initialize | Throw `ExtractionError` with helpful message about dependencies |
| Single page fails OCR | Skip page, add warning, continue with remaining pages |
| All pages fail OCR | Throw `ExtractionError` (recoverable: false) |
| Canvas not installed | Throw `ExtractionError` with install instructions |
| Language data not found | Auto-download on first use (Tesseract.js default) |
| Memory exceeded | Reduce concurrency to 1, retry. If still fails, throw. |

## 11. Future Extensions (Not in scope now)

1. **Cloud OCR Providers:** Google Vision, AWS Textract via `OcrProvider` interface
2. **Layout Analysis:** Table detection, column detection for complex scanned documents
3. **Image Pre-processing:** Deskew, denoise, binarization for low-quality scans
4. **Mixed PDFs:** Some pages text, some scanned — process each accordingly
5. **Handwriting Recognition:** Specialized models for handwritten content

## 12. Implementation Plan (Stories)

### Story 1.7: PDF OCR Extraction — Core
**Scope:**
- [ ] Create `src/extractors/ocr/types.ts` (interfaces)
- [ ] Create `src/extractors/ocr/rasterizer.ts` (PdfRasterizer)
- [ ] Create `src/extractors/ocr/tesseract-provider.ts` (TesseractOcrProvider)
- [ ] Create `src/extractors/pdf-ocr.ts` (PdfOcrExtractor)
- [ ] Update `src/extractors/registry.ts` (fallback chain)
- [ ] Update `src/pipeline/runner.ts` (extractWithFallback)
- [ ] Unit tests for all components
- [ ] Integration test with real scanned PDF

### Story 1.8: OCR CLI Integration & Config
**Scope:**
- [ ] Add OCR options to PipelineConfig
- [ ] Add CLI flags (--no-ocr, --ocr-language, --ocr-dpi)
- [ ] Update process.ts SUPPORTED_EXTENSIONS note
- [ ] Progress reporting per page during OCR
- [ ] Update quality scorer for OCR documents

### Story 1.9: OCR Quality & Confidence
**Scope:**
- [ ] Extend DocumentMetadata with OCR fields
- [ ] Confidence tracking per page
- [ ] Quality score adjustments for OCR content
- [ ] Low-confidence warnings in output
- [ ] OCR provenance in exported files

---

*Architecture by Aria — 🏛️ Architect Agent*
*EXTRACTA OCR Architecture v1.0*
