import type { IPipelineStage, StageOptions } from '../core/types.js';

export class Normalizer implements IPipelineStage<string, string> {
  name = 'normalize';

  async process(input: string, options?: StageOptions): Promise<string> {
    options?.onProgress?.(0, 'Starting normalization');

    let html = input;

    // 1. Remove BOM
    html = html.replace(/^\uFEFF/, '');

    // 2. Unicode normalization (NFC)
    html = html.normalize('NFC');

    // 3. Replace smart quotes and typographic characters with standard equivalents
    html = this.normalizeTypography(html);

    options?.onProgress?.(30, 'Typography normalized');

    // 4. Fix hyphenation: reconnect words broken by end-of-line hyphens
    html = this.fixHyphenation(html);

    options?.onProgress?.(50, 'Hyphenation fixed');

    // 5. Remove artificial mid-sentence line breaks (common in PDF extraction)
    html = this.removeArtificialLineBreaks(html);

    options?.onProgress?.(70, 'Line breaks cleaned');

    // 6. Collapse whitespace (multiple spaces → single, normalize tabs)
    html = this.collapseWhitespace(html);

    // 7. Remove trailing spaces on lines and before closing tags
    html = html.replace(/ +$/gm, '');
    html = html.replace(/ +(<\/(?!pre|code)[a-zA-Z]+>)/g, '$1');

    // 8. Replace invalid/control characters (keep newlines and tabs)
    // eslint-disable-next-line no-control-regex
    html = html.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    options?.onProgress?.(100, 'Normalization complete');

    return html;
  }

  private normalizeTypography(html: string): string {
    return html
      .replace(/[\u2018\u2019\u201A\u201B]/g, "'") // smart single quotes
      .replace(/[\u201C\u201D\u201E\u201F]/g, '"') // smart double quotes
      .replace(/[\u2013\u2014]/g, '-') // en/em dash → hyphen
      .replace(/\u2026/g, '...') // ellipsis
      .replace(/\u00A0/g, ' '); // non-breaking space
  }

  private fixHyphenation(html: string): string {
    // Match word-hyphen at end of line followed by continuation on next line
    // Only inside text content (not inside tags)
    // Pattern: "word-\n  continuation" → "wordcontinuation"
    return html.replace(/(\w)-\s*\n\s*(\w)/g, '$1$2');
  }

  private removeArtificialLineBreaks(html: string): string {
    // Inside <p> tags, join lines that appear to be mid-sentence breaks
    // A mid-sentence break: lowercase letter + \n + lowercase/uppercase letter (not a tag)
    return html.replace(
      /(<p[^>]*>)([\s\S]*?)(<\/p>)/gi,
      (_match, open: string, content: string, close: string) => {
        const cleaned = content.replace(/([a-z,;])\s*\n\s*([a-zA-Z])/g, '$1 $2');
        return `${open}${cleaned}${close}`;
      },
    );
  }

  private collapseWhitespace(html: string): string {
    // Don't collapse inside <pre> or <code> blocks
    return html.replace(
      /(<pre[^>]*>[\s\S]*?<\/pre>)|(<code[^>]*>[\s\S]*?<\/code>)|( {2,})/gi,
      (match, pre?: string, code?: string) => {
        if (pre || code) return match; // preserve pre/code whitespace
        return ' ';
      },
    );
  }
}
