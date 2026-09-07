import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Observable } from 'rxjs';
import { UserType } from '../user-type.enum';
import { UserService } from 'src/entities/user/user.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { Request } from 'express';

/**
 * Checks that request.user.role is included in the @Roles() list on the
 * handler. Must run after JwtAuthGuard so request.user is already populated.
 *
 * If no @Roles() metadata is present the guard allows access, so it is safe
 * to combine globally with JwtAuthGuard on authenticated-but-public routes.
 */

interface AuthRequest extends Request {
  user: JwtPayload;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly userService: UserService,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const roles = this.reflector.get<UserType[]>(
      ROLES_KEY,
      context.getHandler(),
    );

    if (!roles) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthRequest>();
    const user = request.user;

    return roles.includes(user.role);
  }
}
