import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Res,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { DriverService } from './driver.service';
import { CreateDriverDto, UpdateStatusDto } from './dto/driver.dto';
import type { Response } from 'express';

@Controller('/v1/api/drivers')
export class DriverController {
  constructor(private readonly driverService: DriverService) {}

  @Get('/status/inactive')
  public getInactiveDrivers() {
    return this.driverService.findInactive();
  }

  @Get('/status/active')
  public getActiveDrivers() {
    return this.driverService.findActive();
  }

  @Get('/filter/older-than-40')
  public getDriversOlderThan40() {
    return this.driverService.findOlderThan40();
  }
  @Get('/:id/fullname')
  public getDriverByName(@Param('id', ParseIntPipe) id: number) {
    return this.driverService.findFullNameById(id);
  }

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
  public createDriver(@Body() createDriverDto: CreateDriverDto): object {
    return this.driverService.createDriver(createDriverDto);
  }

  @Get('/getimage/:name')
  getImages(@Param('name') name: string, @Res() res: Response) {
    res.sendFile(name, { root: './uploads' });
  }

  @Patch('/:id/status')
  @UsePipes(new ValidationPipe())
  public changeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.driverService.changeStatus(id, dto.status);
  }
  @Delete('/:id')
  public deleteDriver(@Param('id', ParseIntPipe) id: number): object {
    return { message: `Driver with id ${id} deleted successfully` };
  }
}
