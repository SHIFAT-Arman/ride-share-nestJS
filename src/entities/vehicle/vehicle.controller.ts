import { Controller, Get, Post, Put, Patch, Param, Query, Body, UsePipes, ValidationPipe, ParseIntPipe, UseInterceptors, UploadedFile, Res, } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MulterError, diskStorage } from 'multer';
import type { Response } from 'express';
import { VehicleService } from './vehicle.service';
import { VehicleDto } from './dto/vehicle.dto';

@Controller('vehicle')
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) { }

  @Get()
  getHello(): string {
    return this.vehicleService.getVehicle();
  }

  @Get('getallvehicle')
  getAllVehicle(): object {
    return this.vehicleService.getAllVehicle();
  }

  @Get('types')
  getVehicleTypes(): string[] {
    return this.vehicleService.getVehicleTypes();
  }

  @Get('getvehiclebyid/:myid/getbyname/:name')
  getVehicleByID(
    @Param('myid') id: number,
    @Param('name') name: string,
  ): object {
    return this.vehicleService.getVehicleByID(id, name);
  }

  @Get('getvehiclebyidandname')
  getVehicleByIDandName(
    @Query('id') id: number,
    @Query('name') name: string,
  ): object {
    return this.vehicleService.getVehicleByIDandName(id, name);
  }

  @Get('getvehiclebyidanddriver')
  getVehicleByIDandDriver(
    @Query('id') id: number,
    @Query('driver') driver: string,
  ): object {
    return this.vehicleService.getVehicleByIDandDriver(id, driver);
  }

  @Get(':id/verification-status')
  getVerificationStatus(@Param('id') id: string): object {
    return this.vehicleService.getVerificationStatus(id);
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe())
  patchVehicle(
    @Param('id', ParseIntPipe) id: number,
    @Body() vehicleDto: VehicleDto,
  ): object {
    return this.vehicleService.patchVehicle(id, vehicleDto);
  }
  @Get('/getimage/:name')
  getImage(@Param('name') name: string, @Res() res: Response) {
    res.sendFile(name, { root: './uploads' });
  }

  @Post(':id/upload-image')
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: (req, file, cb) => {
        if (file.originalname.match(/^.*\.(jpg|webp|png|jpeg)$/)) {
          cb(null, true);
        } else {
          cb(new MulterError('LIMIT_UNEXPECTED_FILE', 'image'), false);
        }
      },
      limits: { fileSize: 2000000 },
      storage: diskStorage({
        destination: './uploads',
        filename: function (req, file, cb) {
          cb(null, Date.now() + file.originalname);
        },
      }),
    }),
  )
  uploadVehicleImage(
    @Param('id', ParseIntPipe) id: number,
    @Body() vehicleDto: VehicleDto,
    @UploadedFile() file: Express.Multer.File,
  ): object {
    vehicleDto.filename = file.filename;
    console.log(vehicleDto);

    return this.vehicleService.uploadVehicleImage(id, vehicleDto);
  }
}
