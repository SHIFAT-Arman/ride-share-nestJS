import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AdminRole } from '../../entities/admin/admin-role.model';

/**
 * Allows access when the authenticated user either:
 *  - owns the resource  (request.user.sub === request.params.id), OR
 *  - holds any admin role.
 *
 * Must run after JwtAuthGuard so request.user is already populated.
 * Expects the route param identifying the owner to be named "id".
 */
@Injectable()
export class SelfOrAdminGuard implements CanActivate {
  private readonly adminRoles = new Set<string>(Object.values(AdminRole));

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: { sub: string; role: string } | undefined = request.user;

    if (!user) {
      throw new ForbiddenException('Access denied.');
    }

    const isAdmin = this.adminRoles.has(user.role);
    const isSelf = user.sub === request.params?.id;

    if (!isAdmin && !isSelf) {
      throw new ForbiddenException('You can only access your own resources.');
    }

    return true;
  }
}
