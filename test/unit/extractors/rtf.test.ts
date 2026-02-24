import { RtfExtractor } from '../../../src/extractors/rtf.js';
import { validateStandardHtml } from '../../../src/core/standard-html.js';

describe('RtfExtractor', () => {
  const extractor = new RtfExtractor();

  it('should support .rtf extension', () => {
    expect(extractor.canHandle('.rtf')).toBe(true);
    expect(extractor.canHandle('.pdf')).toBe(false);
  });

  it('should detect RTF by magic bytes', () => {
    const buf = Buffer.from('{\\rtf1\\ansi This is a test}');
    expect(extractor.canHandle('.unknown', buf)).toBe(true);
  });

  it('should extract plain text from simple RTF', async () => {
    const rtf = '{\\rtf1\\ansi Hello world.\\par\\par Second paragraph.}';
    const result = await extractor.extract(Buffer.from(rtf));

    expect(result.html).toContain('<article>');
    expect(result.html).toContain('Hello world.');
    expect(result.html).toContain('Second paragraph.');
    expect(result.metadata.sourceFormat).toBe('rtf');
  });

  it('should produce valid StandardHTML', async () => {
    const rtf = '{\\rtf1\\ansi A paragraph.\\par\\par Another one.}';
    const result = await extractor.extract(Buffer.from(rtf));

    const validation = validateStandardHtml(result.html);
    expect(validation.valid).toBe(true);
  });

  it('should handle hex escapes', async () => {
    // \'e9 = é
    const rtf = "{\\rtf1\\ansi caf\\'e9}";
    const result = await extractor.extract(Buffer.from(rtf));

    expect(result.html).toContain('café');
  });

  it('should skip font/color tables', async () => {
    const rtf = '{\\rtf1{\\fonttbl{\\f0 Arial;}}{\\colortbl;\\red0\\green0\\blue0;}Hello}';
    const result = await extractor.extract(Buffer.from(rtf));

    expect(result.html).toContain('Hello');
    expect(result.html).not.toContain('Arial');
    expect(result.html).not.toContain('colortbl');
  });

  it('should handle special chars', async () => {
    const rtf = '{\\rtf1 A\\emdash B \\bullet item}';
    const result = await extractor.extract(Buffer.from(rtf));

    expect(result.html).toContain('—');
    expect(result.html).toContain('•');
  });

  it('should warn on empty content', async () => {
    const rtf = '{\\rtf1}';
    const result = await extractor.extract(Buffer.from(rtf));

    expect(result.warnings).toContain('RTF document produced no extractable text');
  });
});
