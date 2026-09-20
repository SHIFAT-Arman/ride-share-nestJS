import { Module } from '@nestjs/common';
import { LocationController } from './location.controller';
import { LocationService } from './location.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriverLocationRepository } from './repositories/driver-location.repository';
import { DriverLocation } from './model/driver-location.entity';
import { Ride } from '../ride/ride.entity';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DriverLocation, Ride]),
    CommonModule,
  ],
  controllers: [LocationController],
  providers: [LocationService, DriverLocationRepository],
  exports: [DriverLocationRepository, LocationService],
})
export class LocationModule {}
