/**
 * Assert-based check for SwitchRoleDto + available dual-role shape.
 * Run: npx ts-node -r reflect-metadata -r tsconfig-paths/register src/auth/dto/switch-role.dto.check.ts
 */
import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { SwitchRoleDto } from './switch-role.dto';
import { UserType } from '../user-type.enum';

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

const riderOk = plainToInstance(SwitchRoleDto, { role: UserType.RIDER });
assert(validateSync(riderOk).length === 0, 'rider role should pass');

const driverOk = plainToInstance(SwitchRoleDto, { role: UserType.DRIVER });
assert(validateSync(driverOk).length === 0, 'driver role should pass');

const adminReject = plainToInstance(SwitchRoleDto, { role: UserType.ADMIN });
assert(
  validateSync(adminReject).some((e) => e.property === 'role'),
  'admin role should fail',
);

console.log('switch-role.dto.check: ok');
