import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admin } from '../admin/admin.entity';
import { Driver } from '../driver/driver.entity';
import { DriverLocation } from '../location/model/driver-location.entity';
import { Rating } from '../rating/rating.entity';
import { Rider } from '../rider/rider.entity';
import { Ride } from '../ride/ride.entity';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Ride,
      Admin,
      Rider,
      Driver,
      DriverLocation,
      Rating,
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
