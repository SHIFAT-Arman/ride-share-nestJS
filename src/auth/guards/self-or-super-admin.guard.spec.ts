import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AdminRole } from '../../entities/admin/admin-role.model';
import { SelfOrSuperAdminGuard } from './self-or-super-admin.guard';

function httpContext(
  user: { sub: string; role: string } | undefined,
  id: string,
): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user, params: { id } }),
    }),
  } as ExecutionContext;
}

describe('SelfOrSuperAdminGuard', () => {
  const guard = new SelfOrSuperAdminGuard();

  it('allows SUPER_ADMIN on another admin id', () => {
    expect(
      guard.canActivate(
        httpContext({ sub: 'super-1', role: AdminRole.SUPER_ADMIN }, 'admin-2'),
      ),
    ).toBe(true);
  });

  it('allows ADMIN on their own id', () => {
    expect(
      guard.canActivate(
        httpContext({ sub: 'admin-1', role: AdminRole.ADMIN }, 'admin-1'),
      ),
    ).toBe(true);
  });

  it('rejects ADMIN on another admin id', () => {
    expect(() =>
      guard.canActivate(
        httpContext({ sub: 'admin-1', role: AdminRole.ADMIN }, 'admin-2'),
      ),
    ).toThrow(ForbiddenException);
  });
});
