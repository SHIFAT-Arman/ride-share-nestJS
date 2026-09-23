import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Testimonial {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 80 })
  name: string;

  @Column({ type: 'varchar', length: 120 })
  designation: string;

  @Column({ type: 'text' })
  testimonial: string;

  @Column({ type: 'varchar', length: 2048 })
  avatar: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
