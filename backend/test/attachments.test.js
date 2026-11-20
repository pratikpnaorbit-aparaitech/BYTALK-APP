import test from 'node:test';
import assert from 'node:assert/strict';
import { decodePdfAttachment, MAX_PDF_SIZE_BYTES } from '../src/attachments.js';

test('decodePdfAttachment accepts valid PDF bytes', () => {
  const pdf = Buffer.from('%PDF-1.7\nBYTALK test');
  assert.deepEqual(decodePdfAttachment(pdf.toString('base64')), pdf);
});

test('decodePdfAttachment rejects non-PDF data and oversized files', () => {
  assert.throws(
    () => decodePdfAttachment(Buffer.from('not a PDF').toString('base64')),
    { message: 'The selected file is not a valid PDF.', status: 400 }
  );
  assert.throws(
    () => decodePdfAttachment('A'.repeat(Math.ceil((MAX_PDF_SIZE_BYTES / 3) * 4 + 8))),
    { message: 'PDF files must be 8 MB or smaller.', status: 413 }
  );
});
