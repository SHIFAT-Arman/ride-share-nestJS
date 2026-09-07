export enum UserType {
  RIDER = 'rider',
  DRIVER = 'driver',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
  SUPPORT_AGENT = 'support_agent',
}

export enum AdminRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  SUPPORT_AGENT = 'support_agent',
}

export const ADMIN_ROLES = Object.values(AdminRole);
