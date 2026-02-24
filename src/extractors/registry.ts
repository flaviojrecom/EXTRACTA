import { UnsupportedFormatError } from '../core/errors.js';
import type { IExtractor } from './types.js';
import { PdfTextExtractor } from './pdf-text.js';
import { EpubExtractor } from './epub.js';
import { TxtExtractor } from './txt.js';

export class ExtractorRegistry {
  private extractors: Map<string, IExtractor> = new Map();

  constructor() {
    this.registerDefaults();
  }

  private registerDefaults(): void {
    const pdf = new PdfTextExtractor();
    const epub = new EpubExtractor();
    const txt = new TxtExtractor();

    for (const ext of pdf.supportedExtensions) this.extractors.set(ext, pdf);
    for (const ext of epub.supportedExtensions) this.extractors.set(ext, epub);
    for (const ext of txt.supportedExtensions) this.extractors.set(ext, txt);
  }

  register(extractor: IExtractor): void {
    for (const ext of extractor.supportedExtensions) {
      this.extractors.set(ext, extractor);
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

  getSupportedFormats(): string[] {
    return [...this.extractors.keys()].sort();
  }
}
