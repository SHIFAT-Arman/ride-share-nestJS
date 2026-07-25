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
import { AuthGuard } from './auth/auth.guard';

interface RequestWithUser extends Request {
  user: {
    sub: string;
    email: string;
    role: string;
  };
}

@Controller('/v1/api/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @UseGuards(AuthGuard)
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

  @Post('/create')
  public async createAdmin(
    @Body() createAdminDto: CreateAdminDto,
  ): Promise<Admin> {
    return this.adminService.createAdmin(createAdminDto);
  }

  @Patch('update-admin/:id')
  public async updateAdminById(
    @Param('id') id: string,
    @Body() updateAdminDto: UpdateAdminDto,
  ): Promise<Admin | null> {
    return await this.adminService.updateAdminById(id, updateAdminDto);
  }

  @Put('/:id/profile-picture')
  @UseInterceptors(FileInterceptor('file'))
  public async uploadProfilePicture(
    @Param('id') id: string,
    @UploadedFile(new ProfilePictureValidationPipe()) file: Express.Multer.File,
  ): Promise<UploadProfilePictureResponseDto> {
    return this.adminService.uploadProfilePicture(id, file);
  }

  @UseGuards(AuthGuard)
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

  @UseGuards(AuthGuard)
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

  // @UseGuards(AuthGuard)
  // @Delete('delete-announcement/:id')
  // @HttpCode(204)
  // public async deleteAnnouncementById(@Param('id') id: string): Promise<void> {
  //   return await this.adminService.deleteAnnouncementById(id);
  // }

  @Delete('delete-admin/:id')
  @HttpCode(204)
  public async deleteAdminById(@Param('id') id: string): Promise<void> {
    return await this.adminService.deleteAdminById(id);
  }
}
