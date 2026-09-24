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
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { Faq } from './faq.entity';
import { FaqService } from './faq.service';

@Controller('/v1/api/faqs')
export class FaqController {
  constructor(private readonly faqService: FaqService) {}

  @Public()
  @Get()
  list(): Promise<Faq[]> {
    return this.faqService.list();
  }

  @Roles(UserType.ADMIN)
  @Post()
  create(@Body() dto: CreateFaqDto): Promise<Faq> {
    return this.faqService.create(dto);
  }

  @Roles(UserType.ADMIN)
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFaqDto,
  ): Promise<Faq> {
    return this.faqService.update(id, dto);
  }

  @Roles(UserType.ADMIN)
  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.faqService.remove(id);
  }
}
