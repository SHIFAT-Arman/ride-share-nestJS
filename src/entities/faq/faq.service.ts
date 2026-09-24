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
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { Faq } from './faq.entity';

/** Current homepage copy. Inserted only when the table is empty. */
const SEED: Omit<Faq, 'id' | 'createdAt'>[] = [
  {
    question: 'How do I book a ride?',
    answer:
      'Open the portal, enter pickup and destination, pick a time, and confirm. Driver details appear before departure.',
  },
  {
    question: 'How are fares calculated?',
    answer:
      'Fares use distance, route demand, and vehicle type. You see the full price before you confirm — no hidden fees.',
  },
  {
    question: 'Is payment secure?',
    answer:
      'Yes. All payments are encrypted. We accept major cards and digital wallets through our secure checkout.',
  },
  {
    question: 'Can I cancel my ride?',
    answer:
      'Cancel free up to 2 hours before pickup. Later cancellations may incur a small fee shown at checkout.',
  },
  {
    question: 'What areas do you serve?',
    answer:
      'We cover intercity and long-distance routes across major regions. Check the portal for live availability on your route.',
  },
  {
    question: 'How do I become a driver?',
    answer:
      'Register in the portal, submit your vehicle details and documents, and pass our verification. Approval usually takes 2–3 business days.',
  },
];

@Injectable()
export class FaqService implements OnModuleInit {
  private readonly logger = new Logger(FaqService.name);

  constructor(
    @InjectRepository(Faq)
    private readonly faqs: Repository<Faq>,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      if ((await this.faqs.count()) > 0) return;
    } catch (err) {
      // ponytail: prod keeps DB_SYNCHRONIZE=false and has no migrations.
      // A missing table must not stop the API. Create `faq` in Neon, then restart.
      if (!isMissingRelation(err)) throw err;
      this.logger.warn('faq table is missing; skipping seed');
      return;
    }
    // ponytail: empty-table seed is count-then-write with no lock.
    // Two servers booting together can insert the six questions twice.
    // Upgrade: transaction + advisory lock.
    await this.faqs.insert(
      SEED.map((row, i) => ({
        ...row,
        createdAt: new Date(Date.UTC(2024, 0, 1, 0, 0, i)),
      })),
    );
  }

  list(): Promise<Faq[]> {
    return this.faqs.find({ order: { createdAt: 'ASC' } });
  }

  create(dto: CreateFaqDto): Promise<Faq> {
    return this.faqs.save(this.faqs.create(dto));
  }

  async update(id: string, dto: UpdateFaqDto): Promise<Faq> {
    const row = await this.findOne(id);
    if (!dto.question && !dto.answer) {
      throw new BadRequestException('Nothing to update.');
    }
    Object.assign(row, dto);
    return this.faqs.save(row);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.faqs.delete(id);
  }

  private async findOne(id: string): Promise<Faq> {
    const row = await this.faqs.findOneBy({ id });
    if (!row) throw new NotFoundException('FAQ not found.');
    return row;
  }
}
