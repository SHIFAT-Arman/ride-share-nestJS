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
  StreamableFile,
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
import { ChangePasswordDto } from './dto/change-password.dto';
import { AdminFilterParams } from './params/find-admin.params';
import { CreateAnnouncementDto } from './announcement/create-announcement.dto';
import { Announcement } from './announcement/announcement.entity';
import { FindAnnouncementParams } from './params/find-announcement.params';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { SelfOrAdminGuard } from '../../auth/guards/self-or-admin.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { EmailService } from './email/email.service';
import { SendEmailDto } from './email/send-email.dto';
import { UserType } from 'src/auth/user-type.enum';
import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';
import { createReadStream } from 'fs';

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
  @Roles(UserType.ADMIN)
  @Get('admin-list')
  public async getAdminList(
    @Query() filter: AdminFilterParams,
  ): Promise<PaginationResponse<Admin>> {
    const [admins, count] = await this.adminService.getAdminList(filter);
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
  @Roles(UserType.ADMIN)
  @Get('get-admin-by-id')
  public async getAdminById(@Req() req: RequestWithUser): Promise<Admin> {
    return await this.adminService.getAdminById(req.user.sub);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.ADMIN)
  @Post('/create')
  public async createAdmin(
    @Body() createAdminDto: CreateAdminDto,
  ): Promise<Admin> {
    return this.adminService.createAdmin(createAdminDto);
  }

  @UseGuards(JwtAuthGuard, SelfOrAdminGuard)
  @Patch('update-admin/:id')
  public async updateAdminById(
    @Param('id') id: string,
    @Body() updateAdminDto: UpdateAdminDto,
  ): Promise<Admin> {
    return await this.adminService.updateAdminById(id, updateAdminDto);
  }

  @UseGuards(JwtAuthGuard, SelfOrAdminGuard)
  @Patch('change-password/:id')
  @HttpCode(204)
  public async changePassword(
    @Param('id') id: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    await this.adminService.changePassword(id, changePasswordDto);
  }

  @UseGuards(JwtAuthGuard, SelfOrAdminGuard)
  @Get('/profile-picture')
  public async getProfilePicture(
    @Req() req: RequestWithUser,
  ): Promise<StreamableFile> {
    const filePath = await this.adminService.getProfilePictureUrl(req.user.sub);
    return new StreamableFile(createReadStream(filePath));
  }

  @UseGuards(JwtAuthGuard, SelfOrAdminGuard)
  @Get('/:id/profile-picture')
  public async getProfilePictureById(
    @Param('id') id: string,
  ): Promise<StreamableFile> {
    const filePath = await this.adminService.getProfilePictureUrl(id);
    return new StreamableFile(createReadStream(filePath));
  }

  @UseGuards(JwtAuthGuard, SelfOrAdminGuard)
  @Put('/:id/profile-picture')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 2 * 1024 * 1024 } }))
  public async uploadProfilePicture(
    @Param('id') id: string,
    @UploadedFile(new ProfilePictureValidationPipe()) file: Express.Multer.File,
  ): Promise<UploadProfilePictureResponseDto> {
    return this.adminService.uploadProfilePicture(id, file);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.ADMIN)
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.ADMIN)
  @Post('create-announcement')
  public async createAnnouncement(
    @Body() createAnnouncementDto: CreateAnnouncementDto,
    @Req() req: RequestWithUser,
  ): Promise<Announcement> {
    return this.adminService.createAnnouncement(
      createAnnouncementDto,
      req.user.sub,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.ADMIN)
  @Delete('delete-announcement/:id')
  @HttpCode(204)
  public async deleteAnnouncementById(@Param('id') id: string): Promise<void> {
    return await this.adminService.deleteAnnouncementById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.ADMIN)
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
