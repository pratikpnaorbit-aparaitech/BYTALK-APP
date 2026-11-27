export const MAX_HOME_CARD_IMAGE_BYTES = 5 * 1024 * 1024;

function imageError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

export function decodeHomeCardImage(dataUrl) {
  const match = typeof dataUrl === 'string'
    ? dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/)
    : null;
  if (!match || match[2].length % 4 !== 0) {
    throw imageError('Choose a valid PNG, JPEG, or WebP image.', 400);
  }

  const [, mimeType, base64] = match;
  const buffer = Buffer.from(base64, 'base64');
  if (buffer.length > MAX_HOME_CARD_IMAGE_BYTES) {
    throw imageError('Home card images must be 5 MB or smaller.', 413);
  }

  const signatures = {
    'image/jpeg': buffer.length >= 3 && buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])),
    'image/png': buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex')),
    'image/webp': buffer.length >= 12
      && buffer.subarray(0, 4).toString('ascii') === 'RIFF'
      && buffer.subarray(8, 12).toString('ascii') === 'WEBP',
  };
  if (!buffer.length || !signatures[mimeType]) {
    throw imageError('The selected file is not a valid image of the specified type.', 400);
  }

  return {
    buffer,
    extension: mimeType === 'image/jpeg' ? 'jpg' : mimeType.slice('image/'.length),
  };
}
