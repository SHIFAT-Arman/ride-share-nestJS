import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AdminProfile } from './adminProfile/admin-profile.entity';
import { Expose } from 'class-transformer';
import { Announcement } from './announcement/announcement.entity';
import { User } from '../user/user.entity';
import { UserType } from 'src/auth/user-type.enum';

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

  @Expose()
  get role(): UserType {
    return this.user?.role;
  }

  @CreateDateColumn({
    type: 'timestamp',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
  })
  updatedAt: Date;

  @OneToOne(() => AdminProfile, (profile) => profile.admin, { cascade: true })
  @Expose()
  profile: AdminProfile;

  @OneToMany(() => Announcement, (announcement) => announcement.admin, {
    cascade: true,
  })
  announcements: Announcement[];

  toJSON() {
    const { user, ...rest } = this;
    return { ...rest, email: user?.email, role: user?.role };
  }
}
