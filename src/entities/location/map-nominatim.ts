/** Raw Nominatim search hit (subset we care about). */
export type NominatimHit = {
  lat: string;
  lon: string;
  display_name: string;
};

export type PlaceResult = {
  address: string;
  latitude: number;
  longitude: number;
};

export function mapNominatimResults(hits: NominatimHit[]): PlaceResult[] {
  return hits.flatMap((h) => {
    const latitude = Number(h.lat);
    const longitude = Number(h.lon);
    const address = h.display_name?.trim();
    if (!address || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return [];
    }
    return [{ address, latitude, longitude }];
  });
}
