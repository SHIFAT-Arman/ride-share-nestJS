import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RiderModule } from './entities/rider/rider.module';
import { DriverModule } from './entities/driver/driver.module';
import { LocationModule } from './entities/location/location.module';
import { RideModule } from './entities/ride/ride.module';
import { VehicleModule } from './entities/vehicle/vehicle.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdminModule } from './entities/admin/admin.module';
import { TestimonialModule } from './entities/testimonial/testimonial.module';
import { AuthModule } from './auth/auth.module';
import { postgresTypeOrmOptions } from './typeorm.options';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => postgresTypeOrmOptions(config),
    }),
    RiderModule,
    DriverModule,
    LocationModule,
    RideModule,
    VehicleModule,
    AdminModule,
    TestimonialModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
