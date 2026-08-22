import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RiderController } from './rider.controller';
import { RiderService } from './rider.service';
import { Rider } from './rider.entity';
import { CommonModule } from '../common/common.module';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { SelfOrAdminGuard } from '../../auth/guards/self-or-admin.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Rider]), CommonModule],
  controllers: [RiderController],
  providers: [RiderService, JwtAuthGuard, RolesGuard, SelfOrAdminGuard],
  exports: [RiderService],
})
export class RiderModule {}
