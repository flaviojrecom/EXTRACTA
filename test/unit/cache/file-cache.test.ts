import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { FileCache } from '../../../src/cache/file-cache.js';

let tmpDir: string;
let cache: FileCache;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'extracta-cache-test-'));
  cache = new FileCache(tmpDir);
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

describe('FileCache', () => {
  it('should return null for cache miss', () => {
    expect(cache.get('nonexistent')).toBeNull();
  });

  it('should store and retrieve cached data', () => {
    const data = { html: '<p>Hello</p>', metadata: { title: 'Test' } };
    cache.set('abc123', data);
    const result = cache.get('abc123');
    expect(result).not.toBeNull();
    expect(result!.html).toBe('<p>Hello</p>');
    expect(result!.metadata).toEqual({ title: 'Test' });
  });

  it('should report has correctly', () => {
    expect(cache.has('missing')).toBe(false);
    cache.set('exists', { html: '<p>X</p>', metadata: {} });
    expect(cache.has('exists')).toBe(true);
  });

  it('should compute SHA-256 hash', () => {
    const hash = FileCache.hashContent(Buffer.from('hello'));
    expect(hash).toHaveLength(64); // SHA-256 hex
    expect(hash).toMatch(/^[a-f0-9]+$/);
  });

  it('should produce different hashes for different content', () => {
    const h1 = FileCache.hashContent(Buffer.from('hello'));
    const h2 = FileCache.hashContent(Buffer.from('world'));
    expect(h1).not.toBe(h2);
  });
});
