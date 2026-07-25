import { Injectable } from '@nestjs/common';
import { SearchLocationParams } from './params/search-location.params';
import { DriverLocationRepository } from './repositories/driver-location.repository';
import { UpdateDriverLocationDto } from './dto/driver-location.dto';

@Injectable()
export class LocationService {
  constructor(
    private readonly driverLocationRepository: DriverLocationRepository,
  ) {}

  async updateDriverLocation(driverId: number, dto: UpdateDriverLocationDto) {
    await this.driverLocationRepository.saveLocation(
      driverId,
      dto.latitude,
      dto.longitude,
    );

    return {
      message: 'Driver location updated.',
    };
  }
  public searchLocation(searchLocationParams: SearchLocationParams): object {
    return { place: searchLocationParams.place };
  }
}
