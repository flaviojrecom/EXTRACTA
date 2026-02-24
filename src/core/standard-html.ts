const ALLOWED_TAGS = new Set([
  'article',
  'section',
  'div',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'p',
  'span',
  'em',
  'strong',
  'a',
  'ul',
  'ol',
  'li',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  'pre',
  'code',
  'blockquote',
  'br',
  'hr',
]);

export function getAllowedTags(): ReadonlySet<string> {
  return ALLOWED_TAGS;
}

export function validateStandardHtml(html: string): { valid: boolean; invalidTags: string[] } {
  const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;
  const invalidTags = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(html)) !== null) {
    const tag = match[1].toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) {
      invalidTags.add(tag);
    }
  }

  return {
    valid: invalidTags.size === 0,
    invalidTags: [...invalidTags],
  };
}

export function stripDisallowedTags(html: string): string {
  const disallowedTagRegex = new RegExp(
    `</?(?!(?:${[...ALLOWED_TAGS].join('|')})\\b)[a-zA-Z][a-zA-Z0-9]*\\b[^>]*>`,
    'gi',
  );
  return html.replace(disallowedTagRegex, '');
}
