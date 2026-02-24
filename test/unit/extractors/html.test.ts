import { HtmlExtractor } from '../../../src/extractors/html.js';
import { validateStandardHtml } from '../../../src/core/standard-html.js';

describe('HtmlExtractor', () => {
  const extractor = new HtmlExtractor();

  it('should support .html and .htm extensions', () => {
    expect(extractor.canHandle('.html')).toBe(true);
    expect(extractor.canHandle('.htm')).toBe(true);
    expect(extractor.canHandle('.pdf')).toBe(false);
  });

  it('should extract body content to StandardHTML', async () => {
    const input = Buffer.from('<html><head><title>Test</title></head><body><p>Hello world.</p></body></html>');
    const result = await extractor.extract(input);

    expect(result.html).toContain('<article>');
    expect(result.html).toContain('<p>Hello world.</p>');
    expect(result.metadata.sourceFormat).toBe('html');
    expect(result.metadata.title).toBe('Test');
  });

  it('should extract metadata from head', async () => {
    const input = Buffer.from(
      '<html lang="pt"><head><title>Doc</title><meta name="author" content="João"></head><body><p>Text</p></body></html>'
    );
    const result = await extractor.extract(input);

    expect(result.metadata.title).toBe('Doc');
    expect(result.metadata.author).toBe('João');
    expect(result.metadata.language).toBe('pt');
  });

  it('should strip scripts, styles, and nav elements', async () => {
    const input = Buffer.from(
      '<html><body><script>alert(1)</script><style>body{}</style><nav>Menu</nav><p>Content</p></body></html>'
    );
    const result = await extractor.extract(input);

    expect(result.html).not.toContain('script');
    expect(result.html).not.toContain('style');
    expect(result.html).not.toContain('nav');
    expect(result.html).toContain('Content');
  });

  it('should produce valid StandardHTML', async () => {
    const input = Buffer.from('<html><body><div><h1>Title</h1><p>Text</p><ul><li>Item</li></ul></div></body></html>');
    const result = await extractor.extract(input);

    const validation = validateStandardHtml(result.html);
    expect(validation.valid).toBe(true);
  });

  it('should strip disallowed tags but keep content', async () => {
    const input = Buffer.from('<html><body><main><p>Keep this</p></main></body></html>');
    const result = await extractor.extract(input);

    expect(result.html).toContain('Keep this');
    expect(result.html).not.toContain('<main>');
  });

  it('should handle empty body', async () => {
    const input = Buffer.from('<html><body></body></html>');
    const result = await extractor.extract(input);

    expect(result.warnings).toContain('HTML document produced no extractable content');
  });
});
