import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Admin } from '../admin.entity';

import { Expose } from 'class-transformer';

@Entity()
export class AdminProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Admin, (admin) => admin.profile, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'adminId' })
  admin: Admin;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
  })
  @Expose()
  firstName: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
  })
  @Expose()
  lastName: string;

  @Column({ type: 'smallint', nullable: true })
  age?: number;

  @Column({
    type: 'varchar',
    length: 30,
    nullable: false,
    default: 'unknown',
  })
  country: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phoneNumber: string;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  profilePictureUrl: string;

  @Column({
    type: 'date',
    default: () => 'CURRENT_TIMESTAMP',
  })
  joiningDate: string;
}
