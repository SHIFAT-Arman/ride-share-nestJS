import { Injectable } from '@nestjs/common';
import { Rating } from './rating.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class RatingService {
  constructor(
    @InjectRepository(Rating)
    private readonly ratingRepo: Repository<Rating>,
  ) {}
  public async getAllRatings(driverId: number): Promise<Rating[] | null> {
    return this.ratingRepo.find({
      where: {
        driver: {
          id: driverId,
        },
      },
      // relations: {
      //   driver: true,
      // },
      select: {
        id: true,
        score: true,
        comment: true,
        createdAt: true,
        driver: false,
      },
    });
  }
}
