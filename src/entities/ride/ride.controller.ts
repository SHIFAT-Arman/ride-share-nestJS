import { Body, Controller, Post } from '@nestjs/common';
import { RideService } from './ride.service';
import { RideEstimateDto } from './dto/ride-estimate.dto';
import { RideEstimateResponseDto } from './dto/ride-estimate-response.dto';

@Controller('/v1/api/ride')
export class RideController {
  constructor(private readonly rideService: RideService) {}

  // @Post('/estimate')
  // public estimateRide(
  //   @Body() rideEstimateDto: RideEstimateDto,
  // ): RideEstimateResponseDto {
  //   return this.rideService.estimateRide(rideEstimateDto);
  // }
}
