import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Admin } from '../admin.entity';
import { UserType } from 'src/auth/user-type.enum';

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

  // Comma-separated list in DB, e.g. "rider,driver,admin"
  @Column({ type: 'simple-array', nullable: true })
  targetRoles: UserType[];

  @CreateDateColumn({
    type: 'timestamp',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
  })
  updatedAt: Date;

  @ManyToOne(() => Admin, (admin) => admin.announcements, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'adminId' })
  admin: Admin;
}
