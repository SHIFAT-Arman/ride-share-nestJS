import {
  BadGatewayException,
  Injectable,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { SearchLocationParams } from './params/search-location.params';
import { DriverLocationRepository } from './repositories/driver-location.repository';
import { UpdateDriverLocationDto } from './dto/driver-location.dto';
import {
  mapNominatimResults,
  type NominatimHit,
  type PlaceResult,
} from './map-nominatim';
import { Ride } from '../ride/ride.entity';
import { RideStatus } from '../ride/enums/ride-status.enum';
import { PusherService } from '../common/pusher.service';

@Injectable()
export class LocationService {
  constructor(
    private readonly driverLocationRepository: DriverLocationRepository,
    @InjectRepository(Ride)
    private readonly rideRepository: Repository<Ride>,
    @Optional() private readonly pusherService?: PusherService,
  ) {}

  async updateDriverLocation(driverId: string, dto: UpdateDriverLocationDto) {
    await this.driverLocationRepository.saveLocation(
      driverId,
      dto.latitude,
      dto.longitude,
    );

    const active = await this.rideRepository.findOne({
      where: {
        driverUserId: driverId,
        status: In([RideStatus.ACCEPTED, RideStatus.IN_PROGRESS]),
      },
      order: { createdAt: 'DESC' },
    });

    if (active && this.pusherService) {
      await this.pusherService.trigger(`ride-${active.id}`, 'driver-location', {
        rideId: active.id,
        latitude: dto.latitude,
        longitude: dto.longitude,
      });
    }

    return {
      message: 'Driver location updated.',
    };
  }

  /** Proxies OpenStreetMap Nominatim (no API key; fine for a tiny demo). */
  public async searchLocation(
    searchLocationParams: SearchLocationParams,
  ): Promise<PlaceResult[]> {
    const q = searchLocationParams.place?.trim();
    if (!q) return [];

    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', q);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '5');

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'RideShare-StudentProject/1.0',
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      throw new BadGatewayException('Location search failed');
    }

    const hits = (await res.json()) as NominatimHit[];
    return mapNominatimResults(hits);
  }
}
