import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { RideService } from './ride.service';
import { RideEstimateDto } from './dto/ride-estimate.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserType } from 'src/auth/user-type.enum';
import { Ride } from './ride.entity';
import { RideEstimateResponseDto } from './dto/ride-estimate-response.dto';
import { PaginationParams } from '../common/pagination/pagination.params';
import { PaginationResponse } from '../common/pagination/pagination.response';
import { RatingService } from '../rating/rating.service';
import { CreateRatingDto } from '../rating/dto/create-rating.dto';
import { Rating } from '../rating/rating.entity';

interface RequestWithUser extends Request {
  user: {
    sub: string;
    email: string;
    role: string;
  };
}

@Controller('/v1/api/ride')
export class RideController {
  constructor(
    private readonly rideService: RideService,
    private readonly ratingService: RatingService,
  ) {}

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

  @Get('/history')
  @Roles(UserType.RIDER, UserType.DRIVER)
  public listHistory(
    @Req() req: RequestWithUser,
    @Query() filter: PaginationParams,
  ): Promise<PaginationResponse<Ride>> {
    return this.rideService.listHistory(req.user.sub, req.user.role, filter);
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

  @Get('/:id/rating')
  @Roles(UserType.RIDER, UserType.DRIVER, UserType.ADMIN)
  public async getRating(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<{ rating: Rating | null }> {
    await this.rideService.getForParticipant(id, req.user.sub, req.user.role);
    // Nest drops a bare `return null` to an empty body; wrap so clients get JSON.
    return { rating: await this.ratingService.findByRideId(id) };
  }

  @Post('/:id/rate')
  @Roles(UserType.RIDER)
  public async rate(
    @Param('id') id: string,
    @Body() dto: CreateRatingDto,
    @Req() req: RequestWithUser,
  ): Promise<Rating> {
    const ride = await this.rideService.getForParticipant(
      id,
      req.user.sub,
      req.user.role,
    );
    return this.ratingService.createForCompletedRide(ride, req.user.sub, dto);
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
