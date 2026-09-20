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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { RiderService } from './rider.service';
import { CreateRiderDto } from './dto/create-rider.dto';
import {
  UpdateRiderDto,
  UpdateRiderStatusDto,
} from './dto/update-rider.dto';
import { FindRiderParams } from './params/find-rider.params';
import { Rider } from './rider.entity';
import { PaginationResponse } from '../common/pagination/pagination.response';
import { UploadProfilePictureResponseDto } from '../common/dto/upload-profile-picture-response.dto';
import { ProfilePictureValidationPipe } from '../common/pipes/profile-picture-validation.pipe';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { SelfOrAdminGuard } from '../../auth/guards/self-or-admin.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserType } from 'src/auth/user-type.enum';

@Controller('/v1/api/riders')
export class RiderController {
  constructor(private readonly riderService: RiderService) {}

  // ─── Admin-only: list all ─────────────────────────────────────────────────

  /** Admin only — paginated, filterable rider list. */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.ADMIN)
  @Get('rider-list')
  public async getRiderList(
    @Query() filter: FindRiderParams,
  ): Promise<PaginationResponse<Rider>> {
    const [riders, count] = await this.riderService.getRiderList(filter);
    return {
      data: riders,
      meta: { total: count, limit: filter.limit, offset: filter.offset },
    };
  }

  // ─── Admin-only: create (public signup stays on POST /auth/register) ─────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.ADMIN)
  @Post()
  public async createRider(
    @Body() createRiderDto: CreateRiderDto,
  ): Promise<Rider> {
    return this.riderService.createRider(createRiderDto);
  }

  // ─── Self or Admin: individual rider operations ───────────────────────────

  /** Accessible by the rider themselves or any admin. */
  @UseGuards(JwtAuthGuard, SelfOrAdminGuard)
  @Get(':id')
  public async getRiderById(@Param('id') id: string): Promise<Rider | null> {
    return this.riderService.getRiderById(id);
  }

  /** Rider can update their own profile; admins can update any profile. */
  @UseGuards(JwtAuthGuard, SelfOrAdminGuard)
  @Patch(':id')
  public async updateRiderById(
    @Param('id') id: string,
    @Body() updateRiderDto: UpdateRiderDto,
  ): Promise<Rider> {
    return this.riderService.updateRiderById(id, updateRiderDto);
  }

  /** Rider or admin can replace their profile picture. */
  @UseGuards(JwtAuthGuard, SelfOrAdminGuard)
  @Put(':id/profile-picture')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 2 * 1024 * 1024 } }))
  public async uploadProfilePicture(
    @Param('id') id: string,
    @UploadedFile(new ProfilePictureValidationPipe()) file: Express.Multer.File,
  ): Promise<UploadProfilePictureResponseDto> {
    return this.riderService.uploadProfilePicture(id, file);
  }

  // ─── Admin-only: privileged mutations ────────────────────────────────────

  /** Admin only — change a rider's status (e.g. suspend or activate). */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.ADMIN)
  @Patch(':id/status')
  public async updateRiderStatus(
    @Param('id') id: string,
    @Body() updateRiderStatusDto: UpdateRiderStatusDto,
  ): Promise<Rider> {
    return this.riderService.updateRiderStatus(
      id,
      updateRiderStatusDto.status,
    );
  }

  /** Admin only — soft-delete a rider account. */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.ADMIN)
  @Delete(':id')
  @HttpCode(204)
  public async deleteRiderById(@Param('id') id: string): Promise<void> {
    return this.riderService.deleteRiderById(id);
  }
}
