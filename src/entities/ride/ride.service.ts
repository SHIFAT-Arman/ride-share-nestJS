import {
  BadGatewayException,
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { RideEstimateDto } from './dto/ride-estimate.dto';
import { RideEstimateResponseDto } from './dto/ride-estimate-response.dto';
import { Ride } from './ride.entity';
import { RideStatus } from './enums/ride-status.enum';
import { estimateFare, fetchOsrmRoute } from './osrm-route';
import { DriverLocationRepository } from '../location/repositories/driver-location.repository';
import { PusherService } from '../common/pusher.service';
import { UserType } from 'src/auth/user-type.enum';

const MATCH_RADIUS_M = 15_000;

@Injectable()
export class RideService {
  constructor(
    @InjectRepository(Ride)
    private readonly rideRepository: Repository<Ride>,
    private readonly driverLocationRepository: DriverLocationRepository,
    @Optional() private readonly pusherService?: PusherService,
  ) {}

  public async estimateRide(
    dto: RideEstimateDto,
  ): Promise<RideEstimateResponseDto> {
    let route;
    try {
      route = await fetchOsrmRoute(
        dto.pickup.longitude,
        dto.pickup.latitude,
        dto.destination.longitude,
        dto.destination.latitude,
      );
    } catch {
      throw new BadGatewayException('Could not compute route');
    }

    const fare = estimateFare(route.distanceKm, dto.vehicleType);

    return {
      estimatedFare: fare,
      estimatedDistanceInKm: Math.round(route.distanceKm * 100) / 100,
      estimatedDurationInMinutes: Math.round(route.durationMin),
      geometry: route.geometry,
      nearbyDrivers: [],
    };
  }

  public async createRide(
    dto: RideEstimateDto,
    riderUserId: string,
  ): Promise<Ride> {
    const estimate = await this.estimateRide(dto);

    const nearby = await this.driverLocationRepository.findNearbyDrivers(
      dto.pickup.latitude,
      dto.pickup.longitude,
      MATCH_RADIUS_M,
      dto.vehicleType,
    );

    const nearest = nearby[0];
    const ride = this.rideRepository.create({
      riderUserId,
      pickupLatitude: dto.pickup.latitude,
      pickupLongitude: dto.pickup.longitude,
      pickupAddress: dto.pickup.address,
      destinationLatitude: dto.destination.latitude,
      destinationLongitude: dto.destination.longitude,
      destinationAddress: dto.destination.address,
      vehicleType: dto.vehicleType,
      estimatedFare: estimate.estimatedFare,
      estimatedDistanceInKm: estimate.estimatedDistanceInKm,
      estimatedDurationInMinutes: estimate.estimatedDurationInMinutes,
      driverUserId: nearest?.driverId ?? null,
      status: nearest ? RideStatus.ACCEPTED : RideStatus.SEARCHING,
    });

    const saved = await this.rideRepository.save(ride);

    if (nearest && this.pusherService) {
      await this.pusherService.trigger(
        `driver-${nearest.driverId}`,
        'ride-assigned',
        {
          rideId: saved.id,
          status: saved.status,
          pickupAddress: saved.pickupAddress,
          destinationAddress: saved.destinationAddress,
          vehicleType: saved.vehicleType,
          estimatedFare: saved.estimatedFare,
        },
      );
    }

    return saved;
  }

  public async acceptRide(rideId: string, driverUserId: string): Promise<Ride> {
    const ride = await this.requireRide(rideId);
    if (ride.status !== RideStatus.SEARCHING) {
      throw new BadRequestException('Ride is not waiting for a driver');
    }
    if (ride.driverUserId && ride.driverUserId !== driverUserId) {
      throw new ForbiddenException('Ride already claimed');
    }
    ride.driverUserId = driverUserId;
    ride.status = RideStatus.ACCEPTED;
    const saved = await this.rideRepository.save(ride);

    if (this.pusherService) {
      await this.pusherService.trigger(`ride-${saved.id}`, 'ride-status', {
        rideId: saved.id,
        status: saved.status,
        driverUserId: saved.driverUserId,
      });
    }
    return saved;
  }

  public async startRide(rideId: string, driverUserId: string): Promise<Ride> {
    const ride = await this.requireDriverRide(rideId, driverUserId);
    if (ride.status !== RideStatus.ACCEPTED) {
      throw new BadRequestException('Ride must be ACCEPTED to start');
    }
    ride.status = RideStatus.IN_PROGRESS;
    return this.saveAndBroadcast(ride);
  }

  public async completeRide(
    rideId: string,
    driverUserId: string,
  ): Promise<Ride> {
    const ride = await this.requireDriverRide(rideId, driverUserId);
    if (ride.status !== RideStatus.IN_PROGRESS) {
      throw new BadRequestException('Ride must be IN_PROGRESS to complete');
    }
    ride.status = RideStatus.COMPLETED;
    return this.saveAndBroadcast(ride);
  }

  public async cancelRide(rideId: string, userId: string): Promise<Ride> {
    const ride = await this.requireRide(rideId);
    if (
      ride.riderUserId !== userId &&
      ride.driverUserId !== userId
    ) {
      throw new ForbiddenException('Not your ride');
    }
    if (
      ride.status === RideStatus.IN_PROGRESS ||
      ride.status === RideStatus.COMPLETED ||
      ride.status === RideStatus.CANCELLED
    ) {
      throw new BadRequestException('Cannot cancel this ride');
    }
    ride.status = RideStatus.CANCELLED;
    return this.saveAndBroadcast(ride);
  }

  public getActiveForRider(riderUserId: string): Promise<Ride | null> {
    return this.rideRepository.findOne({
      where: {
        riderUserId,
        status: In([
          RideStatus.SEARCHING,
          RideStatus.ACCEPTED,
          RideStatus.IN_PROGRESS,
        ]),
      },
      order: { createdAt: 'DESC' },
    });
  }

  public getActiveForDriver(driverUserId: string): Promise<Ride | null> {
    return this.rideRepository.findOne({
      where: {
        driverUserId,
        status: In([RideStatus.ACCEPTED, RideStatus.IN_PROGRESS]),
      },
      order: { createdAt: 'DESC' },
    });
  }

  public listSearching(vehicleType?: string): Promise<Ride[]> {
    return this.rideRepository.find({
      where: {
        status: RideStatus.SEARCHING,
        ...(vehicleType ? { vehicleType: vehicleType as never } : {}),
      },
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }

  public getById(id: string): Promise<Ride | null> {
    return this.rideRepository.findOneBy({ id });
  }

  public async getForParticipant(
    id: string,
    userId: string,
    role: string,
  ): Promise<Ride> {
    const ride = await this.requireRide(id);
    if (role === UserType.ADMIN) return ride;
    if (ride.riderUserId !== userId && ride.driverUserId !== userId) {
      throw new ForbiddenException('Not your ride');
    }
    return ride;
  }

  private async requireRide(id: string): Promise<Ride> {
    const ride = await this.rideRepository.findOneBy({ id });
    if (!ride) throw new NotFoundException('Ride not found');
    return ride;
  }

  private async requireDriverRide(
    rideId: string,
    driverUserId: string,
  ): Promise<Ride> {
    const ride = await this.requireRide(rideId);
    if (ride.driverUserId !== driverUserId) {
      throw new ForbiddenException('Not your assigned ride');
    }
    return ride;
  }

  private async saveAndBroadcast(ride: Ride): Promise<Ride> {
    const saved = await this.rideRepository.save(ride);
    if (this.pusherService) {
      await this.pusherService.trigger(`ride-${saved.id}`, 'ride-status', {
        rideId: saved.id,
        status: saved.status,
        driverUserId: saved.driverUserId,
      });
    }
    return saved;
  }
}
