import { UnsupportedFormatError, ScannedPdfError } from '../core/errors.js';
import type { IExtractor, ExtractionResult, FileMetadata } from './types.js';
import { PdfTextExtractor } from './pdf-text.js';
import { EpubExtractor } from './epub.js';
import { TxtExtractor } from './txt.js';
import { PdfOcrExtractor, type OcrProgressCallback } from './pdf-ocr.js';

export class ExtractorRegistry {
  private extractors: Map<string, IExtractor> = new Map();
  private fallbacks: Map<string, IExtractor> = new Map();

  constructor(options?: { ocrEnabled?: boolean }) {
    this.registerDefaults(options?.ocrEnabled ?? true);
  }

  private registerDefaults(ocrEnabled: boolean): void {
    const pdf = new PdfTextExtractor();
    const epub = new EpubExtractor();
    const txt = new TxtExtractor();

    for (const ext of pdf.supportedExtensions) this.extractors.set(ext, pdf);
    for (const ext of epub.supportedExtensions) this.extractors.set(ext, epub);
    for (const ext of txt.supportedExtensions) this.extractors.set(ext, txt);

    if (ocrEnabled) {
      const pdfOcr = new PdfOcrExtractor();
      for (const ext of pdfOcr.supportedExtensions) {
        this.fallbacks.set(ext, pdfOcr);
      }
    }
  }

  register(extractor: IExtractor): void {
    for (const ext of extractor.supportedExtensions) {
      this.extractors.set(ext, extractor);
    }
  }

  registerFallback(extractor: IExtractor): void {
    for (const ext of extractor.supportedExtensions) {
      this.fallbacks.set(ext, extractor);
    }
  }

  getExtractor(extension: string, buffer?: Buffer): IExtractor {
    const ext = extension.toLowerCase().startsWith('.') ? extension.toLowerCase() : `.${extension.toLowerCase()}`;

    const extractor = this.extractors.get(ext);
    if (extractor) return extractor;

    if (buffer) {
      for (const candidate of new Set(this.extractors.values())) {
        if (candidate.canHandle(ext, buffer)) {
          return candidate;
        }
      }
    }

    throw new UnsupportedFormatError(`Unsupported format: ${ext}`);
  }

  async extractWithFallback(
    extractor: IExtractor,
    input: Buffer,
    metadata: FileMetadata,
    onOcrProgress?: OcrProgressCallback,
  ): Promise<ExtractionResult> {
    try {
      return await extractor.extract(input, metadata);
    } catch (error) {
      if (error instanceof ScannedPdfError) {
        const fallback = this.fallbacks.get(metadata.extension.toLowerCase());
        if (fallback) {
          if (fallback instanceof PdfOcrExtractor && onOcrProgress) {
            fallback.onProgress = onOcrProgress;
          }
          return await fallback.extract(input, metadata);
        }
      }
      throw error;
    }
  }

  getSupportedFormats(): string[] {
    return [...this.extractors.keys()].sort();
  }
}
