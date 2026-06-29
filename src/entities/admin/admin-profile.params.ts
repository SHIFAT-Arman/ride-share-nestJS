import { IsEnum } from 'class-validator';
import { AdminRole } from './admin-role.model';

export class AdminParams {
  @IsEnum(AdminRole)
  role: AdminRole;
}
