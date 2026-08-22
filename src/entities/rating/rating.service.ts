import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rating } from './rating.entity';

@Injectable()
export class RatingService {
  constructor(
    @InjectRepository(Rating)
    private readonly ratingRepository: Repository<Rating>,
  ) {}

  public async getAllRatings(driverId: string): Promise<Rating[] | null> {
    return this.ratingRepository.find({
      where: { driver: { id: driverId } },
      select: {
        id: true,
        score: true,
        comment: true,
        createdAt: true,
      },
    });
  }
}
