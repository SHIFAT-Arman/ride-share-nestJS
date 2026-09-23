import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { Public } from 'src/auth/decorators/public.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserType } from 'src/auth/user-type.enum';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';
import { UpdateTestimonialDto } from './dto/update-testimonial.dto';
import { TestimonialService } from './testimonial.service';
import { Testimonial } from './testimonial.entity';

@Controller('/v1/api/testimonials')
export class TestimonialController {
  constructor(private readonly testimonialService: TestimonialService) {}

  @Public()
  @Get()
  list(): Promise<Testimonial[]> {
    return this.testimonialService.list();
  }

  @Roles(UserType.ADMIN)
  @Post()
  create(@Body() dto: CreateTestimonialDto): Promise<Testimonial> {
    return this.testimonialService.create(dto);
  }

  @Roles(UserType.ADMIN)
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTestimonialDto,
  ): Promise<Testimonial> {
    return this.testimonialService.update(id, dto);
  }

  @Roles(UserType.ADMIN)
  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.testimonialService.remove(id);
  }
}
