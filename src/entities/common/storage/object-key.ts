import { BadRequestException } from '@nestjs/common';

/** Map a public Neon object URL back to the object key; reject foreign URLs. */
export function objectKeyFromPublicUrl(
  fileUrl: string,
  endpoint: string,
  bucket: string,
): string {
  const prefix = `${endpoint.replace(/\/$/, '')}/${bucket}/`;
  if (!fileUrl.startsWith(prefix)) {
    throw new BadRequestException('Invalid file path');
  }
  const key = fileUrl.slice(prefix.length);
  if (!key || key.includes('..') || key.startsWith('/')) {
    throw new BadRequestException('Invalid file path');
  }
  return key;
}
