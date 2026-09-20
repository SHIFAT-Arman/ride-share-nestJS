import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { VehicleType } from '../vehicle/enums/vehicle-type.enum';
import { RideStatus } from './enums/ride-status.enum';

@Entity()
export class Ride {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** JWT `sub` of the rider who booked. */
  @Column({ type: 'uuid' })
  riderUserId: string;

  /** Assigned driver user id (same as driver.id). */
  @Column({ type: 'uuid', nullable: true })
  driverUserId: string | null;

  @Column({ type: 'double precision' })
  pickupLatitude: number;

  @Column({ type: 'double precision' })
  pickupLongitude: number;

  @Column({ type: 'varchar' })
  pickupAddress: string;

  @Column({ type: 'double precision' })
  destinationLatitude: number;

  @Column({ type: 'double precision' })
  destinationLongitude: number;

  @Column({ type: 'varchar' })
  destinationAddress: string;

  @Column({ type: 'enum', enum: VehicleType })
  vehicleType: VehicleType;

  @Column({
    type: 'enum',
    enum: RideStatus,
    default: RideStatus.REQUESTED,
  })
  status: RideStatus;

  @Column({ type: 'double precision', nullable: true })
  estimatedFare: number | null;

  @Column({ type: 'double precision', nullable: true })
  estimatedDistanceInKm: number | null;

  @Column({ type: 'double precision', nullable: true })
  estimatedDurationInMinutes: number | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
