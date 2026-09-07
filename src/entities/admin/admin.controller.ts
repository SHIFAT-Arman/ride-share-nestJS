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
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateAdminDto } from './dto/create-admin.dto';
import { AdminService } from './admin.service';
import { ProfilePictureValidationPipe } from '../common/pipes/profile-picture-validation.pipe';
import { UploadProfilePictureResponseDto } from '../common/dto/upload-profile-picture-response.dto';
import { Admin } from './admin.entity';
import { PaginationResponse } from '../common/pagination/pagination.response';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { AdminFilterParams } from './params/find-admin.params';
import { CreateAnnouncementDto } from './announcement/create-announcement.dto';
import { Announcement } from './announcement/announcement.entity';
import { FindAnnouncementParams } from './params/find-announcement.params';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { SelfOrSuperAdminGuard } from '../../auth/guards/self-or-super-admin.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { EmailService } from './email/email.service';
import { SendEmailDto } from './email/send-email.dto';
import { UserType } from 'src/auth/user-type.enum';
import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';

interface RequestWithUser extends Request {
  user: JwtPayload;
}

@Controller('/v1/api/admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly emailService: EmailService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.SUPER_ADMIN)
  @Get('admin-list')
  public async getAdminList(
    // @Query() pagination: PaginationParams,
    @Query() filter: AdminFilterParams,
  ): Promise<PaginationResponse<Admin>> {
    const [admins, count] = await this.adminService.getAdminList(filter);
    // console.log(filter);
    return {
      data: admins,
      meta: {
        total: count,
        offset: filter.offset,
        limit: filter.limit,
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('get-admin-by-profileId/:id')
  public async getAdminByProfileId(
    @Param('id') profileId: string,
    @Req() req: RequestWithUser,
  ): Promise<Admin | null> {
    return await this.adminService.getAdminByProfileId(profileId, req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.SUPER_ADMIN)
  @Post('/create')
  public async createAdmin(
    @Body() createAdminDto: CreateAdminDto,
  ): Promise<Admin> {
    return this.adminService.createAdmin(createAdminDto);
  }

  @UseGuards(JwtAuthGuard, SelfOrSuperAdminGuard)
  @Patch('update-admin/:id')
  public async updateAdminById(
    @Param('id') id: string,
    @Body() updateAdminDto: UpdateAdminDto,
    @Req() req: RequestWithUser,
  ): Promise<Admin | null> {
    return await this.adminService.updateAdminById(
      id,
      updateAdminDto,
      req.user,
    );
  }

  @UseGuards(JwtAuthGuard, SelfOrSuperAdminGuard)
  @Get('/:id/profile-picture')
  public async getProfilePicture(
    @Param('id') id: string,
  ): Promise<UploadProfilePictureResponseDto> {
    return await this.adminService.getProfilePictureUrl(id);
  }

  @UseGuards(JwtAuthGuard, SelfOrSuperAdminGuard)
  @Put('/:id/profile-picture')
  @UseInterceptors(FileInterceptor('file'))
  public async uploadProfilePicture(
    @Param('id') id: string,
    @UploadedFile(new ProfilePictureValidationPipe()) file: Express.Multer.File,
  ): Promise<UploadProfilePictureResponseDto> {
    return this.adminService.uploadProfilePicture(id, file);
  }

  @UseGuards(JwtAuthGuard)
  @Get('get-announcements')
  public async getAnnouncements(
    @Query() filter: FindAnnouncementParams,
  ): Promise<PaginationResponse<Announcement>> {
    const [announcements, count] =
      await this.adminService.getAnnouncements(filter);

    return {
      data: announcements,
      meta: {
        total: count,
        offset: filter.offset,
        limit: filter.limit,
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('create-announcement')
  public async createAnnouncement(
    @Body() createAnnouncementDto: CreateAnnouncementDto,
    @Req() req: RequestWithUser,
  ): Promise<Announcement> {
    // console.log(req.user);
    return this.adminService.createAnnouncement(
      createAnnouncementDto,
      req.user.sub,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete('delete-announcement/:id')
  @HttpCode(204)
  public async deleteAnnouncementById(@Param('id') id: string): Promise<void> {
    return await this.adminService.deleteAnnouncementById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.SUPER_ADMIN)
  @Delete('delete-admin/:id')
  @HttpCode(204)
  public async deleteAdminById(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<void> {
    return await this.adminService.deleteAdminById(id, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('send-email')
  @HttpCode(200)
  async sendEmail(@Body() sendEmailDto: SendEmailDto): Promise<void> {
    await this.emailService.sendEmail(sendEmailDto);
  }
}
