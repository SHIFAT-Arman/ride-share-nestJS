import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RiderModule } from './entities/rider/rider.module';
import { DriverModule } from './entities/driver/driver.module';
import { LocationModule } from './entities/location/location.module';
import { RideModule } from './entities/ride/ride.module';
import { VehicleModule } from './entities/vehicle/vehicle.module';

@Module({
  imports: [RiderModule, DriverModule, LocationModule, RideModule, VehicleModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
