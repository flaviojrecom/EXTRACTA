import type { DocumentMetadata } from '../extractors/types.js';

export interface StructuredDocument {
  metadata: DocumentMetadata;
  sections: Section[];
  qualityIndicators: QualityIndicators;
}

export interface Section {
  id: string;
  level: number;
  title: string;
  content: string;
  children: Section[];
  meta: SectionMetadata;
}

export interface SectionMetadata {
  chapter?: string;
  section?: string;
  wordCount: number;
  charCount: number;
}

export interface QualityIndicators {
  structurePreserved: number;
  noiseRemoved: number;
  metadataCompleteness: number;
}
