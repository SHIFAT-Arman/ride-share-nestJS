import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { isMissingRelation } from '../common/missing-relation';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';
import { UpdateTestimonialDto } from './dto/update-testimonial.dto';
import { testimonialCountError } from './testimonial-count';
import { Testimonial } from './testimonial.entity';

/** Current homepage copy. Inserted only when the table is empty. */
const SEED: Omit<Testimonial, 'id' | 'createdAt'>[] = [
  {
    name: 'John Doe',
    designation: 'Software Engineer',
    testimonial:
      'This product has completely transformed the way we work. The efficiency and ease of use are unmatched!',
    avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
  },
  {
    name: 'Sophia Lee',
    designation: 'Data Analyst',
    testimonial:
      'This tool has saved me hours of work! The analytics and reporting features are incredibly powerful.',
    avatar: 'https://randomuser.me/api/portraits/women/6.jpg',
  },
  {
    name: 'Michael Johnson',
    designation: 'UX Designer',
    testimonial:
      'An amazing tool that simplifies complex tasks. Highly recommended for professionals in the industry. The intuitive interface makes it easy to onboard new team members, and the automation features save us countless hours every week. ',
    avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
  },
  {
    name: 'Emily Davis',
    designation: 'Marketing Specialist',
    testimonial:
      "I've seen a significant improvement in our team's productivity since we started using this service.",
    avatar: 'https://randomuser.me/api/portraits/women/4.jpg',
  },
  {
    name: 'Daniel Martinez',
    designation: 'Full-Stack Developer',
    testimonial:
      "The best investment we've made! The support team is also super responsive and helpful.",
    avatar: 'https://randomuser.me/api/portraits/men/5.jpg',
  },
  {
    name: 'Jane Smith',
    designation: 'Product Manager',
    testimonial:
      'The user experience is top-notch! The interface is clean, intuitive, and easy to navigate.',
    avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
  },
];

@Injectable()
export class TestimonialService implements OnModuleInit {
  private readonly logger = new Logger(TestimonialService.name);

  constructor(
    @InjectRepository(Testimonial)
    private readonly testimonials: Repository<Testimonial>,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      if ((await this.testimonials.count()) > 0) return;
    } catch (err) {
      // ponytail: prod keeps DB_SYNCHRONIZE=false and has no migrations.
      // A missing table must not stop the API. Create `testimonial` in Neon, then restart.
      if (!isMissingRelation(err)) throw err;
      this.logger.warn('testimonial table is missing; skipping seed');
      return;
    }
    // ponytail: empty-table seed and the 6–9 checks are count-then-write with no lock.
    // Two servers booting together can insert 12; two admins can slip past the cap.
    // Upgrade: transaction + advisory lock.
    await this.testimonials.insert(
      SEED.map((row, i) => ({
        ...row,
        createdAt: new Date(Date.UTC(2024, 0, 1, 0, 0, i)),
      })),
    );
  }

  list(): Promise<Testimonial[]> {
    return this.testimonials.find({ order: { createdAt: 'ASC' } });
  }

  async create(dto: CreateTestimonialDto): Promise<Testimonial> {
    await this.assertCount('create');
    return this.testimonials.save(this.testimonials.create(dto));
  }

  async update(id: string, dto: UpdateTestimonialDto): Promise<Testimonial> {
    const row = await this.findOne(id);
    if (!dto.name && !dto.designation && !dto.testimonial && !dto.avatar) {
      throw new BadRequestException('Nothing to update.');
    }
    Object.assign(row, dto);
    return this.testimonials.save(row);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.assertCount('delete');
    await this.testimonials.delete(id);
  }

  private async findOne(id: string): Promise<Testimonial> {
    const row = await this.testimonials.findOneBy({ id });
    if (!row) throw new NotFoundException('Testimonial not found.');
    return row;
  }

  private async assertCount(action: 'create' | 'delete'): Promise<void> {
    const message = testimonialCountError(
      await this.testimonials.count(),
      action,
    );
    if (message) throw new BadRequestException(message);
  }
}
