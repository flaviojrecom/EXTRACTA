export interface ITokenizer {
  encode(text: string): number[];
  countTokens(text: string): number;
  name: string;
}

export interface ChunkOptions {
  minTokens: number;
  maxTokens: number;
  targetTokens: number;
  overlapStrategy: 'semantic' | 'fixed';
  preserveStructures: boolean;
}

export interface Chunk {
  id: string;
  content: string;
  metadata: ChunkMetadata;
}

export interface ChunkMetadata {
  chunkId: string;
  chapterTitle?: string;
  sectionTitle?: string;
  tokenCount: number;
  overlapTokens: number;
  position: {
    index: number;
    total: number;
  };
}
