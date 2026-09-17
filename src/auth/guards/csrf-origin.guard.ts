import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  frontendOriginAllowlist,
  requestOriginFromHeaders,
} from '../../frontend-origins';

/** Reject state-changing cookie auth if Origin/Referer is not in FRONTEND_URL allowlist. */
@Injectable()
export class CsrfOriginGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const allowlist = frontendOriginAllowlist();
    const origin = requestOriginFromHeaders(req.headers);
    if (!origin || !allowlist.has(origin)) {
      throw new ForbiddenException('Invalid origin');
    }
    return true;
  }
}
