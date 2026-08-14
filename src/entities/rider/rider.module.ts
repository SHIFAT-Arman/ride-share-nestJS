import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RiderController } from './rider.controller';
import { RiderService } from './rider.service';
import { Rider } from './rider.entity';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [TypeOrmModule.forFeature([Rider]), CommonModule],
  controllers: [RiderController],
  providers: [RiderService],
  exports: [RiderService],
})
export class RiderModule {}
