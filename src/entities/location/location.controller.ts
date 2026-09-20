import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { LocationService } from './location.service';
import { SearchLocationParams } from './params/search-location.params';
import { UpdateDriverLocationDto } from './dto/driver-location.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserType } from 'src/auth/user-type.enum';

interface RequestWithUser extends Request {
  user: { sub: string; email: string; role: string };
}

@Controller('v1/api/location')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Get('/search')
  public searchLocation(@Query() searchLocationParams: SearchLocationParams) {
    return this.locationService.searchLocation(searchLocationParams);
  }

  /** Driver updates own GPS (JWT sub = driver id). */
  @Patch('driver/me')
  @Roles(UserType.DRIVER)
  updateMyLocation(
    @Req() req: RequestWithUser,
    @Body() dto: UpdateDriverLocationDto,
  ) {
    return this.locationService.updateDriverLocation(req.user.sub, dto);
  }

  /** Kept for admin/tools; UUID driver id. */
  @Patch('driver/:driverId')
  @Roles(UserType.DRIVER, UserType.ADMIN)
  updateDriverLocation(
    @Param('driverId') driverId: string,
    @Body() dto: UpdateDriverLocationDto,
  ) {
    return this.locationService.updateDriverLocation(driverId, dto);
  }
}
