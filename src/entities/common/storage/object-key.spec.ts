import { BadRequestException } from '@nestjs/common';
import { objectKeyFromPublicUrl } from './object-key';

describe('objectKeyFromPublicUrl', () => {
  const endpoint = 'https://storage.example.neon.tech';
  const bucket = 'avatars';

  it('extracts the object key from a public URL', () => {
    expect(
      objectKeyFromPublicUrl(
        `${endpoint}/${bucket}/riders/abc.jpg`,
        endpoint,
        bucket,
      ),
    ).toBe('riders/abc.jpg');
  });

  it('rejects a URL outside the bucket', () => {
    expect(() =>
      objectKeyFromPublicUrl(
        `${endpoint}/other/riders/abc.jpg`,
        endpoint,
        bucket,
      ),
    ).toThrow(BadRequestException);
  });

  it('rejects path traversal in the key', () => {
    expect(() =>
      objectKeyFromPublicUrl(
        `${endpoint}/${bucket}/../secret`,
        endpoint,
        bucket,
      ),
    ).toThrow(BadRequestException);
  });
});
