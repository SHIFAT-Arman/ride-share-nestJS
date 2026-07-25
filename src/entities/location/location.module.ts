import { Module } from '@nestjs/common';
import { LocationController } from './location.controller';
import { LocationService } from './location.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriverLocationRepository } from './repositories/driver-location.repository';
import { DriverLocation } from './model/driver-location.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DriverLocation])],
  controllers: [LocationController],
  providers: [LocationService, DriverLocationRepository],
})
export class LocationModule {}
