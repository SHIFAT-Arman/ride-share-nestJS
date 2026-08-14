import { Injectable, NotFoundException } from '@nestjs/common';
import { Rider } from './rider.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRiderDto } from './dto/create-rider.dto';
import { UploadProfilePictureResponseDto } from '../common/dto/upload-profile-picture-response.dto';
import { ProfilePictureService } from '../common/profile-picture/profile-picture.service';
import * as bcrypt from 'bcrypt';
import { PaginationParams } from '../common/pagination/pagination.params';

@Injectable()
export class RiderService {
  constructor(
    @InjectRepository(Rider)
    private readonly riderRepository: Repository<Rider>,
    private readonly profilePictureService: ProfilePictureService,
  ) {}

  public async getAllRiders(
    pagination: PaginationParams,
  ): Promise<[Rider[], number]> {
    return await this.riderRepository.findAndCount({
      skip: pagination.offset,
      take: pagination.limit,
    });
  }

  public getRiderById(id: string): object {
    return { id: `${id}`, name: `Arman`, longitude: 242, langtitude: 450 };
  }

  public getProfileById(id: string): object {
    return { id: `${id}`, name: `Shifat`, email: `shifatshiam@gmail.com` };
  }

  public getRidesById(id: string): object {
    return { id: `${id}`, rides: [] };
  }

  public getPaymentMethodsById(id: string): object {
    return { id: `${id}`, paymentMethods: [] };
  }

  public getSavedPlacesById(id: string): object {
    return { id: `${id}`, savedPlaces: [] };
  }

  public searchRiderByIdAndName(id: string, name: string): object {
    return { id: `${id}`, name: `${name}`, longitude: 242, langtitude: 450 };
  }

  public getRiderRatings(id: string): object {
    return { id: `${id}`, ratings: [{ driverId: 1, rating: 5 }] };
  }

  public getRiderProfileById(id: string): object {
    return { id: `${id}`, name: `Shifat`, email: `shifatshiam@gmail.com` };
  }

  public async createRider(createRiderDto: CreateRiderDto): Promise<Rider> {
    const hashedPass = await bcrypt.hash(createRiderDto.password, 12);

    const rider = this.riderRepository.create({
      ...createRiderDto,
      password: hashedPass,
    });

    return this.riderRepository.save(rider);
  }

  public async uploadProfilePicture(
    id: string,
    file: Express.Multer.File,
  ): Promise<UploadProfilePictureResponseDto> {
    const rider = await this.riderRepository.findOne({ where: { id } });

    if (!rider) {
      throw new NotFoundException(`Rider with id '${id}' not found.`);
    }

    const profilePictureUrl = await this.profilePictureService.replace(
      rider.profilePictureUrl ?? null,
      file,
      'riders',
    );

    await this.riderRepository.update(id, { profilePictureUrl });

    return { profilePictureUrl };
  }
  public async findOneByEmail(email: string): Promise<Rider | null> {
    return await this.riderRepository.findOne({ where: { email } });
  }
}
