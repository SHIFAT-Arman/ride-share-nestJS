import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  UpdateDateColumn,
} from 'typeorm';

@Entity('driver_locations')
export class DriverLocation {
  @PrimaryGeneratedColumn()
  id: number;

  /** Driver user UUID (same as driver.id). */
  @Column({ type: 'uuid', unique: true })
  driverId: string;

  @Index({ spatial: true })
  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  location: {
    type: 'Point';
    coordinates: [number, number];
  };

  @Column({ default: true })
  isOnline: boolean;

  @UpdateDateColumn({
    type: 'timestamp',
  })
  updatedAt: Date;
}
