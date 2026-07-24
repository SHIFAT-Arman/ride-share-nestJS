import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { CommonModule } from '../common/common.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admin } from './admin.entity';
import { AdminProfile } from './adminProfile/admin-profile.entity';
import { Announcement } from './announcement/announcement.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Admin, AdminProfile, Announcement]),
    CommonModule,
  ],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}
