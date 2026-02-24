import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import { ScannedPdfError, ExtractionError } from '../core/errors.js';
import type { IExtractor, ExtractionResult, FileMetadata, DocumentMetadata } from './types.js';

const SCANNED_THRESHOLD_CHARS_PER_PAGE = 50;
const PDF_MAGIC_BYTES = Buffer.from('%PDF');

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function textToStandardHtml(text: string): string {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const body = paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join('\n');

  return `<article>\n${body}\n</article>`;
}

export class PdfTextExtractor implements IExtractor {
  supportedExtensions = ['.pdf'];

  canHandle(extension: string, buffer?: Buffer): boolean {
    if (this.supportedExtensions.includes(extension.toLowerCase())) {
      return true;
    }
    if (buffer && buffer.length >= 4) {
      return buffer.subarray(0, 4).equals(PDF_MAGIC_BYTES);
    }
    return false;
  }

  async extract(input: Buffer, metadata?: FileMetadata): Promise<ExtractionResult> {
    try {
      const data = await pdfParse(input);
      const warnings: string[] = [];
      const pageCount = data.numpages;

      const totalChars = data.text.trim().length;
      const avgCharsPerPage = pageCount > 0 ? totalChars / pageCount : 0;

      if (totalChars === 0 || avgCharsPerPage < SCANNED_THRESHOLD_CHARS_PER_PAGE) {
        throw new ScannedPdfError(
          `PDF appears to be scanned (avg ${Math.round(avgCharsPerPage)} chars/page, threshold: ${SCANNED_THRESHOLD_CHARS_PER_PAGE})`,
        );
      }

      if (avgCharsPerPage < SCANNED_THRESHOLD_CHARS_PER_PAGE * 2) {
        warnings.push(`Low text density: ${Math.round(avgCharsPerPage)} chars/page`);
      }

      const html = textToStandardHtml(data.text);

      const docMetadata: DocumentMetadata = {
        title: data.info?.Title || metadata?.fileName,
        author: data.info?.Author,
        pageCount,
        isScanned: false,
        sourceFormat: 'pdf',
      };

      return { html, metadata: docMetadata, warnings };
    } catch (error) {
      if (error instanceof ScannedPdfError) throw error;
      throw new ExtractionError(
        `Failed to extract PDF: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
