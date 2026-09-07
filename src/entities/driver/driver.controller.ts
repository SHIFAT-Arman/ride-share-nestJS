import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { DriverService } from './driver.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import {
  UpdateDriverDto,
  UpdateDriverStatusDto,
} from './dto/update-driver.dto';
import { FindDriverParams } from './params/find-driver.params';
import { Driver } from './driver.entity';
import { PaginationResponse } from '../common/pagination/pagination.response';
import { UploadProfilePictureResponseDto } from '../common/dto/upload-profile-picture-response.dto';
import { ProfilePictureValidationPipe } from '../common/pipes/profile-picture-validation.pipe';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { SelfOrAdminGuard } from '../../auth/guards/self-or-admin.guard';
import { UserType } from 'src/auth/user-type.enum';
import { Roles } from '../../auth/decorators/roles.decorator';
import { VehicleService } from '../vehicle/vehicle.service';
import { Vehicle } from '../vehicle/vehicle.entity';
import { CreateVehicleDto } from '../vehicle/dto/create-vehicle.dto';
import { RatingService } from '../rating/rating.service';
import { Rating } from '../rating/rating.entity';

interface RequestWithUser extends Request {
  user: {
    sub: string;
    email: string;
    role: string;
  };
}

@Controller('/v1/api/drivers')
export class DriverController {
  constructor(
    private readonly driverService: DriverService,
    private readonly vehicleService: VehicleService,
    private readonly ratingService: RatingService,
  ) {}

  // ─── Admin-only: list all ─────────────────────────────────────────────────

  /** Admin only — paginated, filterable driver list. */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.SUPER_ADMIN)
  @Get('driver-list')
  public async getDriverList(
    @Query() filter: FindDriverParams,
  ): Promise<PaginationResponse<Driver>> {
    const [drivers, count] = await this.driverService.getDriverList(filter);
    return {
      data: drivers,
      meta: { total: count, limit: filter.limit, offset: filter.offset },
    };
  }

  // ─── Public: registration (also called from auth module) ─────────────────

  @Post()
  public async createDriver(
    @Body() createDriverDto: CreateDriverDto,
  ): Promise<Driver> {
    return this.driverService.createDriver(createDriverDto);
  }

  // ─── Authenticated driver: own resources ──────────────────────────────────

  /** Creates a vehicle for the currently authenticated driver. */
  @UseGuards(JwtAuthGuard)
  @Post('vehicle')
  public async createVehicle(
    @Body() createVehicleDto: CreateVehicleDto,
    @Req() req: RequestWithUser,
  ): Promise<Vehicle> {
    return this.vehicleService.createVehicle(createVehicleDto, req.user.sub);
  }

  /** Returns ratings for the currently authenticated driver. */
  @UseGuards(JwtAuthGuard)
  @Get('ratings')
  public async getMyRatings(
    @Req() req: RequestWithUser,
  ): Promise<Rating[] | null> {
    return this.ratingService.getAllRatings(req.user.sub);
  }

  // ─── Self or Admin: individual driver operations ──────────────────────────

  /** Accessible by the driver themselves or any admin. */
  @UseGuards(JwtAuthGuard, SelfOrAdminGuard)
  @Get(':id')
  public async getDriverById(@Param('id') id: string): Promise<Driver | null> {
    return this.driverService.getDriverById(id);
  }

  /** Driver can update their own profile; admins can update any profile. */
  @UseGuards(JwtAuthGuard, SelfOrAdminGuard)
  @Patch(':id')
  public async updateDriverById(
    @Param('id') id: string,
    @Body() updateDriverDto: UpdateDriverDto,
  ): Promise<Driver> {
    return this.driverService.updateDriverById(id, updateDriverDto);
  }

  /** Driver or admin can replace their profile picture. */
  @UseGuards(JwtAuthGuard, SelfOrAdminGuard)
  @Put(':id/profile-picture')
  @UseInterceptors(FileInterceptor('file'))
  public async uploadProfilePicture(
    @Param('id') id: string,
    @UploadedFile(new ProfilePictureValidationPipe()) file: Express.Multer.File,
  ): Promise<UploadProfilePictureResponseDto> {
    return this.driverService.uploadProfilePicture(id, file);
  }

  // ─── Admin-only: privileged mutations ────────────────────────────────────

  /** Admin only — change a driver's status (e.g. suspend or activate). */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.SUPER_ADMIN)
  @Patch(':id/status')
  public async updateDriverStatus(
    @Param('id') id: string,
    @Body() updateDriverStatusDto: UpdateDriverStatusDto,
  ): Promise<Driver> {
    return this.driverService.updateDriverStatus(
      id,
      updateDriverStatusDto.status,
    );
  }

  /** Admin only — soft-delete a driver account. */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.SUPER_ADMIN)
  @Delete(':id')
  @HttpCode(204)
  public async deleteDriverById(@Param('id') id: string): Promise<void> {
    return this.driverService.deleteDriverById(id);
  }
}
