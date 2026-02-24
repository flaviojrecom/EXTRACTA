import * as cheerio from 'cheerio';
import { stripDisallowedTags } from '../core/standard-html.js';
import { ExtractionError } from '../core/errors.js';
import type { IExtractor, ExtractionResult, FileMetadata, DocumentMetadata } from './types.js';

/**
 * MOBI/AZW/AZW3 Extractor — Extracts HTML content from Kindle ebook formats.
 *
 * MOBI files contain embedded HTML (PalmDOC or KF8 format).
 * AZW is Amazon's DRM-wrapped MOBI; AZW3 is KF8 (Kindle Format 8).
 * This extractor handles non-DRM files by locating and decompressing the HTML record.
 */

const MOBI_MAGIC = Buffer.from('BOOKMOBI');
const PALMDOC_MAGIC = Buffer.from('TEXtREAd');

export class MobiExtractor implements IExtractor {
  supportedExtensions = ['.mobi', '.azw', '.azw3'];

  canHandle(extension: string, buffer?: Buffer): boolean {
    if (this.supportedExtensions.includes(extension.toLowerCase())) return true;
    if (buffer && buffer.length >= 68) {
      return buffer.subarray(60, 68).equals(MOBI_MAGIC) ||
             buffer.subarray(60, 68).equals(PALMDOC_MAGIC);
    }
    return false;
  }

  async extract(input: Buffer, metadata?: FileMetadata): Promise<ExtractionResult> {
    const warnings: string[] = [];

    try {
      const records = this.parsePalmDb(input);
      const mobiHeader = this.parseMobiHeader(records[0]);
      const htmlContent = this.extractHtmlContent(records, mobiHeader);

      const $ = cheerio.load(htmlContent);

      // Remove non-content elements
      $('script, style, link, head, mbp\\:pagebreak, mbp\\:nu, mbp\\:section').remove();
      $('[style]').removeAttr('style');
      $('[class]').removeAttr('class');
      $('[align]').removeAttr('align');
      $('[width]').removeAttr('width');
      $('[height]').removeAttr('height');

      const body = $('body').html() || $.root().html() || '';
      const cleaned = stripDisallowedTags(body).trim();

      if (!cleaned) {
        warnings.push('MOBI document produced no extractable content');
      }

      const html = `<article>\n${cleaned}\n</article>`;

      const docMetadata: DocumentMetadata = {
        title: mobiHeader.title || metadata?.fileName,
        author: mobiHeader.author || undefined,
        language: mobiHeader.language || undefined,
        sourceFormat: metadata?.extension?.replace('.', '') || 'mobi',
      };

      return { html, metadata: docMetadata, warnings };
    } catch (error) {
      throw new ExtractionError(
        `Failed to extract MOBI/AZW: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /** Parse PalmDB header and extract records */
  private parsePalmDb(buf: Buffer): Buffer[] {
    if (buf.length < 78) {
      throw new ExtractionError('File too small to be a valid MOBI/PDB file');
    }

    const numRecords = buf.readUInt16BE(76);
    const records: Buffer[] = [];
    const recordOffsets: number[] = [];

    for (let i = 0; i < numRecords; i++) {
      const offset = buf.readUInt32BE(78 + i * 8);
      recordOffsets.push(offset);
    }

    for (let i = 0; i < numRecords; i++) {
      const start = recordOffsets[i];
      const end = i + 1 < numRecords ? recordOffsets[i + 1] : buf.length;
      records.push(buf.subarray(start, end));
    }

    return records;
  }

  /** Parse MOBI header from record 0 */
  private parseMobiHeader(record0: Buffer): MobiHeader {
    // PalmDOC header starts at offset 0 of record 0
    const compression = record0.readUInt16BE(0);
    const textLength = record0.readUInt32BE(4);
    const recordCount = record0.readUInt16BE(8);
    const recordSize = record0.readUInt16BE(10);

    let title = '';
    let author = '';
    let language = '';

    // MOBI header starts at offset 16
    if (record0.length >= 132) {
      const mobiMagic = record0.subarray(16, 20).toString('ascii');
      if (mobiMagic === 'MOBI') {
        const titleOffset = record0.readUInt32BE(84);
        const titleLength = record0.readUInt32BE(88);
        if (titleOffset + titleLength <= record0.length) {
          title = record0.subarray(titleOffset, titleOffset + titleLength).toString('utf-8');
        }

        const localeCode = record0.readUInt32BE(100);
        language = this.localeToLanguage(localeCode);
      }
    }

    // Try to find EXTH header for author
    const exthOffset = record0.indexOf('EXTH');
    if (exthOffset !== -1 && exthOffset + 12 <= record0.length) {
      const exthCount = record0.readUInt32BE(exthOffset + 8);
      let pos = exthOffset + 12;

      for (let i = 0; i < exthCount && pos + 8 <= record0.length; i++) {
        const type = record0.readUInt32BE(pos);
        const len = record0.readUInt32BE(pos + 4);
        if (len < 8 || pos + len > record0.length) break;
        const value = record0.subarray(pos + 8, pos + len).toString('utf-8');

        if (type === 100) author = value; // Author
        pos += len;
      }
    }

    return { compression, textLength, recordCount, recordSize, title, author, language };
  }

  /** Extract and decompress HTML content from text records */
  private extractHtmlContent(records: Buffer[], header: MobiHeader): string {
    const chunks: Buffer[] = [];
    const count = Math.min(header.recordCount, records.length - 1);

    for (let i = 1; i <= count; i++) {
      const record = records[i];
      if (header.compression === 2) {
        // PalmDOC compression
        chunks.push(this.decompressPalmDoc(record));
      } else if (header.compression === 1) {
        // No compression
        chunks.push(record);
      } else {
        // HUFF/CDIC or unknown — try raw
        chunks.push(record);
      }
    }

    const raw = Buffer.concat(chunks).subarray(0, header.textLength);
    return raw.toString('utf-8');
  }

  /** PalmDOC (LZ77 variant) decompression */
  private decompressPalmDoc(data: Buffer): Buffer {
    const output: number[] = [];
    let i = 0;

    while (i < data.length) {
      const byte = data[i++];

      if (byte === 0) {
        output.push(0);
      } else if (byte >= 1 && byte <= 8) {
        // Copy next N bytes literally
        for (let j = 0; j < byte && i < data.length; j++) {
          output.push(data[i++]);
        }
      } else if (byte >= 0x80) {
        // LZ77 back-reference
        if (i >= data.length) break;
        const next = data[i++];
        const distance = ((byte << 8 | next) >> 3) & 0x7FF;
        const length = (next & 0x07) + 3;

        for (let j = 0; j < length; j++) {
          const pos = output.length - distance;
          output.push(pos >= 0 ? output[pos] : 0);
        }
      } else if (byte >= 0x09 && byte <= 0x7F) {
        output.push(byte);
      } else {
        // 0xC0+ space + char
        output.push(0x20);
        output.push(byte ^ 0x80);
      }
    }

    return Buffer.from(output);
  }

  private localeToLanguage(code: number): string {
    const lang = code & 0xFF;
    const map: Record<number, string> = {
      9: 'en', 6: 'es', 12: 'fr', 7: 'de', 16: 'it', 22: 'pt',
      10: 'ru', 17: 'ja', 4: 'zh', 18: 'ko', 26: 'ar',
    };
    return map[lang] || '';
  }
}

interface MobiHeader {
  compression: number;
  textLength: number;
  recordCount: number;
  recordSize: number;
  title: string;
  author: string;
  language: string;
}
