import {
  validateStandardHtml,
  stripDisallowedTags,
  getAllowedTags,
} from '../../../src/core/standard-html.js';

describe('StandardHTML validator', () => {
  it('should accept all allowed tags', () => {
    const html = '<article><section><h1>Title</h1><p>Text</p><ul><li>Item</li></ul></section></article>';
    const result = validateStandardHtml(html);
    expect(result.valid).toBe(true);
    expect(result.invalidTags).toEqual([]);
  });

  it('should reject disallowed tags', () => {
    const html = '<div><script>alert(1)</script><style>body{}</style><p>ok</p></div>';
    const result = validateStandardHtml(html);
    expect(result.valid).toBe(false);
    expect(result.invalidTags).toContain('script');
    expect(result.invalidTags).toContain('style');
  });

  it('should handle empty string', () => {
    const result = validateStandardHtml('');
    expect(result.valid).toBe(true);
  });

  it('should handle plain text without tags', () => {
    const result = validateStandardHtml('Just plain text');
    expect(result.valid).toBe(true);
  });

  it('should strip disallowed tags', () => {
    const html = '<p>Keep</p><script>remove</script><style>remove</style><strong>keep</strong>';
    const stripped = stripDisallowedTags(html);
    expect(stripped).toContain('<p>Keep</p>');
    expect(stripped).toContain('<strong>keep</strong>');
    expect(stripped).not.toContain('<script>');
    expect(stripped).not.toContain('<style>');
  });

  it('should return allowed tags set', () => {
    const tags = getAllowedTags();
    expect(tags.has('article')).toBe(true);
    expect(tags.has('p')).toBe(true);
    expect(tags.has('script')).toBe(false);
  });
});
