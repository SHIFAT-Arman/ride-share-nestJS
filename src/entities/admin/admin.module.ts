import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { CommonModule } from '../common/common.module';
import { UserModule } from '../user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admin } from './admin.entity';
import { AdminProfile } from './adminProfile/admin-profile.entity';
import { Announcement } from './announcement/announcement.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { SelfOrSuperAdminGuard } from '../../auth/guards/self-or-super-admin.guard';
import { EmailService } from './email/email.service';

// console.log(process.env.JWT_SECRET);
@Module({
  imports: [
    TypeOrmModule.forFeature([Admin, AdminProfile, Announcement]),
    CommonModule,
    UserModule,
  ],
  providers: [
    AdminService,
    JwtAuthGuard,
    RolesGuard,
    SelfOrSuperAdminGuard,
    EmailService,
  ],
  controllers: [AdminController],
  exports: [AdminService],
})
export class AdminModule {}
