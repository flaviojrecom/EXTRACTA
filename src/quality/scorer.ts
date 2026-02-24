import type { StructuredDocument } from '../core/document.js';
import type { Chunk, ChunkOptions } from '../chunker/types.js';

export interface QualityBreakdown {
  structureScore: number;
  chunkConsistencyScore: number;
  metadataScore: number;
  overall: number;
}

export function computeQualityScore(
  doc: StructuredDocument,
  chunks: Chunk[],
  chunkOptions?: Partial<ChunkOptions>,
): QualityBreakdown {
  const structureScore = computeStructureScore(doc);
  const chunkConsistencyScore = computeChunkConsistency(chunks, chunkOptions);
  const metadataScore = computeMetadataScore(doc, chunks);

  const overall = Math.round(
    structureScore * 0.4 + chunkConsistencyScore * 0.3 + metadataScore * 0.3,
  );

  return { structureScore, chunkConsistencyScore, metadataScore, overall };
}

function computeStructureScore(doc: StructuredDocument): number {
  // Based on QualityIndicators from structure builder
  let preserved = doc.qualityIndicators.structurePreserved; // 0-100

  // OCR penalty: scanned documents lose headings, lists, tables
  if (doc.metadata.isScanned) {
    preserved = preserved * 0.6;
  }

  // Bonus for hierarchy depth
  const maxDepth = getMaxDepth(doc.sections);
  const depthBonus = Math.min(maxDepth * 10, 20); // up to 20 bonus points

  return Math.min(Math.round(preserved * 0.8 + depthBonus), 100);
}

function computeChunkConsistency(chunks: Chunk[], options?: Partial<ChunkOptions>): number {
  if (chunks.length === 0) return 50; // Neutral for unchunked docs

  const min = options?.minTokens ?? 500;
  const max = options?.maxTokens ?? 1000;

  let inRange = 0;
  const sizes: number[] = [];

  for (const chunk of chunks) {
    const tokens = chunk.metadata.tokenCount - chunk.metadata.overlapTokens;
    sizes.push(tokens);
    if (tokens >= min && tokens <= max) inRange++;
  }

  const rangePercent = (inRange / chunks.length) * 100;

  // Variance penalty
  const mean = sizes.reduce((a, b) => a + b, 0) / sizes.length;
  const variance = sizes.reduce((sum, s) => sum + (s - mean) ** 2, 0) / sizes.length;
  const cv = mean > 0 ? Math.sqrt(variance) / mean : 0; // coefficient of variation
  const variancePenalty = Math.min(cv * 50, 30); // up to 30 point penalty

  return Math.max(0, Math.min(100, Math.round(rangePercent - variancePenalty)));
}

function computeMetadataScore(doc: StructuredDocument, chunks: Chunk[]): number {
  let score = 0;
  const total = 5;

  // Document-level metadata
  if (doc.metadata.title) score++;
  if (doc.metadata.author) score++;
  if (doc.metadata.language) score++;

  // Chunk-level metadata completeness
  if (chunks.length > 0) {
    const withChapter = chunks.filter((c) => c.metadata.chapterTitle).length;
    const withSection = chunks.filter((c) => c.metadata.sectionTitle).length;
    if (withChapter / chunks.length > 0.5) score++;
    if (withSection / chunks.length > 0.3) score++;
  } else {
    // No chunks — give partial credit based on doc completeness
    score += doc.qualityIndicators.metadataCompleteness > 50 ? 1 : 0;
  }

  let baseScore = Math.round((score / total) * 100);

  // OCR confidence adjustment
  if (doc.metadata.ocrConfidence !== undefined) {
    if (doc.metadata.ocrConfidence > 80) {
      baseScore = Math.min(100, baseScore + 5); // small bonus for high confidence
    } else if (doc.metadata.ocrConfidence < 60) {
      baseScore = Math.max(0, baseScore - 10); // penalty for low confidence
    }
  }

  return baseScore;
}

function getMaxDepth(sections: { children: typeof sections }[], depth = 1): number {
  let max = depth;
  for (const s of sections) {
    if (s.children.length > 0) {
      max = Math.max(max, getMaxDepth(s.children, depth + 1));
    }
  }
  return max;
}
