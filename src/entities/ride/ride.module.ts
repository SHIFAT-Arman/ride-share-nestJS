import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RideService } from './ride.service';
import { RideController } from './ride.controller';
import { Ride } from './ride.entity';
import { LocationModule } from '../location/location.module';
import { CommonModule } from '../common/common.module';
import { Rating } from '../rating/rating.entity';
import { RatingService } from '../rating/rating.service';
import { Driver } from '../driver/driver.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ride, Rating, Driver]),
    LocationModule,
    CommonModule,
  ],
  controllers: [RideController],
  providers: [RideService, RatingService],
  exports: [RideService],
})
export class RideModule {}
