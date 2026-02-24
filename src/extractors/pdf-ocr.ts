import { ExtractionError } from '../core/errors.js';
import type { IExtractor, ExtractionResult, FileMetadata, DocumentMetadata } from './types.js';
import type { OcrConfig, OcrProvider, OcrPageResult } from './ocr/types.js';
import { DEFAULT_OCR_CONFIG } from './ocr/types.js';
import { TesseractOcrProvider } from './ocr/tesseract-provider.js';
import { PdfRasterizer } from './ocr/rasterizer.js';

const PDF_MAGIC_BYTES = Buffer.from('%PDF');

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export type OcrProgressCallback = (page: number, total: number) => void;

export class PdfOcrExtractor implements IExtractor {
  supportedExtensions = ['.pdf'];
  private config: OcrConfig;
  private provider: OcrProvider;
  private rasterizer: PdfRasterizer;
  onProgress?: OcrProgressCallback;

  constructor(config?: Partial<OcrConfig>, provider?: OcrProvider) {
    this.config = { ...DEFAULT_OCR_CONFIG, ...config };
    this.provider = provider ?? new TesseractOcrProvider();
    this.rasterizer = new PdfRasterizer();
  }

  canHandle(extension: string, buffer?: Buffer): boolean {
    if (extension.toLowerCase() === '.pdf') return true;
    if (buffer && buffer.length >= 4) {
      return buffer.subarray(0, 4).equals(PDF_MAGIC_BYTES);
    }
    return false;
  }

  async extract(input: Buffer, metadata?: FileMetadata): Promise<ExtractionResult> {
    const warnings: string[] = [];

    try {
      await this.provider.initialize(this.config);

      const pages = await this.rasterizer.rasterize(input, this.config.dpi);

      if (pages.length === 0) {
        throw new ExtractionError('PDF has no pages to OCR');
      }

      const ocrResults = await this.ocrPages(pages, warnings);

      const successfulResults = ocrResults.filter((r): r is OcrPageResult => r !== null);

      if (successfulResults.length === 0) {
        throw new ExtractionError('All pages failed OCR extraction');
      }

      const html = this.assembleHtml(successfulResults);
      const avgConfidence = this.calculateAvgConfidence(successfulResults);
      const lowConfidencePages = successfulResults
        .filter((r) => r.confidence < this.config.confidenceThreshold)
        .map((r) => r.pageNumber);

      const docMetadata: DocumentMetadata = {
        title: metadata?.fileName,
        pageCount: pages.length,
        isScanned: true,
        sourceFormat: 'pdf',
        ocrConfidence: avgConfidence,
        ocrEngine: this.provider.name,
        lowConfidencePages: lowConfidencePages.length > 0 ? lowConfidencePages : undefined,
      };

      if (successfulResults.length < pages.length) {
        warnings.push(
          `${pages.length - successfulResults.length} of ${pages.length} pages failed OCR`,
        );
      }

      return { html, metadata: docMetadata, warnings };
    } catch (error) {
      if (error instanceof ExtractionError) throw error;
      throw new ExtractionError(
        `OCR extraction failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      await this.provider.terminate();
    }
  }

  private async ocrPages(
    pages: { pageNumber: number; imageBuffer: Buffer }[],
    warnings: string[],
  ): Promise<(OcrPageResult | null)[]> {
    const results: (OcrPageResult | null)[] = [];

    // Process pages sequentially so progress callbacks are meaningful
    for (const page of pages) {
      this.onProgress?.(page.pageNumber, pages.length);
      try {
        const result = await this.provider.recognizePage(page.imageBuffer, page.pageNumber);
        results.push(result);
        warnings.push(...result.warnings);
      } catch (err) {
        results.push(null);
        warnings.push(`OCR failed for page ${page.pageNumber}: ${err}`);
      }
    }

    return results;
  }

  private assembleHtml(results: OcrPageResult[]): string {
    const avgConfidence = this.calculateAvgConfidence(results);

    const sections = results
      .sort((a, b) => a.pageNumber - b.pageNumber)
      .map((r) => {
        const paragraphs = r.text
          .split(/\n\s*\n/)
          .map((p) => p.trim())
          .filter((p) => p.length > 0)
          .map((p) => `<p>${escapeHtml(p)}</p>`)
          .join('\n');

        return `<section data-page="${r.pageNumber}">\n${paragraphs}\n</section>`;
      })
      .join('\n');

    return `<article data-source="ocr" data-confidence="${avgConfidence.toFixed(1)}">\n${sections}\n</article>`;
  }

  private calculateAvgConfidence(results: OcrPageResult[]): number {
    if (results.length === 0) return 0;
    const sum = results.reduce((acc, r) => acc + r.confidence, 0);
    return sum / results.length;
  }
}
