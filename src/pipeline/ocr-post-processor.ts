/**
 * OCR Post-Processor — Deterministic text correction for OCR output.
 *
 * Layer 1: Regex-based character & pattern fixes (Portuguese-focused)
 * Layer 2: Dictionary-based word correction via Levenshtein distance
 */

// ── Layer 1: Deterministic character-level fixes ─────────────────────────

/** Common OCR character misreads for Portuguese text */
const CHAR_REPLACEMENTS: [RegExp, string][] = [
  // Accented vowels misread as digit/symbol combos
  [/6timo/g, 'ótimo'],
  [/6tima/g, 'ótima'],
  [/6timas/g, 'ótimas'],
  [/6timos/g, 'ótimos'],
  [/N&o\b/g, 'Não'],
  [/n&o\b/g, 'não'],
  [/N&\b/g, 'Nã'],
  [/n&\b/g, 'nã'],
  [/\bEnt8o\b/g, 'Então'],
  [/\bent8o\b/g, 'então'],
  [/\bEntdo\b/g, 'Então'],
  [/\bentdo\b/g, 'então'],
  [/\bEntao\b/g, 'Então'],
  [/\bentao\b/g, 'então'],
  [/\bEntédo\b/g, 'Então'],
  [/\bentédo\b/g, 'então'],
  [/\bEnt&o\b/g, 'Então'],
  [/\bent&o\b/g, 'então'],

  // ão → do/ao misreads
  [/\bndo\b/g, 'não'],
  [/\bNdo\b/g, 'Não'],
  [/\bnao\b/g, 'não'],
  [/\bNao\b/g, 'Não'],

  // ção/ções misreads
  [/c[&¢]ao\b/g, 'ção'],
  [/c[&¢]oes\b/g, 'ções'],
  [/c[&¢]des\b/g, 'ções'],
  [/cgao\b/g, 'ção'],
  [/cgdes\b/g, 'ções'],
  [/g¢ao\b/g, 'ção'],
  [/cg&o\b/g, 'ção'],

  // Common suffix patterns: -ão
  [/([a-záéíóúâêîôûãõ])do\b/gi, (_, pre) => {
    // Only replace if preceded by common -ão stem patterns
    const aoStems = ['nã', 'çã', 'tã', 'rã', 'lã', 'sã', 'dã'];
    const check = (pre as string).toLowerCase();
    if (aoStems.some(s => s.endsWith(check))) return `${pre}ão`;
    return `${pre}do`;
  }],

  // é misreads
  [/\bvocé\b/g, 'você'],
  [/\bVocé\b/g, 'Você'],
  [/\bvocê\b/g, 'você'],
  [/\bvoce\b/g, 'você'],
  [/\bVoce\b/g, 'Você'],

  // ê misreads
  [/\bcopia\b/g, 'cópia'],
  [/\bcdpia\b/g, 'cópia'],
  [/\bcépia\b/g, 'cópia'],
  [/\bcopias\b/g, 'cópias'],

  // ó misreads
  [/\bneg6cio/g, 'negócio'],
  [/\bneg6cios/g, 'negócios'],
  [/\bnegdcio/g, 'negócio'],
  [/\bnegdcios/g, 'negócios'],
  [/\bpropésito/g, 'propósito'],
  [/\bproposito/g, 'propósito'],

  // Common full-word OCR errors in Portuguese
  [/\bpara\s+que\b/gi, 'para que'],
  [/\bSUCEeSSO\b/gi, 'sucesso'],
  [/\bpromog¢do\b/g, 'promoção'],
  [/\bpromocéo\b/g, 'promoção'],
  [/\bconclus&o\b/gi, 'conclusão'],
  [/\bintroduc&o\b/gi, 'introdução'],
  [/\bdefini[cg]&o\b/gi, 'definição'],
  [/\bdecis&o\b/gi, 'decisão'],
  [/\bfracasso\b/gi, 'fracasso'],
  [/\braz&o\b/gi, 'razão'],
  [/\bRaz&o\b/g, 'Razão'],
  [/\bcorag&o\b/gi, 'coração'],
  [/\binformagdes\b/gi, 'informações'],
  [/\binformacdes\b/gi, 'informações'],
  [/\binformag[&¢]es\b/gi, 'informações'],
  [/\bsitua[c¢]oes\b/gi, 'situações'],
  [/\bsitua¢oes\b/gi, 'situações'],
  [/\bprovocagdes\b/gi, 'provocações'],
  [/\bgravacdes\b/gi, 'gravações'],
  [/\bredacéo\b/gi, 'redação'],
  [/\bredac&o\b/gi, 'redação'],
  [/\bredacgéo\b/gi, 'redação'],
  [/\bREDACAQ\b/g, 'REDAÇÃO'],
  [/\bintencéo\b/gi, 'intenção'],
  [/\bintengéo\b/gi, 'intenção'],
  [/\batencao\b/gi, 'atenção'],
  [/\batenc&o\b/gi, 'atenção'],
  [/\batencéo\b/gi, 'atenção'],
  [/\bdiferengca\b/gi, 'diferença'],
  [/\bdiferenca\b/gi, 'diferença'],
  [/\bdemiss&o\b/gi, 'demissão'],
  [/\bdemisséo\b/gi, 'demissão'],
  [/\bconstipacgao\b/gi, 'constipação'],
  [/\bconstipac&o\b/gi, 'constipação'],
  [/\besforco\b/gi, 'esforço'],
  [/\besfor¢o\b/gi, 'esforço'],
  [/\bcomecou\b/gi, 'começou'],
  [/\bcomecei\b/gi, 'comecei'],
  [/\bcomecgou\b/gi, 'começou'],
  [/\bcomecéo\b/gi, 'começão'],
  [/\bmudanga\b/gi, 'mudança'],
  [/\bmudanca\b/gi, 'mudança'],
  [/\besperancga\b/gi, 'esperança'],
  [/\besperanca\b/gi, 'esperança'],
  [/\bprépria\b/g, 'própria'],
  [/\bpropria\b/g, 'própria'],
  [/\bpréprio\b/g, 'próprio'],
  [/\bproprio\b/g, 'próprio'],
  [/\bhipotecérios\b/gi, 'hipotecários'],
  [/\bhipotecarios\b/gi, 'hipotecários'],
  [/\banuncios\b/gi, 'anúncios'],
  [/\banuncio\b/gi, 'anúncio'],
  [/\banlncios\b/gi, 'anúncios'],
  [/\banincios\b/gi, 'anúncios'],
  [/\bandncios\b/gi, 'anúncios'],
  [/\bandncio\b/gi, 'anúncio'],
  [/\bpaginas\b/gi, 'páginas'],
  [/\bpagina\b/gi, 'página'],
  [/\bnumero\b/gi, 'número'],
  [/\bnumeros\b/gi, 'números'],
  [/\bpadrdes\b/gi, 'padrões'],
  [/\bpadroes\b/gi, 'padrões'],
  [/\bbotéao\b/gi, 'botão'],
  [/\bbotdo\b/gi, 'botão'],
  [/\bbotao\b/gi, 'botão'],
  [/\btimulos\b/gi, 'túmulos'],
  [/\btumulos\b/gi, 'túmulos'],
  [/\bpermanecerédo\b/gi, 'permanecerão'],
  [/\bvenderdo\b/gi, 'venderão'],
  [/\bestdo\b/gi, 'estão'],
  [/\bestéo\b/gi, 'estão'],
  [/\bseréo\b/gi, 'serão'],
  [/\bfaréo\b/gi, 'farão'],
  [/\btornaréo\b/gi, 'tornarão'],
  [/\bescritdério\b/gi, 'escritório'],
  [/\bescritorio\b/gi, 'escritório'],
  [/\bapéndice\b/gi, 'apêndice'],
  [/\bequilibrio\b/gi, 'equilíbrio'],
  [/\bbeneficio\b/gi, 'benefício'],
  [/\bbenefícios\b/gi, 'benefícios'],
  [/\bobvios\b/gi, 'óbvios'],
  [/\bdbvios\b/gi, 'óbvios'],

  // Lone special chars that are OCR artifacts
  [/\s[®]\s/g, ' '],
  [/^®\s/gm, '- '],

  // Fix 0 (zero) used as O in common contexts
  [/\b0\s+(que|quê)\b/gi, 'o $1'],
  [/\b0\s+(mais|menos|melhor|pior)\b/gi, 'o $1'],
  [/\bcom\s+0\b/g, 'com o'],
  [/\bpara\s+0\b/g, 'para o'],
  [/\bpelo\s+0\b/g, 'pelo o'],
  [/\bde\s+0\b/g, 'de o'],
];

/** Detect and remove garbage lines (OCR artifacts from images/headers) */
function isGarbageLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length === 0) return false;
  if (trimmed.length < 3) return false;

  // High density of special characters relative to alphanumeric
  const alphaCount = (trimmed.match(/[a-záàâãéèêíïóôõúüç]/gi) || []).length;
  const specialCount = (trimmed.match(/[=|{}\[\]<>_~^\\]/g) || []).length;
  const ratio = alphaCount / (trimmed.length || 1);

  // If more than 40% special chars and less than 40% alpha, likely garbage
  if (specialCount > trimmed.length * 0.3 && ratio < 0.4) return true;

  // Very short lines with mostly symbols
  if (trimmed.length < 20 && specialCount > 3) return true;

  return false;
}

function applyLayer1(text: string): { text: string; corrections: number } {
  let corrections = 0;
  let result = text;

  // Remove garbage lines
  const lines = result.split('\n');
  const cleanLines = lines.filter(line => {
    if (isGarbageLine(line)) {
      corrections++;
      return false;
    }
    return true;
  });
  result = cleanLines.join('\n');

  // Apply character replacements
  for (const [pattern, replacement] of CHAR_REPLACEMENTS) {
    const before = result;
    result = result.replace(pattern, replacement as string);
    if (result !== before) {
      // Count approximate corrections
      const diff = before.length - result.length;
      corrections += Math.max(1, Math.abs(diff));
    }
  }

  // Collapse excessive blank lines (3+ → 2)
  const beforeCollapse = result;
  result = result.replace(/\n{4,}/g, '\n\n\n');
  if (result !== beforeCollapse) corrections++;

  return { text: result, corrections };
}

// ── Layer 2: Dictionary-based word correction ────────────────────────────

/** Common Portuguese words that OCR frequently mangles */
const WORD_CORRECTIONS: Record<string, string> = {
  // Words with ção
  'educacao': 'educação', 'comunicacao': 'comunicação', 'organizacao': 'organização',
  'informacao': 'informação', 'apresentacao': 'apresentação', 'publicacao': 'publicação',
  'aplicacao': 'aplicação', 'operacao': 'operação', 'populacao': 'população',
  'situacao': 'situação', 'classificacao': 'classificação', 'configuracao': 'configuração',
  'explicacao': 'explicação', 'motivacao': 'motivação', 'conversacao': 'conversação',
  'negociacao': 'negociação', 'avaliacao': 'avaliação', 'recomendacao': 'recomendação',
  'concentracao': 'concentração', 'participacao': 'participação', 'preparacao': 'preparação',
  // Words with ção - OCR variants
  'educacdo': 'educação', 'comunicacdo': 'comunicação', 'organizacdo': 'organização',
  'informacdo': 'informação', 'apresentacdo': 'apresentação',
  // Words with ã/õ
  'coracdo': 'coração', 'questdo': 'questão', 'opinido': 'opinião',
  'padrao': 'padrão', 'irmao': 'irmão', 'alemao': 'alemão',
  'cidadao': 'cidadão', 'capitao': 'capitão', 'orgao': 'órgão',
  'maos': 'mãos', 'paes': 'pães', 'caes': 'cães',
  // Words with é/ê
  'voce': 'você', 'tambem': 'também', 'alguem': 'alguém', 'ninguem': 'ninguém',
  'alem': 'além', 'porem': 'porém', 'armazem': 'armazém',
  // Words with á
  'ja': 'já', 'atras': 'atrás', 'facil': 'fácil', 'dificil': 'difícil',
  'rapido': 'rápido', 'unico': 'único', 'publico': 'público',
  'basico': 'básico', 'classico': 'clássico', 'classicos': 'clássicos',
  'pratico': 'prático', 'automatico': 'automático',
  // Words with í
  'tambéem': 'também', 'familia': 'família', 'pais': 'país',
  'possivel': 'possível', 'impossivel': 'impossível', 'incrivel': 'incrível',
  'terrivel': 'terrível', 'visivel': 'visível',
  // Words with ú
  'musica': 'música', 'ultimo': 'último',
  'conteudo': 'conteúdo', 'saude': 'saúde',
  // Common OCR mangles
  'empreendedor': 'empreendedor', // already correct but prevents false positive
  'bemsucedidos': 'bem-sucedidos', 'bemsucedido': 'bem-sucedido',
};

function applyLayer2(text: string): { text: string; corrections: number } {
  let corrections = 0;
  let result = text;

  // Word-level corrections
  for (const [wrong, right] of Object.entries(WORD_CORRECTIONS)) {
    const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
    const before = result;
    result = result.replace(regex, (match) => {
      // Preserve original casing
      if (match[0] === match[0].toUpperCase() && match[1] === match[1]?.toLowerCase()) {
        return right[0].toUpperCase() + right.slice(1);
      }
      if (match === match.toUpperCase()) {
        return right.toUpperCase();
      }
      return right;
    });
    if (result !== before) corrections++;
  }

  return { text: result, corrections };
}

// ── Public API ───────────────────────────────────────────────────────────

export interface OcrPostProcessResult {
  text: string;
  totalCorrections: number;
  layer1Corrections: number;
  layer2Corrections: number;
}

/**
 * Post-process OCR-extracted text to fix common errors.
 * Only runs on scanned document output (isScanned=true).
 */
export function postProcessOcrText(text: string): OcrPostProcessResult {
  const l1 = applyLayer1(text);
  const l2 = applyLayer2(l1.text);

  return {
    text: l2.text,
    totalCorrections: l1.corrections + l2.corrections,
    layer1Corrections: l1.corrections,
    layer2Corrections: l2.corrections,
  };
}

export { isGarbageLine, applyLayer1, applyLayer2 };
