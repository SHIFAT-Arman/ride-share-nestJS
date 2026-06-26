import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RiderModule } from './modules/rider/rider.module';
import { DriverModule } from './modules/driver/driver.module';

@Module({
  imports: [RiderModule, DriverModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
