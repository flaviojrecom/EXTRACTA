export interface IExtractor {
  /** Supported file extensions (e.g., ['.pdf']) */
  supportedExtensions: string[];

  /** Extract content from raw file buffer to StandardHTML */
  extract(input: Buffer, metadata?: FileMetadata): Promise<ExtractionResult>;

  /** Quick check if this extractor can handle the file */
  canHandle(extension: string, buffer?: Buffer): boolean;
}

export interface ExtractionResult {
  html: string;
  metadata: DocumentMetadata;
  warnings: string[];
}

export interface FileMetadata {
  fileName: string;
  extension: string;
  sizeBytes: number;
}

export interface DocumentMetadata {
  title?: string;
  author?: string;
  language?: string;
  pageCount?: number;
  isScanned?: boolean;
  sourceFormat: string;
}
