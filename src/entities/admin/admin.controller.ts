import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { CreateAdminDto } from './dto/create-admin.dto';
import { AdminService } from './admin.service';
import { AdminRole } from './admin-role.model';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage, MulterError } from 'multer';
import type { Response } from 'express';

@Controller('/v1/api/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('createAdmin')
  @UseInterceptors(
    FileInterceptor('profilePictureUrl', {
      fileFilter: (req, file, cb) => {
        if (file.originalname.match(/^.*\.(jpg|jpeg|png|gif)$/)) {
          cb(null, true);
        } else {
          cb(new MulterError('LIMIT_UNEXPECTED_FILE', 'image'), false);
        }
      },
      limits: { fileSize: 50000 },
      storage: diskStorage({
        destination: './uploads',
        filename: function (req, file, cb) {
          cb(null, Date.now() + file.originalname);
        },
      }),
    }),
  )
  public createAdmin(
    @Body() createAdminDto: CreateAdminDto,
    @UploadedFile() profilePictureUrl: Express.Multer.File,
  ): object {
    // console.log(profilePictureUrl);
    createAdminDto.profilePictureUrl = profilePictureUrl.filename;
    return this.adminService.createAdmin(createAdminDto);
  }

  @Get('adminProfile/:role')
  public adminProfileByRole(@Param() adminRole: AdminRole): object {
    return this.adminService.adminProfileByRole(adminRole);
  }

  @Get('profilePicture/:filename')
  public getProfilePicture(
    @Param('filename') filename: string,
    @Res() res: Response,
  ): void {
    res.sendFile(filename, { root: './uploads' });
  }
}
