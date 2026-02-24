import { describe, it, expect } from 'vitest';
import { computeQualityScore } from '../../../src/quality/scorer.js';
import type { StructuredDocument } from '../../../src/core/document.js';
import type { Chunk } from '../../../src/chunker/types.js';

function makeDoc(overrides?: Partial<StructuredDocument['qualityIndicators']>): StructuredDocument {
  return {
    metadata: { title: 'Test', author: 'A', language: 'en', sourceFormat: 'pdf' },
    sections: [
      { id: 'ch1', level: 1, title: 'Ch1', content: 'Content', children: [
        { id: 's1', level: 2, title: 'S1', content: 'Sub', children: [], meta: { wordCount: 1, charCount: 3 } },
      ], meta: { wordCount: 1, charCount: 7 } },
    ],
    qualityIndicators: { structurePreserved: 90, noiseRemoved: 60, metadataCompleteness: 80, ...overrides },
  };
}

function makeChunks(count: number, tokenCount = 750): Chunk[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `chunk-${String(i + 1).padStart(3, '0')}`,
    content: 'x'.repeat(100),
    metadata: {
      chunkId: `chunk-${String(i + 1).padStart(3, '0')}`,
      chapterTitle: 'Ch1',
      sectionTitle: 'S1',
      tokenCount,
      overlapTokens: i > 0 ? 20 : 0,
      position: { index: i, total: count },
    },
  }));
}

describe('Quality Scorer', () => {
  it('should return overall score between 0 and 100', () => {
    const score = computeQualityScore(makeDoc(), makeChunks(5));
    expect(score.overall).toBeGreaterThanOrEqual(0);
    expect(score.overall).toBeLessThanOrEqual(100);
  });

  it('should have higher score for well-structured docs', () => {
    const good = computeQualityScore(makeDoc({ structurePreserved: 100 }), makeChunks(5));
    const bad = computeQualityScore(makeDoc({ structurePreserved: 20 }), makeChunks(5));
    expect(good.structureScore).toBeGreaterThan(bad.structureScore);
  });

  it('should penalize inconsistent chunk sizes', () => {
    const consistent = makeChunks(5, 750);
    const inconsistent = [
      ...makeChunks(2, 100),
      ...makeChunks(2, 900),
      ...makeChunks(1, 50),
    ];
    const goodScore = computeQualityScore(makeDoc(), consistent);
    const badScore = computeQualityScore(makeDoc(), inconsistent);
    expect(goodScore.chunkConsistencyScore).toBeGreaterThan(badScore.chunkConsistencyScore);
  });

  it('should score metadata completeness', () => {
    const full = computeQualityScore(makeDoc(), makeChunks(5));
    expect(full.metadataScore).toBeGreaterThan(0);
  });

  it('should handle empty chunks', () => {
    const score = computeQualityScore(makeDoc(), []);
    expect(score.chunkConsistencyScore).toBe(50); // neutral
    expect(score.overall).toBeGreaterThanOrEqual(0);
  });

  it('should include breakdown', () => {
    const score = computeQualityScore(makeDoc(), makeChunks(3));
    expect(score).toHaveProperty('structureScore');
    expect(score).toHaveProperty('chunkConsistencyScore');
    expect(score).toHaveProperty('metadataScore');
    expect(score).toHaveProperty('overall');
  });
});
