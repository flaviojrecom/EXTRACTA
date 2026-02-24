import { MobiExtractor } from '../../../src/extractors/mobi.js';

describe('MobiExtractor', () => {
  const extractor = new MobiExtractor();

  it('should support .mobi, .azw, .azw3 extensions', () => {
    expect(extractor.canHandle('.mobi')).toBe(true);
    expect(extractor.canHandle('.azw')).toBe(true);
    expect(extractor.canHandle('.azw3')).toBe(true);
    expect(extractor.canHandle('.pdf')).toBe(false);
  });

  it('should detect MOBI by magic bytes at offset 60', () => {
    const buf = Buffer.alloc(68, 0);
    buf.write('BOOKMOBI', 60, 'ascii');
    expect(extractor.canHandle('.unknown', buf)).toBe(true);
  });

  it('should detect PalmDOC by magic bytes at offset 60', () => {
    const buf = Buffer.alloc(68, 0);
    buf.write('TEXtREAd', 60, 'ascii');
    expect(extractor.canHandle('.unknown', buf)).toBe(true);
  });

  it('should not detect random data as MOBI', () => {
    const buf = Buffer.alloc(68, 0x41);
    expect(extractor.canHandle('.unknown', buf)).toBe(false);
  });

  it('should throw ExtractionError on invalid data', async () => {
    const buf = Buffer.from('not a mobi file');
    await expect(extractor.extract(buf)).rejects.toThrow('Failed to extract MOBI/AZW');
  });
});
