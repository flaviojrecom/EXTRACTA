import type { IExtractor, ExtractionResult, FileMetadata, DocumentMetadata } from './types.js';

/**
 * RTF Extractor — Converts RTF to plain text then wraps in StandardHTML.
 * Uses a lightweight built-in parser (no external dependency).
 */
export class RtfExtractor implements IExtractor {
  supportedExtensions = ['.rtf'];

  canHandle(extension: string, buffer?: Buffer): boolean {
    if (this.supportedExtensions.includes(extension.toLowerCase())) return true;
    if (buffer && buffer.length >= 5) {
      return buffer.subarray(0, 5).toString('ascii') === '{\\rtf';
    }
    return false;
  }

  async extract(input: Buffer, metadata?: FileMetadata): Promise<ExtractionResult> {
    const raw = input.toString('ascii');
    const warnings: string[] = [];

    const text = this.rtfToText(raw);

    if (!text.trim()) {
      warnings.push('RTF document produced no extractable text');
    }

    const paragraphs = text
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(p => p.length > 0);

    const body = paragraphs.map(p => `<p>${this.escapeHtml(p)}</p>`).join('\n');
    const html = `<article>\n${body}\n</article>`;

    const docMetadata: DocumentMetadata = {
      title: metadata?.fileName,
      sourceFormat: 'rtf',
    };

    return { html, metadata: docMetadata, warnings };
  }

  private escapeHtml(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /**
   * Lightweight RTF→text converter.
   * Strips control words, groups, and converts Unicode escapes.
   */
  private rtfToText(rtf: string): string {
    let result = '';
    let depth = 0;
    let skipGroup = false;
    const skipGroups = new Set(['fonttbl', 'colortbl', 'stylesheet', 'info', 'pict', 'header', 'footer', 'headerl', 'headerr', 'footerl', 'footerr']);
    const groupStack: boolean[] = [];
    let i = 0;

    while (i < rtf.length) {
      const ch = rtf[i];

      if (ch === '{') {
        groupStack.push(skipGroup);
        depth++;
        i++;
        // Check if next token is a skip-group keyword
        if (rtf[i] === '\\') {
          const wordMatch = rtf.substring(i).match(/^\\([a-z]+)/);
          if (wordMatch && skipGroups.has(wordMatch[1])) {
            skipGroup = true;
          }
        }
        continue;
      }

      if (ch === '}') {
        depth--;
        skipGroup = groupStack.pop() ?? false;
        i++;
        continue;
      }

      if (skipGroup) {
        i++;
        continue;
      }

      if (ch === '\\') {
        i++;
        if (i >= rtf.length) break;

        const next = rtf[i];

        // Escaped special chars
        if (next === '\\' || next === '{' || next === '}') {
          result += next;
          i++;
          continue;
        }

        // Unicode escape: \uN?
        if (next === 'u') {
          const uMatch = rtf.substring(i).match(/^u(-?\d+)/);
          if (uMatch) {
            const code = parseInt(uMatch[1], 10);
            if (code >= 0) result += String.fromCharCode(code);
            i += uMatch[0].length;
            // Skip the replacement char (usually ?)
            if (i < rtf.length && rtf[i] === '?') i++;
            continue;
          }
        }

        // Hex escape: \'xx
        if (next === "'") {
          const hex = rtf.substring(i + 1, i + 3);
          if (hex.length === 2) {
            result += String.fromCharCode(parseInt(hex, 16));
            i += 3;
            continue;
          }
        }

        // Control word
        const cwMatch = rtf.substring(i).match(/^([a-z]+)(-?\d+)?\s?/);
        if (cwMatch) {
          const word = cwMatch[1];
          i += cwMatch[0].length;

          // Paragraph/line break control words
          if (word === 'par' || word === 'pard') {
            result += '\n\n';
          } else if (word === 'line' || word === 'softline') {
            result += '\n';
          } else if (word === 'tab') {
            result += '\t';
          } else if (word === 'emdash') {
            result += '—';
          } else if (word === 'endash') {
            result += '–';
          } else if (word === 'lquote' || word === 'rquote') {
            result += "'";
          } else if (word === 'ldblquote' || word === 'rdblquote') {
            result += '"';
          } else if (word === 'bullet') {
            result += '•';
          }
          continue;
        }

        // Unknown control: skip
        i++;
        continue;
      }

      // Regular character
      if (ch === '\r' || ch === '\n') {
        i++;
        continue;
      }

      result += ch;
      i++;
    }

    // Clean up excessive whitespace
    return result.replace(/\n{3,}/g, '\n\n').trim();
  }
}
