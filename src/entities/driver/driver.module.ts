import { Module } from '@nestjs/common';
import { DriverController } from './driver.controller';
import { DriverService } from './driver.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriverEntity } from './driver.entity';
import { RatingService } from '../rating/rating.service';
import { Rating } from '../rating/rating.entity';
import { VehicleService } from '../vehicle/vehicle.service';
import { Vehicle } from '../vehicle/vehicle.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([DriverEntity, Rating, Vehicle]),
  ],
  controllers: [DriverController],
  providers: [DriverService, RatingService, VehicleService, RatingService],
  exports: [DriverService],
})
export class DriverModule {}
