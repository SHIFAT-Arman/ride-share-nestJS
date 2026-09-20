import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { RideService } from './ride.service';
import { RideEstimateDto } from './dto/ride-estimate.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserType } from 'src/auth/user-type.enum';
import { Ride } from './ride.entity';
import { RideEstimateResponseDto } from './dto/ride-estimate-response.dto';

interface RequestWithUser extends Request {
  user: {
    sub: string;
    email: string;
    role: string;
  };
}

@Controller('/v1/api/ride')
export class RideController {
  constructor(private readonly rideService: RideService) {}

  @Post('/estimate')
  @Roles(UserType.RIDER)
  public estimateRide(
    @Body() dto: RideEstimateDto,
  ): Promise<RideEstimateResponseDto> {
    return this.rideService.estimateRide(dto);
  }

  @Post()
  @Roles(UserType.RIDER)
  public createRide(
    @Body() dto: RideEstimateDto,
    @Req() req: RequestWithUser,
  ): Promise<Ride> {
    return this.rideService.createRide(dto, req.user.sub);
  }

  @Get('/active')
  @Roles(UserType.RIDER, UserType.DRIVER)
  public getActive(@Req() req: RequestWithUser): Promise<Ride | null> {
    if (req.user.role === UserType.DRIVER) {
      return this.rideService.getActiveForDriver(req.user.sub);
    }
    return this.rideService.getActiveForRider(req.user.sub);
  }

  @Get('/searching')
  @Roles(UserType.DRIVER)
  public listSearching(): Promise<Ride[]> {
    return this.rideService.listSearching();
  }

  @Get('/:id')
  @Roles(UserType.RIDER, UserType.DRIVER, UserType.ADMIN)
  public getById(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<Ride> {
    return this.rideService.getForParticipant(
      id,
      req.user.sub,
      req.user.role,
    );
  }

  @Post('/:id/accept')
  @Roles(UserType.DRIVER)
  public accept(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<Ride> {
    return this.rideService.acceptRide(id, req.user.sub);
  }

  @Post('/:id/start')
  @Roles(UserType.DRIVER)
  public start(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<Ride> {
    return this.rideService.startRide(id, req.user.sub);
  }

  @Post('/:id/complete')
  @Roles(UserType.DRIVER)
  public complete(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<Ride> {
    return this.rideService.completeRide(id, req.user.sub);
  }

  @Post('/:id/cancel')
  @Roles(UserType.RIDER, UserType.DRIVER)
  public cancel(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<Ride> {
    return this.rideService.cancelRide(id, req.user.sub);
  }
}
