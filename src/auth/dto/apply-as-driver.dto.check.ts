/**
 * Assert-based check for ApplyAsDriverDto validation.
 * Run: npx ts-node -r reflect-metadata -r tsconfig-paths/register src/auth/dto/apply-as-driver.dto.check.ts
 */
import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { ApplyAsDriverDto } from './apply-as-driver.dto';
import { VehicleType } from '../../entities/vehicle/enums/vehicle-type.enum';

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

const valid = plainToInstance(ApplyAsDriverDto, {
  firstName: 'Jane',
  lastName: 'Doe',
  phone: '01700000000',
  vehicleType: VehicleType.CAR,
  licensePlate: 'DHA-1',
  seatingCapacity: '4',
});
assert(validateSync(valid).length === 0, 'valid apply dto should pass');
assert(valid.seatingCapacity === 4, 'seatingCapacity should coerce to number');

const missingPlate = plainToInstance(ApplyAsDriverDto, {
  firstName: 'Jane',
  lastName: 'Doe',
  phone: '01700000000',
  vehicleType: VehicleType.BIKE,
  seatingCapacity: 1,
});
assert(
  validateSync(missingPlate).some((e) => e.property === 'licensePlate'),
  'missing licensePlate should fail',
);

console.log('apply-as-driver.dto.check: ok');
