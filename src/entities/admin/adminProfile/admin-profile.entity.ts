import {
  Column,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Admin } from '../admin.entity';
import { Announcement } from '../announcement/announcement.entity';

@Entity()
export class AdminProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Admin, (admin) => admin.profile)
  // @JoinColumn({ name: 'adminId' })
  admin: Admin;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
  })
  firstName: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
  })
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

  @OneToMany(() => Announcement, (announcement) => announcement.adminProfile)
  announcements: Announcement[];
}
