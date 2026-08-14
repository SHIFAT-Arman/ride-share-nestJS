import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { CommonModule } from '../common/common.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admin } from './admin.entity';
import { AdminProfile } from './adminProfile/admin-profile.entity';
import { Announcement } from './announcement/announcement.entity';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { EmailService } from './email/email.service';

// console.log(process.env.JWT_SECRET);
@Module({
  imports: [
    TypeOrmModule.forFeature([Admin, AdminProfile, Announcement]),
    CommonModule,
  ],
  providers: [AdminService, JwtAuthGuard, EmailService],
  controllers: [AdminController],
  exports: [AdminService],
})
export class AdminModule {}
