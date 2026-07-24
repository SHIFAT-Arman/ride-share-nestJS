import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AdminRole } from './admin-role.model';
// import { randomUUID } from 'crypto';
import { AdminProfile } from './adminProfile/admin-profile.entity';

@Entity()
export class Admin {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // @Column({
  //   type: 'varchar',
  //   length: 150,
  //   nullable: false,
  //   unique: true,
  //   name: 'uniqeId',
  //   // generated: 'uuid', compile error
  // })
  // // @Generated('uuid')
  // uniqeId: string;

  // @BeforeInsert()
  // generateUniqueId() {
  //   this.uniqeId = randomUUID();
  // }

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
    // unique: true,
  })
  email: string;

  @Column({
    // hashing will be done in service class
    type: 'varchar',
    nullable: false,
  })
  password: string;

  @Column({
    type: 'varchar',
    enum: AdminRole,
    default: AdminRole.ADMIN,
  })
  role: AdminRole;

  @CreateDateColumn({
    type: 'timestamp',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
  })
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  // @OneToOne(() => AdminProfile, (profile) => profile.admin, { cascade: true })
  @OneToOne(() => AdminProfile, { cascade: true, nullable: false })
  @JoinColumn({ name: 'profileId' })
  profile: AdminProfile;
}
