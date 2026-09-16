import { BadRequestException } from '@nestjs/common';
import { resolveUploadPath } from './local-storage.service';

describe('resolveUploadPath', () => {
  it('allows paths under uploads/', () => {
    const p = resolveUploadPath('/uploads/admins/x.jpg');
    expect(p).toContain(`${require('path').sep}uploads${require('path').sep}`);
    expect(p.endsWith(`uploads${require('path').sep}admins${require('path').sep}x.jpg`)).toBe(
      true,
    );
  });

  it('rejects path traversal', () => {
    expect(() => resolveUploadPath('/uploads/../.env')).toThrow(
      BadRequestException,
    );
    expect(() => resolveUploadPath('../../.env')).toThrow(BadRequestException);
  });
});
