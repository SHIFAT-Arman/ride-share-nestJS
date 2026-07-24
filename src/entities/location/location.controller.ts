import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { LocationService } from './location.service';
import { SearchLocationParams } from './params/search-location.params';
import { UpdateDriverLocationDto } from './dto/driver-location.dto';

@Controller('v1/api/location')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Get('/search')
  public searchLocation(
    @Query() searchLocationParams: SearchLocationParams,
  ): object {
    return this.locationService.searchLocation(searchLocationParams);
  }

  @Patch('driver/:driverId')
  updateDriverLocation(
    @Param('driverId', ParseIntPipe) driverId: number,
    @Body() dto: UpdateDriverLocationDto,
  ) {
    return this.locationService.updateDriverLocation(driverId, dto);
  }
}
