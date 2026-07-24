import { Column, Entity } from 'typeorm';
import type { GeoPoint } from '../common/interfaces/geo-point.interface';

@Entity()
export class Location {
  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  location: GeoPoint;
}
