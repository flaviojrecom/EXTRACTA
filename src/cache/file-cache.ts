import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export interface CachedResult {
  html: string;
  metadata: Record<string, unknown>;
}

export class FileCache {
  private readonly cacheDir: string;

  constructor(baseDir: string) {
    this.cacheDir = join(baseDir, '.extracta-cache');
  }

  static hashContent(content: Buffer): string {
    return createHash('sha256').update(content).digest('hex');
  }

  get(hash: string): CachedResult | null {
    const dir = join(this.cacheDir, hash);
    const htmlPath = join(dir, 'standard.html');
    const metaPath = join(dir, 'metadata.json');

    if (!existsSync(htmlPath)) return null;

    try {
      const html = readFileSync(htmlPath, 'utf-8');
      const metadata = existsSync(metaPath)
        ? JSON.parse(readFileSync(metaPath, 'utf-8'))
        : {};
      return { html, metadata };
    } catch {
      return null;
    }
  }

  set(hash: string, data: CachedResult): void {
    const dir = join(this.cacheDir, hash);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'standard.html'), data.html, 'utf-8');
    writeFileSync(join(dir, 'metadata.json'), JSON.stringify(data.metadata), 'utf-8');
  }

  has(hash: string): boolean {
    return existsSync(join(this.cacheDir, hash, 'standard.html'));
  }
}
