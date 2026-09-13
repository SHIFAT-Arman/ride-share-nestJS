import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { UserType } from '../../auth/user-type.enum';

/**
 * Allows access when the authenticated user either:
 *  - owns the resource  (request.user.sub === request.params.id), OR
 *  - is an admin.
 *
 * Must run after JwtAuthGuard so request.user is already populated.
 * Expects the route param identifying the owner to be named "id".
 */
interface GuardRequest {
  user?: { sub: string; role: string };
  params?: { id?: string };
}

@Injectable()
export class SelfOrAdminGuard implements CanActivate {
  private readonly adminRoles = new Set<string>([UserType.ADMIN]);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<GuardRequest>();
    const user = request.user;

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
