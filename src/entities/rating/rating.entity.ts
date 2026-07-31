import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DriverEntity } from '../driver/driver.entity';

@Entity()
export class Rating {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'smallint', nullable: false })
  score: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => DriverEntity, (driver) => driver.ratings, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  driver: DriverEntity;
}
