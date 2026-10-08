import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rating } from './rating.entity';
import { Driver } from '../driver/driver.entity';
import { Ride } from '../ride/ride.entity';
import { RideStatus } from '../ride/enums/ride-status.enum';
import { CreateRatingDto } from './dto/create-rating.dto';

@Injectable()
export class RatingService {
  constructor(
    @InjectRepository(Rating)
    private readonly ratingRepository: Repository<Rating>,
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
  ) {}

  public async getAllRatings(driverId: string): Promise<Rating[] | null> {
    return this.ratingRepository.find({
      where: { driver: { id: driverId } },
      select: {
        id: true,
        score: true,
        comment: true,
        rideId: true,
        createdAt: true,
      },
      order: { createdAt: 'DESC' },
    });
  }

  public findByRideId(rideId: string): Promise<Rating | null> {
    return this.ratingRepository.findOne({
      where: { rideId },
      select: {
        id: true,
        score: true,
        comment: true,
        rideId: true,
        riderUserId: true,
        createdAt: true,
      },
    });
  }

  public async createForCompletedRide(
    ride: Ride,
    riderUserId: string,
    dto: CreateRatingDto,
  ): Promise<Rating> {
    if (ride.riderUserId !== riderUserId) {
      throw new BadRequestException('Only the rider can rate this ride');
    }
    if (ride.status !== RideStatus.COMPLETED) {
      throw new BadRequestException('Ride must be completed to rate');
    }
    if (!ride.driverUserId) {
      throw new BadRequestException('Ride has no assigned driver');
    }

    const existing = await this.findByRideId(ride.id);
    if (existing) {
      throw new ConflictException('Ride already rated');
    }

    const driver = await this.driverRepository.findOneBy({
      id: ride.driverUserId,
    });
    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    const rating = this.ratingRepository.create({
      score: dto.score,
      comment: dto.comment?.trim() ? dto.comment.trim() : null,
      rideId: ride.id,
      riderUserId,
      driver,
    });
    return this.ratingRepository.save(rating);
  }
}
