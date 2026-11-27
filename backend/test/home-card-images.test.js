import test from 'node:test';
import assert from 'node:assert/strict';
import { decodeHomeCardImage, MAX_HOME_CARD_IMAGE_BYTES } from '../src/homeCardImages.js';

const onePixelPng = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l3sAAAAASUVORK5CYII=';

test('decodes supported home card images with matching file signatures', () => {
  const image = decodeHomeCardImage(`data:image/png;base64,${onePixelPng}`);
  assert.equal(image.extension, 'png');
  assert.equal(image.buffer.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
});

test('rejects invalid image data, mismatched MIME types, and oversized images', () => {
  assert.throws(() => decodeHomeCardImage('data:image/gif;base64,R0lGODlh'), /valid PNG, JPEG, or WebP/);
  assert.throws(() => decodeHomeCardImage(`data:image/jpeg;base64,${onePixelPng}`), /not a valid image/);
  assert.throws(
    () => decodeHomeCardImage(`data:image/png;base64,${Buffer.alloc(MAX_HOME_CARD_IMAGE_BYTES + 1, 0).toString('base64')}`),
    /5 MB or smaller/,
  );
});
