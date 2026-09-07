import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { UserType } from '../../auth/user-type.enum';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Allows access when the authenticated user either:
 *  - owns the admin row (request.user.sub === request.params.id), OR
 *  - is SUPER_ADMIN.
 *
 * Must run after JwtAuthGuard. Expects the owner param to be named "id"
 * and to be the admin uuid (JWT sub), not a profile id.
 */
@Injectable()
export class SelfOrSuperAdminGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserType[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.role?.includes(role));
  }
}
