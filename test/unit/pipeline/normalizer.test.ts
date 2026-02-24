import { Normalizer } from '../../../src/pipeline/normalizer.js';

describe('Normalizer', () => {
  const normalizer = new Normalizer();

  it('should have correct name', () => {
    expect(normalizer.name).toBe('normalize');
  });

  it('should remove BOM', async () => {
    const input = '\uFEFF<article><p>Hello</p></article>';
    const result = await normalizer.process(input);
    expect(result).not.toContain('\uFEFF');
    expect(result).toContain('<article>');
  });

  it('should normalize Unicode to NFC', async () => {
    // e + combining acute = é (NFD) → é (NFC)
    const nfd = 'e\u0301';
    const input = `<article><p>${nfd}</p></article>`;
    const result = await normalizer.process(input);
    expect(result).toContain('\u00E9'); // NFC form
  });

  it('should replace smart quotes with straight quotes', async () => {
    const input = '<article><p>\u201CHello\u201D \u2018world\u2019</p></article>';
    const result = await normalizer.process(input);
    expect(result).toContain('"Hello"');
    expect(result).toContain("'world'");
  });

  it('should replace em/en dashes with hyphens', async () => {
    const input = '<article><p>word\u2013word\u2014word</p></article>';
    const result = await normalizer.process(input);
    expect(result).toContain('word-word-word');
  });

  it('should replace ellipsis character', async () => {
    const input = '<article><p>wait\u2026</p></article>';
    const result = await normalizer.process(input);
    expect(result).toContain('wait...');
  });

  it('should fix hyphenation across lines', async () => {
    const input = '<article><p>develop-\nment of the system</p></article>';
    const result = await normalizer.process(input);
    expect(result).toContain('development');
  });

  it('should remove artificial mid-sentence line breaks in paragraphs', async () => {
    const input = '<article><p>This is a sentence that was\nbroken across lines</p></article>';
    const result = await normalizer.process(input);
    expect(result).toContain('sentence that was broken');
  });

  it('should collapse multiple spaces', async () => {
    const input = '<article><p>Hello   world    here</p></article>';
    const result = await normalizer.process(input);
    expect(result).toContain('Hello world here');
  });

  it('should remove trailing spaces', async () => {
    const input = '<article><p>Hello   </p></article>';
    const result = await normalizer.process(input);
    expect(result).not.toMatch(/ +<\/p>/);
  });

  it('should preserve whitespace inside <pre> tags', async () => {
    const input = '<article><pre>  code   with   spaces  </pre></article>';
    const result = await normalizer.process(input);
    expect(result).toContain('  code   with   spaces  ');
  });

  it('should remove control characters', async () => {
    const input = '<article><p>Hello\x00\x01\x02World</p></article>';
    const result = await normalizer.process(input);
    expect(result).toContain('HelloWorld');
    // eslint-disable-next-line no-control-regex
    expect(result).not.toMatch(/[\x00-\x08]/);
  });

  it('should replace non-breaking spaces', async () => {
    const input = '<article><p>Hello\u00A0world</p></article>';
    const result = await normalizer.process(input);
    expect(result).toContain('Hello world');
  });

  it('should call onProgress callback', async () => {
    const progress: number[] = [];
    await normalizer.process('<article><p>test</p></article>', {
      onProgress: (pct) => progress.push(pct),
    });
    expect(progress.length).toBeGreaterThan(0);
    expect(progress[progress.length - 1]).toBe(100);
  });
});
