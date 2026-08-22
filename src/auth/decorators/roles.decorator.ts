import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Attach required role(s) to a route handler.
 * Must be paired with RolesGuard (after JwtAuthGuard populates request.user).
 *
 * @example
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Roles(AdminRole.ADMIN, AdminRole.SUPER_ADMIN)
 * @Get()
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
