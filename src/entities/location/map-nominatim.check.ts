import assert from 'node:assert/strict';
import { mapNominatimResults } from './map-nominatim';

const out = mapNominatimResults([
  {
    lat: '23.8103',
    lon: '90.4125',
    display_name: 'Dhaka, Bangladesh',
  },
]);

assert.equal(out.length, 1);
assert.equal(out[0].address, 'Dhaka, Bangladesh');
assert.equal(out[0].latitude, 23.8103);
assert.equal(out[0].longitude, 90.4125);
assert.deepEqual(mapNominatimResults([]), []);
assert.deepEqual(
  mapNominatimResults([
    { lat: 'nope', lon: '90', display_name: 'bad' },
    { lat: '1', lon: '2', display_name: '  ' },
    { lat: '1', lon: '2', display_name: 'ok' },
  ]),
  [{ address: 'ok', latitude: 1, longitude: 2 }],
);

console.log('map-nominatim.check: ok');
