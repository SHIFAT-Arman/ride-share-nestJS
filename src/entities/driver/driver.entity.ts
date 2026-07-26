import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

export enum DriverStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('driver')
export class DriverEntity {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id!: number;

  @Column({ type: 'varchar', length: 100 })
  fullName!: string;

  @Column({ type: 'int', unsigned: true })
  age!: number;

  @Column({
    type: 'enum',
    enum: DriverStatus,
    default: DriverStatus.ACTIVE,
  })
  status!: DriverStatus;

  @Column()
  email!: string;

  @Column()
  password!: string;
}
