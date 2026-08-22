export enum AdminRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  SUPPORT_AGENT = 'SUPPORT_AGENT',
}

/** All admin role values as an array — use with @Roles(...ADMIN_ROLES). */
export const ADMIN_ROLES = Object.values(AdminRole);
