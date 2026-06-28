import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { DriverService } from './driver.service';
import { DriverDto } from './dto/driver.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage, MulterError } from 'multer';

@Controller('/v1/api/drivers')
export class DriverController {
  constructor(private readonly driverService: DriverService) {}

  @Get()
  public getDrivers(): object {
    return this.driverService.getDrivers();
  }
  @Get('/:id')
  public getDriverById(@Param('id') id: string): object {
    return this.driverService.getDriverById(id);
  }
  @Get('/:id/profile')
  public getProfileById(@Param('id') id: string): object {
    return this.driverService.getProfileById(id);
  }
  @Get('/:id/rides')
  public getRidesById(@Param('id') id: string): object {
    return this.driverService.getRidesById(id);
  }
  @Get('/:id/ratings')
  public getDriverRatings(@Param('id') id: string): object {
    return this.driverService.getDriverRatings(id);
  }
  @Get('/:id/earnings')
  public getDriverEarnings(@Param('id') id: string): object {
    return this.driverService.getDriverEarnings(id);
  }
  @Get('/:id/vehicle')
  public getDriverVehicle(@Param('id') id: string): object {
    return this.driverService.getDriverVehicle(id);
  }
  @Get('/:id/status')
  public getDriverStatus(@Param('id') id: string): object {
    return { id: `${id}`, status: 'active' };
  }
  @Get('/:id/location')
  public getDriverLocation(@Param('id') id: string): object {
    return this.driverService.getDriverLocation(id);
  }
  @Get('/nearby')
  public getNearbyDrivers(): object {
    return { drivers: [] };
  }

  @Post('createDriver')
  @UsePipes(new ValidationPipe())
  @UseInterceptors(
    FileInterceptor('myfile', {
      fileFilter: (req, file, cb) => {
        if (file.originalname.match(/^.*\.(jpg|webp|png|jpeg)$/))
          cb(null, true);
        else {
          cb(new MulterError('LIMIT_UNEXPECTED_FILE', 'image'), false);
        }
      },
      limits: { fileSize: 5000000 },
      storage: diskStorage({
        destination: './uploads',
        filename: function (req, file, cb) {
          cb(null, Date.now() + file.originalname);
        },
      }),
    }),
  )
  public createDriver(
    @Body() createDriverDto: DriverDto,
    @UploadedFile() myfile: Express.Multer.File,
  ): object {
    createDriverDto.myfile = myfile.originalname;
    console.log(myfile.originalname);

    return this.driverService.createDriver(createDriverDto);
  }

  @Get('/getimage/:name')
  getImages(@Param('name') name, @Res() res) {
    res.sendFile(name, { root: './uploads' });
  }
}
