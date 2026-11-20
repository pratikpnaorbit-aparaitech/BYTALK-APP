export const MAX_PDF_SIZE_BYTES = 8 * 1024 * 1024;

function attachmentError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

export function decodePdfAttachment(base64) {
  const maxBase64Length = Math.ceil(MAX_PDF_SIZE_BYTES / 3) * 4;
  if (typeof base64 !== 'string' || !base64) {
    throw attachmentError('The PDF attachment is invalid.', 400);
  }
  if (base64.length > maxBase64Length) {
    throw attachmentError('PDF files must be 8 MB or smaller.', 413);
  }
  if (base64.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) {
    throw attachmentError('The PDF attachment is invalid.', 400);
  }

  const pdfBuffer = Buffer.from(base64, 'base64');
  if (pdfBuffer.length > MAX_PDF_SIZE_BYTES) {
    throw attachmentError('PDF files must be 8 MB or smaller.', 413);
  }
  if (pdfBuffer.length < 5 || pdfBuffer.subarray(0, 5).toString('ascii') !== '%PDF-') {
    throw attachmentError('The selected file is not a valid PDF.', 400);
  }
  return pdfBuffer;
}
