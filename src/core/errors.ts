export class ExtractaError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly stage: string,
    public readonly recoverable: boolean,
  ) {
    super(message);
    this.name = 'ExtractaError';
  }
}

export class UnsupportedFormatError extends ExtractaError {
  constructor(message: string, stage: string = 'analyze') {
    super(message, 'UNSUPPORTED_FORMAT', stage, false);
    this.name = 'UnsupportedFormatError';
  }
}

export class ScannedPdfError extends ExtractaError {
  constructor(message: string, stage: string = 'extract') {
    super(message, 'SCANNED_PDF', stage, false);
    this.name = 'ScannedPdfError';
  }
}

export class ExtractionError extends ExtractaError {
  constructor(message: string, stage: string = 'extract', recoverable: boolean = false) {
    super(message, 'EXTRACTION_FAILED', stage, recoverable);
    this.name = 'ExtractionError';
  }
}

export class EmptyDocumentError extends ExtractaError {
  constructor(message: string, stage: string = 'extract') {
    super(message, 'EMPTY_DOCUMENT', stage, false);
    this.name = 'EmptyDocumentError';
  }
}
