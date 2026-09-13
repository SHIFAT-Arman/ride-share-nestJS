import { Module } from '@nestjs/common';
import { StorageModule } from './storage/storage.module';
import { ProfilePictureService } from './profile-picture/profile-picture.service';
import { PusherService } from './pusher.service';

@Module({
  imports: [StorageModule],
  providers: [ProfilePictureService, PusherService],
  exports: [ProfilePictureService, PusherService],
})
export class CommonModule {}
