import { describe, it, expect, vi } from 'vitest';
import { resolve } from 'node:path';
import { PipelineRunner } from '../../../src/pipeline/runner.js';
import type { PipelineConfig } from '../../../src/pipeline/runner.js';

function createTestConfig(overrides?: Partial<PipelineConfig>): PipelineConfig {
  return {
    cleaningLevel: 'standard',
    chunkOptions: {
      minTokens: 500,
      maxTokens: 1000,
      targetTokens: 750,
      overlapStrategy: 'semantic',
      preserveStructures: true,
    },
    exportFormats: ['md'],
    preset: 'rag',
    cache: true,
    verbose: false,
    ...overrides,
  };
}

describe('PipelineRunner', () => {
  const txtFixture = resolve('test/fixtures/txt/sample.txt');

  it('should run pipeline on a TXT file and return result', async () => {
    const config = createTestConfig();
    const runner = new PipelineRunner(config);
    const result = await runner.run(txtFixture);

    expect(result.html).toContain('<article>');
    expect(result.cleanerAuditLog).toBeDefined();
  });

  it('should log stages when verbose is true', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const config = createTestConfig({ verbose: true });
    const runner = new PipelineRunner(config);

    await runner.run(txtFixture);

    const stageCalls = logSpy.mock.calls.filter(
      (call) => typeof call[0] === 'string' && call[0].startsWith('[pipeline]'),
    );
    expect(stageCalls.length).toBeGreaterThan(0);

    logSpy.mockRestore();
  });

  it('should not log when verbose is false', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const config = createTestConfig({ verbose: false });
    const runner = new PipelineRunner(config);

    await runner.run(txtFixture);

    const stageCalls = logSpy.mock.calls.filter(
      (call) => typeof call[0] === 'string' && call[0].startsWith('[pipeline]'),
    );
    expect(stageCalls).toHaveLength(0);

    logSpy.mockRestore();
  });
});
