import { describe, it, expect } from 'vitest';
import {
  ExtractaError,
  UnsupportedFormatError,
  ScannedPdfError,
  ExtractionError,
  EmptyDocumentError,
} from '../../../src/core/errors.js';

describe('ExtractaError', () => {
  it('should create an error with code, stage, and recoverable properties', () => {
    const error = new ExtractaError('test error', 'TEST_CODE', 'test-stage', true);

    expect(error.message).toBe('test error');
    expect(error.code).toBe('TEST_CODE');
    expect(error.stage).toBe('test-stage');
    expect(error.recoverable).toBe(true);
    expect(error.name).toBe('ExtractaError');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ExtractaError);
  });

  it('should support non-recoverable errors', () => {
    const error = new ExtractaError('fatal', 'FATAL', 'init', false);
    expect(error.recoverable).toBe(false);
  });
});

describe('UnsupportedFormatError', () => {
  it('should have correct defaults', () => {
    const error = new UnsupportedFormatError('Unknown file type');

    expect(error.code).toBe('UNSUPPORTED_FORMAT');
    expect(error.stage).toBe('analyze');
    expect(error.recoverable).toBe(false);
    expect(error.name).toBe('UnsupportedFormatError');
    expect(error).toBeInstanceOf(ExtractaError);
    expect(error).toBeInstanceOf(Error);
  });

  it('should accept custom stage', () => {
    const error = new UnsupportedFormatError('bad format', 'custom-stage');
    expect(error.stage).toBe('custom-stage');
  });
});

describe('ScannedPdfError', () => {
  it('should have correct defaults', () => {
    const error = new ScannedPdfError('PDF is scanned');

    expect(error.code).toBe('SCANNED_PDF');
    expect(error.stage).toBe('extract');
    expect(error.recoverable).toBe(false);
    expect(error.name).toBe('ScannedPdfError');
    expect(error).toBeInstanceOf(ExtractaError);
  });
});

describe('ExtractionError', () => {
  it('should have correct defaults', () => {
    const error = new ExtractionError('extraction failed');

    expect(error.code).toBe('EXTRACTION_FAILED');
    expect(error.stage).toBe('extract');
    expect(error.recoverable).toBe(false);
    expect(error.name).toBe('ExtractionError');
    expect(error).toBeInstanceOf(ExtractaError);
  });

  it('should support recoverable flag', () => {
    const error = new ExtractionError('partial failure', 'extract', true);
    expect(error.recoverable).toBe(true);
  });
});

describe('EmptyDocumentError', () => {
  it('should have correct defaults', () => {
    const error = new EmptyDocumentError('no content');

    expect(error.code).toBe('EMPTY_DOCUMENT');
    expect(error.stage).toBe('extract');
    expect(error.recoverable).toBe(false);
    expect(error.name).toBe('EmptyDocumentError');
    expect(error).toBeInstanceOf(ExtractaError);
  });
});
