import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { Vehicle } from '../vehicle/vehicle.entity';
import { Rating } from '../rating/rating.entity';
import { Expose } from 'class-transformer';

export enum DriverStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('driver')
export class DriverEntity {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id!: number;

  @Column({ type: 'varchar', length: 100 })
  @Expose()
  fullName!: string;

  @Column({ type: 'int', unsigned: true })
  @Expose()
  age!: number;

  @Column({
    type: 'enum',
    enum: DriverStatus,
    default: DriverStatus.ACTIVE,
  })
  @Expose()
  status!: DriverStatus;

  @Column()
  @Expose()
  email!: string;

  @Column()
  password!: string;

  @OneToOne(() => Vehicle, (vehicle) => vehicle.driver, { cascade: true })
  @Expose()
  vehicle: Vehicle;

  @OneToMany(() => Rating, (rating) => rating.driver, { cascade: true })
  @Expose()
  ratings: Rating[];
}
