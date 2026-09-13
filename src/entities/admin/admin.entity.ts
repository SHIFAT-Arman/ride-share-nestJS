import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Expose } from 'class-transformer';
import { Announcement } from './announcement/announcement.entity';
import { User } from '../user/user.entity';

@Entity()
export class Admin {
  @PrimaryColumn('uuid')
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

  @Column({ type: 'smallint', nullable: true })
  @Expose()
  age?: number;

  @Column({ type: 'varchar', length: 30, nullable: false, default: 'unknown' })
  @Expose()
  country: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  @Expose()
  phoneNumber: string;

  @Column({ type: 'varchar', nullable: true })
  @Expose()
  profilePictureUrl: string;

  @Column({ type: 'date', default: () => 'CURRENT_TIMESTAMP' })
  @Expose()
  joiningDate: string;

  @CreateDateColumn({
    type: 'timestamp',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
  })
  updatedAt: Date;

  @OneToMany(() => Announcement, (announcement) => announcement.admin, {
    cascade: true,
  })
  announcements: Announcement[];

  toJSON() {
    const { user, ...rest } = this;
    return { ...rest, email: user?.email, role: user?.role };
  }
}
