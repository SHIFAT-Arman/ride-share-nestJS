import { VehicleType } from '../vehicle/enums/vehicle-type.enum';

/** Simple demo fare — not real pricing. */
export function estimateFare(
  distanceKm: number,
  vehicleType: VehicleType,
): number {
  const base = vehicleType === VehicleType.BIKE ? 30 : 50;
  const perKm = vehicleType === VehicleType.BIKE ? 12 : 20;
  return Math.round((base + perKm * distanceKm) * 100) / 100;
}

export type OsrmRouteResult = {
  distanceKm: number;
  durationMin: number;
  /** GeoJSON positions as [lng, lat][] */
  geometry: [number, number][];
};

type OsrmJson = {
  code?: string;
  routes?: Array<{
    distance: number;
    duration: number;
    geometry?: { coordinates?: [number, number][] };
  }>;
};

/**
 * Driving route via public OSRM.
 * ponytail: public demo server — fine for class; self-host OSRM for prod.
 */
export async function fetchOsrmRoute(
  pickupLng: number,
  pickupLat: number,
  destLng: number,
  destLat: number,
): Promise<OsrmRouteResult> {
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${pickupLng},${pickupLat};${destLng},${destLat}` +
    `?overview=full&geometries=geojson`;

  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`OSRM HTTP ${res.status}`);
  }

  const data = (await res.json()) as OsrmJson;
  const route = data.routes?.[0];
  if (data.code !== 'Ok' || !route?.geometry?.coordinates?.length) {
    throw new Error('OSRM returned no route');
  }

  return {
    distanceKm: route.distance / 1000,
    durationMin: route.duration / 60,
    geometry: route.geometry.coordinates,
  };
}
