import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Expose } from 'class-transformer';
import { RiderStatus } from './enums/rider-status.enum';
import { User } from '../user/user.entity';

@Entity()
export class Rider {
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
    length: 20,
    nullable: false,
  })
  @Expose()
  phone: string;

  @Column({ type: 'smallint', nullable: true })
  @Expose()
  age?: number;

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

  toJSON() {
    const { user, ...rest } = this;
    return { ...rest, email: user?.email };
  }
}
