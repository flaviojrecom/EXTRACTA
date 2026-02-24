import type { IPipelineStage, StageOptions } from '../core/types.js';

export type CleaningLevel = 'light' | 'standard' | 'aggressive';

export interface CleaningAuditEntry {
  type: string;
  pattern: string;
  contentRemoved: string;
  reason: string;
  position?: number;
}

export interface CleanerResult {
  html: string;
  auditLog: CleaningAuditEntry[];
}

export class Cleaner implements IPipelineStage<string, CleanerResult> {
  name = 'clean';
  private level: CleaningLevel;

  constructor(level: CleaningLevel = 'standard') {
    this.level = level;
  }

  async process(input: string, options?: StageOptions): Promise<CleanerResult> {
    const auditLog: CleaningAuditEntry[] = [];
    let html = input;

    options?.onProgress?.(0, `Cleaning (level: ${this.level})`);

    // Light: page numbers + excessive whitespace (all levels)
    html = this.removePageNumbers(html, auditLog);
    html = this.removeExcessiveWhitespace(html, auditLog);

    options?.onProgress?.(30, 'Page numbers and whitespace cleaned');

    if (this.level === 'standard' || this.level === 'aggressive') {
      // Standard: + headers/footers, ISBN, legal credits
      html = this.removeRepeatedPatterns(html, auditLog);
      html = this.removeIsbn(html, auditLog);
      html = this.removeLegalCredits(html, auditLog);

      options?.onProgress?.(60, 'Repeated patterns and metadata cleaned');
    }

    if (this.level === 'aggressive') {
      // Aggressive: additional heuristic noise removal
      html = this.removeShortOrphanParagraphs(html, auditLog);
      html = this.removeDecorativeElements(html, auditLog);

      options?.onProgress?.(80, 'Aggressive cleaning applied');
    }

    // Clean up empty tags left after removal
    html = this.removeEmptyTags(html);

    options?.onProgress?.(100, 'Cleaning complete');

    return { html, auditLog };
  }

  private removePageNumbers(html: string, auditLog: CleaningAuditEntry[]): string {
    // Common page number patterns: "42", "- 42 -", "Page 42", "page 42 of 100"
    const pageNumPatterns = [
      /(<p[^>]*>)\s*-?\s*\d{1,4}\s*-?\s*(<\/p>)/gi,
      /(<p[^>]*>)\s*(?:page|p\.?|pg\.?)\s*\d{1,4}(?:\s*(?:of|\/)\s*\d{1,4})?\s*(<\/p>)/gi,
    ];

    for (const pattern of pageNumPatterns) {
      html = html.replace(pattern, (match, open: string, close: string) => {
        const content = match.replace(open, '').replace(close, '').trim();
        auditLog.push({
          type: 'page_number',
          pattern: pattern.source,
          contentRemoved: content,
          reason: 'Detected page number pattern',
        });
        return '';
      });
    }

    return html;
  }

  private removeExcessiveWhitespace(html: string, auditLog: CleaningAuditEntry[]): string {
    const before = html;
    // Multiple blank lines → single blank line
    html = html.replace(/\n{3,}/g, '\n\n');
    if (html !== before) {
      auditLog.push({
        type: 'whitespace',
        pattern: 'multiple_blank_lines',
        contentRemoved: '(excessive blank lines)',
        reason: 'Collapsed multiple blank lines',
      });
    }
    return html;
  }

  private removeRepeatedPatterns(html: string, auditLog: CleaningAuditEntry[]): string {
    const patterns = detectRepeatedPatterns(html);
    for (const pattern of patterns) {
      if (pattern.confidence >= 0.5) {
        const regex = new RegExp(escapeRegex(pattern.text), 'g');
        html = html.replace(regex, () => {
          auditLog.push({
            type: 'repeated_pattern',
            pattern: pattern.text.substring(0, 50),
            contentRemoved: pattern.text,
            reason: `Repeated ${pattern.count} times (confidence: ${pattern.confidence.toFixed(2)})`,
          });
          return '';
        });
      }
    }
    return html;
  }

  private removeIsbn(html: string, auditLog: CleaningAuditEntry[]): string {
    const isbnPattern = /ISBN[-\s]?(?:13|10)?[\s:]*(?:\d[-\s]?){9,13}[\dXx]/g;
    return html.replace(isbnPattern, (match) => {
      auditLog.push({
        type: 'isbn',
        pattern: 'ISBN',
        contentRemoved: match,
        reason: 'Detected ISBN number',
      });
      return '';
    });
  }

  private removeLegalCredits(html: string, auditLog: CleaningAuditEntry[]): string {
    const legalPatterns = [
      /(<p[^>]*>)[^<]*(?:copyright|©|\(c\))[^<]*(<\/p>)/gi,
      /(<p[^>]*>)[^<]*all\s+rights\s+reserved[^<]*(<\/p>)/gi,
      /(<p[^>]*>)[^<]*published\s+by[^<]*(<\/p>)/gi,
      /(<p[^>]*>)[^<]*printed\s+in[^<]*(<\/p>)/gi,
    ];

    for (const pattern of legalPatterns) {
      html = html.replace(pattern, (match, open: string, close: string) => {
        const content = match.replace(open, '').replace(close, '').trim();
        auditLog.push({
          type: 'legal_credit',
          pattern: pattern.source.substring(0, 40),
          contentRemoved: content,
          reason: 'Detected legal/copyright notice',
        });
        return '';
      });
    }

    return html;
  }

  private removeShortOrphanParagraphs(html: string, auditLog: CleaningAuditEntry[]): string {
    // Remove very short paragraphs (< 10 chars) that are likely noise
    return html.replace(
      /(<p[^>]*>)\s*([^<]{1,10})\s*(<\/p>)/gi,
      (match, open: string, content: string, _close: string) => {
        const trimmed = content.trim();
        // Preserve if it looks like meaningful content
        if (/^[A-Z]/.test(trimmed) && trimmed.length > 3) return match;
        if (/\d/.test(trimmed) && trimmed.length <= 4) {
          // Likely a page number or noise
          auditLog.push({
            type: 'orphan_paragraph',
            pattern: 'short_paragraph',
            contentRemoved: trimmed,
            reason: 'Short orphan paragraph (aggressive mode)',
          });
          return '';
        }
        return match;
      },
    );
  }

  private removeDecorativeElements(html: string, auditLog: CleaningAuditEntry[]): string {
    // Remove paragraphs with only decorative characters
    return html.replace(
      /(<p[^>]*>)\s*([*=\-_~#]{3,})\s*(<\/p>)/gi,
      (_match, _open: string, content: string) => {
        auditLog.push({
          type: 'decorative',
          pattern: 'decorative_line',
          contentRemoved: content.trim(),
          reason: 'Decorative line separator',
        });
        return '';
      },
    );
  }

  private removeEmptyTags(html: string): string {
    // Remove empty <p>, <section>, <div> tags left after cleaning
    return html.replace(/<(p|section|div)[^>]*>\s*<\/\1>/gi, '');
  }
}

// --- Pattern Detection Engine ---

export interface DetectedPattern {
  text: string;
  count: number;
  confidence: number;
  positions: number[];
}

export function detectRepeatedPatterns(
  html: string,
  minFrequency: number = 3,
): DetectedPattern[] {
  // Extract text content from paragraph-like elements
  const paragraphRegex = /<(?:p|div|span)[^>]*>(.*?)<\/(?:p|div|span)>/gi;
  const textBlocks: { text: string; position: number }[] = [];
  let match: RegExpExecArray | null;

  while ((match = paragraphRegex.exec(html)) !== null) {
    const text = match[1].replace(/<[^>]+>/g, '').trim();
    if (text.length > 0 && text.length < 200) {
      textBlocks.push({ text, position: match.index });
    }
  }

  // Count occurrences
  const frequency = new Map<string, { count: number; positions: number[] }>();
  for (const block of textBlocks) {
    const normalized = block.text.toLowerCase().trim();
    const existing = frequency.get(normalized) || { count: 0, positions: [] };
    existing.count++;
    existing.positions.push(block.position);
    frequency.set(normalized, existing);
  }

  // Filter by minimum frequency and compute confidence
  const totalBlocks = textBlocks.length;
  const patterns: DetectedPattern[] = [];

  for (const [text, data] of frequency) {
    if (data.count >= minFrequency) {
      const confidence = data.count / totalBlocks;
      const originalText = textBlocks.find(
        (b) => b.text.toLowerCase().trim() === text,
      )?.text || text;

      patterns.push({
        text: originalText,
        count: data.count,
        confidence,
        positions: data.positions,
      });
    }
  }

  return patterns.sort((a, b) => b.confidence - a.confidence);
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
