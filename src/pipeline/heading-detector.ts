export interface DetectedHeading {
  text: string;
  level: number;
  confidence: number;
  source: 'html-tag' | 'numbering' | 'uppercase' | 'linguistic';
  position: number;
}

const LINGUISTIC_PATTERNS: { pattern: RegExp; level: number }[] = [
  { pattern: /^(?:part|parte)\s+/i, level: 1 },
  { pattern: /^(?:chapter|cap[ií]tulo)\s+/i, level: 1 },
  { pattern: /^(?:section|se[çc][ãa]o)\s+/i, level: 2 },
  { pattern: /^(?:appendix|ap[êe]ndice)\s+/i, level: 2 },
];

const NUMBERING_PATTERNS: { pattern: RegExp; levelFn: (match: RegExpMatchArray) => number }[] = [
  // 1.1.1 style → level = count of dots + 1
  {
    pattern: /^(\d+(?:\.\d+)*)\.\s/,
    levelFn: (m) => Math.min((m[1].match(/\./g)?.length ?? 0) + 1, 6),
  },
  // Roman numerals: I., II., III.
  { pattern: /^[IVXLCDM]+\.\s/i, level: 1 } as unknown as typeof NUMBERING_PATTERNS[0],
  // Letter: a), A.
  { pattern: /^[a-zA-Z][.)]\s/, levelFn: () => 3 },
];

// Fix: add levelFn to the roman numeral pattern
NUMBERING_PATTERNS[1] = {
  pattern: /^[IVXLCDM]+\.\s/i,
  levelFn: () => 1,
};

export function detectHeadings(html: string): DetectedHeading[] {
  const headings: DetectedHeading[] = [];
  let position = 0;

  // 1. HTML tag headings (highest confidence)
  const htmlHeadingRegex = /<h([1-6])[^>]*>(.*?)<\/h\1>/gi;
  let match: RegExpExecArray | null;

  while ((match = htmlHeadingRegex.exec(html)) !== null) {
    const level = parseInt(match[1], 10);
    const text = stripTags(match[2]).replace(/\s*\n\s*/g, ' ').trim();
    if (text) {
      headings.push({
        text,
        level,
        confidence: 1.0,
        source: 'html-tag',
        position: match.index,
      });
    }
  }

  // 2. Detect in paragraph content
  const paragraphRegex = /<p[^>]*>(.*?)<\/p>/gi;
  while ((match = paragraphRegex.exec(html)) !== null) {
    const text = stripTags(match[1]).replace(/\s*\n\s*/g, ' ').trim();
    if (!text || text.length > 200) continue;

    position = match.index;

    // Numbering detection
    for (const np of NUMBERING_PATTERNS) {
      const numMatch = text.match(np.pattern);
      if (numMatch) {
        headings.push({
          text,
          level: np.levelFn(numMatch),
          confidence: 0.7,
          source: 'numbering',
          position,
        });
        break;
      }
    }

    // Linguistic pattern detection
    for (const lp of LINGUISTIC_PATTERNS) {
      if (lp.pattern.test(text)) {
        headings.push({
          text,
          level: lp.level,
          confidence: 0.8,
          source: 'linguistic',
          position,
        });
        break;
      }
    }

    // Uppercase detection (short ALL CAPS lines)
    if (text.length < 100 && text === text.toUpperCase() && /[A-Z]/.test(text)) {
      // Don't add if already detected
      const alreadyDetected = headings.some(
        (h) => h.position === position && h.source !== 'uppercase',
      );
      if (!alreadyDetected) {
        headings.push({
          text,
          level: 2,
          confidence: 0.5,
          source: 'uppercase',
          position,
        });
      }
    }
  }

  // Deduplicate by position, keeping highest confidence
  const byPosition = new Map<number, DetectedHeading>();
  for (const h of headings) {
    const existing = byPosition.get(h.position);
    if (!existing || h.confidence > existing.confidence) {
      byPosition.set(h.position, h);
    }
  }

  return [...byPosition.values()].sort((a, b) => a.position - b.position);
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, '');
}
