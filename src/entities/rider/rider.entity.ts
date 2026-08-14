import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RiderStatus } from './enums/rider-status.enum';
import { Expose } from 'class-transformer';

@Entity()
export class Rider {
  @PrimaryGeneratedColumn('uuid')
  @Expose()
  id: string;

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

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  @Expose()
  email: string;

  @Column({
    // hashing will be done in service class
    type: 'varchar',
    nullable: false,
  })
  password: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: false,
  })
  @Expose()
  phone: string;

  @Column({
    type: 'enum',
    enum: RiderStatus,
    default: RiderStatus.PENDING_VERIFICATION,
    nullable: false,
  })
  @Expose()
  status: RiderStatus;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  @Expose()
  profilePictureUrl: string;

  @CreateDateColumn({
    type: 'timestamp',
  })
  @Expose()
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
  })
  @Expose()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
