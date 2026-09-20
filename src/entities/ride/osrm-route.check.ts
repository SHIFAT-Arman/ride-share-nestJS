import assert from 'node:assert/strict';
import { VehicleType } from '../vehicle/enums/vehicle-type.enum';
import { estimateFare } from './osrm-route';

assert.equal(estimateFare(0, VehicleType.CAR), 50);
assert.equal(estimateFare(10, VehicleType.CAR), 250);
assert.equal(estimateFare(10, VehicleType.BIKE), 150);

console.log('osrm-route.check: ok');
