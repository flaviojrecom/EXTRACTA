const STOPWORDS: Record<string, Set<string>> = {
  en: new Set([
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
    'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
    'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
    'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
    'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
  ]),
  pt: new Set([
    'de', 'a', 'o', 'que', 'e', 'do', 'da', 'em', 'um', 'para',
    'com', 'no', 'na', 'uma', 'os', 'se', 'mais', 'as', 'dos', 'como',
    'mas', 'foi', 'ao', 'ele', 'das', 'tem', 'seu', 'sua', 'ou', 'ser',
    'quando', 'muito', 'nos', 'ja', 'eu', 'tambem', 'so', 'pelo', 'pela', 'ate',
    'isso', 'ela', 'entre', 'era', 'depois', 'sem', 'mesmo', 'aos', 'ter', 'seus',
  ]),
  es: new Set([
    'de', 'la', 'que', 'el', 'en', 'y', 'a', 'los', 'del', 'se',
    'las', 'por', 'un', 'para', 'con', 'no', 'una', 'su', 'al', 'lo',
    'como', 'mas', 'pero', 'sus', 'le', 'ya', 'o', 'este', 'si', 'porque',
    'esta', 'entre', 'cuando', 'muy', 'sin', 'sobre', 'tambien', 'me', 'hasta', 'hay',
    'donde', 'quien', 'desde', 'todo', 'nos', 'durante', 'todos', 'uno', 'les', 'ni',
  ]),
};

const CONFIDENCE_THRESHOLD = 0.02;

export interface LanguageDetectionResult {
  language: string;
  confidence: number;
}

export function detectLanguage(text: string): LanguageDetectionResult {
  const cleanText = text.replace(/<[^>]+>/g, '').toLowerCase();
  const words = cleanText.split(/\s+/).filter((w) => w.length > 0);

  if (words.length < 10) {
    return { language: 'unknown', confidence: 0 };
  }

  const totalWords = words.length;
  const scores: Record<string, number> = {};

  for (const [lang, stopwords] of Object.entries(STOPWORDS)) {
    let matches = 0;
    for (const word of words) {
      if (stopwords.has(word)) matches++;
    }
    scores[lang] = matches / totalWords;
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [bestLang, bestScore] = sorted[0];
  const secondScore = sorted[1]?.[1] ?? 0;

  if (bestScore < CONFIDENCE_THRESHOLD || bestScore - secondScore < 0.01) {
    return { language: 'unknown', confidence: bestScore };
  }

  return { language: bestLang, confidence: bestScore };
}
