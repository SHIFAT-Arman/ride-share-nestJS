import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AdminProfile } from '../adminProfile/admin-profile.entity';

@Entity()
export class Announcement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  title: string;

  @Column({
    type: 'text',
    nullable: false,
  })
  content: string;

  @CreateDateColumn({
    type: 'timestamp',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
  })
  updatedAt: Date;

  @ManyToOne(() => AdminProfile, (adminProfile) => adminProfile.announcements)
  adminProfile: AdminProfile;
}
