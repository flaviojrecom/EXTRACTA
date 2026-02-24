import * as cheerio from 'cheerio';
import { stripDisallowedTags } from '../core/standard-html.js';
import type { IExtractor, ExtractionResult, FileMetadata, DocumentMetadata } from './types.js';

export class HtmlExtractor implements IExtractor {
  supportedExtensions = ['.html', '.htm'];

  canHandle(extension: string): boolean {
    return this.supportedExtensions.includes(extension.toLowerCase());
  }

  async extract(input: Buffer, metadata?: FileMetadata): Promise<ExtractionResult> {
    const raw = input.toString('utf-8');
    const warnings: string[] = [];
    const $ = cheerio.load(raw);

    // Extract metadata from <head>
    const title = $('title').text().trim() || metadata?.fileName;
    const author = $('meta[name="author"]').attr('content') || undefined;
    const language = $('html').attr('lang') || $('meta[http-equiv="content-language"]').attr('content') || undefined;

    // Remove non-content elements
    $('script, style, link[rel="stylesheet"], nav, footer, header, aside, iframe, noscript, svg').remove();
    $('[style]').removeAttr('style');
    $('[class]').removeAttr('class');

    const body = $('body').html() || $.root().html() || '';
    const cleaned = stripDisallowedTags(body).trim();

    if (!cleaned) {
      warnings.push('HTML document produced no extractable content');
    }

    const html = `<article>\n${cleaned}\n</article>`;

    const docMetadata: DocumentMetadata = {
      title,
      author,
      language,
      sourceFormat: 'html',
    };

    return { html, metadata: docMetadata, warnings };
  }
}
