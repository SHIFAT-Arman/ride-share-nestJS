import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriverController } from './driver.controller';
import { DriverService } from './driver.service';
import { Driver } from './driver.entity';
import { CommonModule } from '../common/common.module';
import { UserModule } from '../user/user.module';
import { RatingService } from '../rating/rating.service';
import { Rating } from '../rating/rating.entity';
import { VehicleService } from '../vehicle/vehicle.service';
import { Vehicle } from '../vehicle/vehicle.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { SelfOrAdminGuard } from '../../auth/guards/self-or-admin.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Driver, Rating, Vehicle]),
    CommonModule,
    UserModule,
  ],
  controllers: [DriverController],
  providers: [
    DriverService,
    RatingService,
    VehicleService,
    JwtAuthGuard,
    RolesGuard,
    SelfOrAdminGuard,
  ],
  exports: [DriverService],
})
export class DriverModule {}
