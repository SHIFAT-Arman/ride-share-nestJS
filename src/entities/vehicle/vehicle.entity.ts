import { Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Column } from 'typeorm';
import { VehicleType } from './enums/vehicle-type.enum';
import { DriverEntity } from '../driver/driver.entity';

@Entity()
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: VehicleType })
  vehicleType: VehicleType;

  @Column({ type: 'varchar', unique: true })
  licensePlate: string;

  @Column({ type: 'smallint' })
  seatingCapacity: number;

  @OneToOne(() => DriverEntity, (driver) => driver.vehicle, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn()
  driver: DriverEntity;
}
