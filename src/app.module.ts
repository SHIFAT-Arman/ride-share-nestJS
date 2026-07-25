import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RiderModule } from './entities/rider/rider.module';
import { DriverModule } from './entities/driver/driver.module';
import { LocationModule } from './entities/location/location.module';
import { RideModule } from './entities/ride/ride.module';
import { VehicleModule } from './entities/vehicle/vehicle.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AdminModule } from './entities/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      // later validate with Joi
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT ?? '6677'),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      autoLoadEntities: true,
      synchronize: true,
      // logging: true,
    }),
    RiderModule,
    DriverModule,
    LocationModule,
    RideModule,
    VehicleModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
