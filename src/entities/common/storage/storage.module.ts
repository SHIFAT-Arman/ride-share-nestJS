import { Module } from '@nestjs/common';
import { StorageService } from './neon-storage.service';

export const STORAGE_SERVICE = 'STORAGE_SERVICE';

@Module({
  providers: [
    {
      provide: STORAGE_SERVICE,
      useClass: StorageService,
    },
  ],
  exports: [STORAGE_SERVICE],
})
export class StorageModule {}
