import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Expose } from 'class-transformer';
import { DriverStatus } from './enums/driver-status.enum';
import { Vehicle } from '../vehicle/vehicle.entity';
import { Rating } from '../rating/rating.entity';
import { User } from '../user/user.entity';

@Entity('driver')
export class Driver {
  @PrimaryColumn('uuid')
  @Expose()
  id: string;

  @OneToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'id' })
  user: User;

  @Expose()
  get email(): string {
    return this.user?.email;
  }

  @Column({ type: 'varchar', length: 50, nullable: false })
  @Expose()
  firstName: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  @Expose()
  lastName: string;

  @Column({ type: 'varchar', length: 20, nullable: false })
  @Expose()
  phone: string;

  @Column({
    type: 'enum',
    enum: DriverStatus,
    default: DriverStatus.PENDING_VERIFICATION,
    nullable: false,
  })
  @Expose()
  status: DriverStatus;

  @Column({ type: 'varchar', nullable: true })
  @Expose()
  profilePictureUrl: string;

  @CreateDateColumn({ type: 'timestamp' })
  @Expose()
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  @Expose()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  @OneToOne(() => Vehicle, (vehicle) => vehicle.driver, { cascade: true })
  @Expose()
  vehicle: Vehicle;

  @OneToMany(() => Rating, (rating) => rating.driver, { cascade: true })
  @Expose()
  ratings: Rating[];

  toJSON() {
    const { user, ...rest } = this;
    return { ...rest, email: user?.email };
  }
}
