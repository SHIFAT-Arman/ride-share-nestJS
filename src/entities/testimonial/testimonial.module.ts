import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestimonialController } from './testimonial.controller';
import { Testimonial } from './testimonial.entity';
import { TestimonialService } from './testimonial.service';

@Module({
  imports: [TypeOrmModule.forFeature([Testimonial])],
  controllers: [TestimonialController],
  providers: [TestimonialService],
})
export class TestimonialModule {}
