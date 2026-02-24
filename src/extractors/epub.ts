import JSZip from 'jszip';
import * as cheerio from 'cheerio';
import { ExtractionError } from '../core/errors.js';
import { stripDisallowedTags } from '../core/standard-html.js';
import type { IExtractor, ExtractionResult, FileMetadata, DocumentMetadata } from './types.js';

const ZIP_MAGIC_BYTES = Buffer.from('PK');

export class EpubExtractor implements IExtractor {
  supportedExtensions = ['.epub'];

  canHandle(extension: string, buffer?: Buffer): boolean {
    if (this.supportedExtensions.includes(extension.toLowerCase())) {
      return true;
    }
    if (buffer && buffer.length >= 2) {
      return buffer.subarray(0, 2).equals(ZIP_MAGIC_BYTES);
    }
    return false;
  }

  async extract(input: Buffer, metadata?: FileMetadata): Promise<ExtractionResult> {
    try {
      const zip = await JSZip.loadAsync(input);
      const warnings: string[] = [];

      const containerXml = await this.readZipFile(zip, 'META-INF/container.xml');
      const $container = cheerio.load(containerXml, { xml: true });
      const opfPath = $container('rootfile').attr('full-path');

      if (!opfPath) {
        throw new ExtractionError('Invalid EPUB: no rootfile path in container.xml');
      }

      const opfContent = await this.readZipFile(zip, opfPath);
      const $opf = cheerio.load(opfContent, { xml: true });
      const opfDir = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1) : '';

      const docMetadata = this.extractMetadata($opf, metadata);

      const spineItems = this.getSpineOrder($opf);

      if (spineItems.length === 0) {
        warnings.push('No spine items found in EPUB');
      }

      const sections: string[] = [];

      for (const itemHref of spineItems) {
        const fullPath = opfDir + itemHref;
        try {
          const xhtml = await this.readZipFile(zip, fullPath);
          const cleanedHtml = this.cleanXhtml(xhtml);
          if (cleanedHtml.trim()) {
            sections.push(`<section>\n${cleanedHtml}\n</section>`);
          }
        } catch {
          warnings.push(`Could not read spine item: ${itemHref}`);
        }
      }

      const html = `<article>\n${sections.join('\n')}\n</article>`;

      return { html, metadata: docMetadata, warnings };
    } catch (error) {
      if (error instanceof ExtractionError) throw error;
      throw new ExtractionError(
        `Failed to extract EPUB: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async readZipFile(zip: JSZip, path: string): Promise<string> {
    const file = zip.file(path);
    if (!file) {
      throw new ExtractionError(`File not found in EPUB archive: ${path}`);
    }
    return file.async('text');
  }

  private extractMetadata(
    $opf: cheerio.CheerioAPI,
    fileMetadata?: FileMetadata,
  ): DocumentMetadata {
    const title =
      $opf('metadata dc\\:title, metadata title').first().text() || fileMetadata?.fileName;
    const author = $opf('metadata dc\\:creator, metadata creator').first().text() || undefined;
    const language = $opf('metadata dc\\:language, metadata language').first().text() || undefined;

    return {
      title,
      author,
      language,
      sourceFormat: 'epub',
    };
  }

  private getSpineOrder($opf: cheerio.CheerioAPI): string[] {
    const manifest = new Map<string, string>();
    $opf('manifest item').each((_, el) => {
      const $el = $opf(el);
      const id = $el.attr('id');
      const href = $el.attr('href');
      if (id && href) {
        manifest.set(id, href);
      }
    });

    const spineItems: string[] = [];
    $opf('spine itemref').each((_, el) => {
      const idref = $opf(el).attr('idref');
      if (idref) {
        const href = manifest.get(idref);
        if (href) {
          spineItems.push(href);
        }
      }
    });

    return spineItems;
  }

  private cleanXhtml(xhtml: string): string {
    const $ = cheerio.load(xhtml, { xml: true });

    $('script, style, link[rel="stylesheet"]').remove();
    $('[style]').removeAttr('style');
    $('[class]').removeAttr('class');

    const body = $('body').html() || $.root().html() || '';

    return stripDisallowedTags(body);
  }
}
