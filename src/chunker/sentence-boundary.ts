const ABBREVIATIONS = new Set([
  // English
  'mr', 'mrs', 'ms', 'dr', 'prof', 'sr', 'jr', 'st',
  'vs', 'etc', 'inc', 'ltd', 'co', 'corp',
  'fig', 'vol', 'no', 'dept', 'est', 'approx',
  'e.g', 'i.e', 'cf', 'al',
  // Portuguese
  'sra', 'srta', 'exmo', 'ilmo',
  'av', 'r', 'tel', 'fls',
]);

export interface Sentence {
  text: string;
  start: number;
  end: number;
}

export function splitSentences(text: string): Sentence[] {
  if (!text.trim()) return [];

  const sentences: Sentence[] = [];
  let current = '';
  let start = 0;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    current += ch;

    if ((ch === '.' || ch === '!' || ch === '?') && i + 1 < text.length) {
      // Check if this is a real sentence boundary

      // Ellipsis: ... is not a boundary mid-sentence
      if (ch === '.' && text[i + 1] === '.') {
        continue;
      }

      // Decimal number: 3.14
      if (ch === '.' && i > 0 && /\d/.test(text[i - 1]) && i + 1 < text.length && /\d/.test(text[i + 1])) {
        continue;
      }

      // Abbreviation check
      if (ch === '.') {
        const wordBefore = getWordBefore(text, i);
        if (wordBefore && ABBREVIATIONS.has(wordBefore.toLowerCase())) {
          continue;
        }
        // e.g. and i.e. patterns (already caught by abbreviation set but also handle dotted patterns)
        if (wordBefore && wordBefore.length <= 2 && i + 1 < text.length && /[a-z]/i.test(text[i + 1])) {
          continue;
        }
      }

      // Must be followed by whitespace then uppercase or end
      const after = text.substring(i + 1);
      const afterMatch = after.match(/^(\s+)/);
      if (afterMatch) {
        const nextCharIdx = i + 1 + afterMatch[1].length;
        if (nextCharIdx < text.length) {
          const nextChar = text[nextCharIdx];
          // Sentence boundary if next non-space char is uppercase, digit, or quote/bracket
          if (/[A-ZÀ-ÖØ-Þ0-9"'([]/.test(nextChar)) {
            const trimmed = current.trim();
            if (trimmed) {
              sentences.push({ text: trimmed, start, end: i + 1 });
            }
            // Skip whitespace
            i = nextCharIdx - 1;
            current = '';
            start = nextCharIdx;
          }
        }
      }
    }
  }

  // Last sentence
  const trimmed = current.trim();
  if (trimmed) {
    sentences.push({ text: trimmed, start, end: text.length });
  }

  return sentences;
}

function getWordBefore(text: string, dotIndex: number): string | null {
  let end = dotIndex;
  // Handle dotted abbreviations like e.g.
  while (end > 0 && text[end - 1] === '.') end--;
  let start = end;
  while (start > 0 && /[a-zA-Z.]/.test(text[start - 1])) start--;
  const word = text.substring(start, end).replace(/\./g, '');
  return word || null;
}
