import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAdminDto } from './dto/create-admin.dto';
import { AdminParams } from './admin-profile.params';
import { ProfilePictureService } from '../common/profile-picture/profile-picture.service';
import { UploadProfilePictureResponseDto } from '../common/dto/upload-profile-picture-response.dto';
import { Admin } from './admin.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
// import { PaginationParams } from '../common/pagination/pagination.params';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { AdminFilterParams } from './params/find-admin.params';
import { AdminProfile } from './adminProfile/admin-profile.entity';
import { CreateAnnouncementDto } from './announcement/create-announcement.dto';
import { Announcement } from './announcement/announcement.entity';
import { FindAnnouncementParams } from './params/find-announcement.params';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,

    @InjectRepository(AdminProfile)
    private readonly adminProfileRepository: Repository<AdminProfile>,

    @InjectRepository(Announcement)
    private readonly announcementRepository: Repository<Announcement>,

    private readonly profilePictureService: ProfilePictureService,
  ) {}

  public async getAdminList(
    // pagination: PaginationParams,
    filter: AdminFilterParams,
  ): Promise<[Admin[], number]> {
    const profileWhere: FindOptionsWhere<AdminProfile> = {};
    const where: FindOptionsWhere<Admin> = {};

    if (filter.joiningDate) {
      profileWhere.joiningDate = filter.joiningDate;
    }
    if (filter.country) {
      profileWhere.country = ILike(`%${filter.country}%`);
    }
    if (filter.firstName) {
      profileWhere.firstName = ILike(`%${filter.firstName}%`);
    }
    if (filter.lastName) {
      profileWhere.lastName = ILike(`%${filter.lastName}%`);
    }
    if (filter.role) {
      where.role = filter.role;
    }
    if (filter.id) {
      where.id = filter.id;
    }

    where.profile = profileWhere;

    return await this.adminRepository.findAndCount({
      where,
      skip: filter.offset,
      take: filter.limit,
      // select: { id: true, uniqeId: true },
      order: {
        createdAt: 'ASC',
      },
      relations: { profile: true },
    });
  }

  public async createAdmin(createAdminDto: CreateAdminDto): Promise<Admin> {
    const hashedPass = await bcrypt.hash(createAdminDto.password, 12);

    const admin = this.adminRepository.create({
      email: createAdminDto.email,
      password: hashedPass,
      role: createAdminDto.role,
      profile: {
        firstName: createAdminDto.firstName,
        lastName: createAdminDto.lastName,
        country: createAdminDto.country,
        joiningDate: createAdminDto.joiningDate,
        profilePictureUrl: createAdminDto.profilePictureUrl,
        age: createAdminDto.age,
      },
    });
    return this.adminRepository.save(admin);
  } //follow repo pattern to avoid error

  public async updateAdminById(
    id: string,
    updateAdminDto: UpdateAdminDto,
  ): Promise<Admin | null> {
    const admin = await this.adminRepository.findOne({
      where: { id },
      relations: { profile: true },
    });
    // console.log(admin);
    if (!admin) throw new NotFoundException(`Admin with id '${id}' not found.`);

    this.adminRepository.merge(admin, updateAdminDto);
    this.adminProfileRepository.merge(admin.profile, updateAdminDto);

    return this.adminRepository.save(admin);
  }

  public adminProfileByRole(adminRole: AdminParams): object {
    return { role: adminRole };
  }

  public async uploadProfilePicture(
    id: string,
    file: Express.Multer.File,
  ): Promise<UploadProfilePictureResponseDto> {
    const admin = await this.adminRepository.findOne({
      where: { id },
      relations: { profile: true },
    });
    console.log(admin);
    if (!admin) throw new NotFoundException(`Admin with id '${id}' not found.`);

    const profilePictureUrl = await this.profilePictureService.replace(
      admin.profile.profilePictureUrl,
      file,
      'admins',
    );
    // await this.adminProfileRepository.update({ id }, { profilePictureUrl });
    // using merge
    this.adminProfileRepository.merge(admin.profile, {
      profilePictureUrl,
    });
    return this.adminProfileRepository.save(admin.profile);
  }

  public async getAnnouncements(
    filter: FindAnnouncementParams,
  ): Promise<[Announcement[], number]> {
    const where: FindOptionsWhere<Announcement> = {};
    if (filter.adminProfileId) {
      where.id = filter.adminProfileId;
    }

    if (filter.title) {
      where.title = ILike(`%${filter.title}%`);
    }

    if (filter.createdAt) {
      where.createdAt = filter.createdAt;
    }

    return await this.announcementRepository.findAndCount({
      where,
      skip: filter.offset,
      take: filter.limit,
      order: {
        createdAt: 'DESC',
      },
      relations: { adminProfile: true },
    });
  }

  public async createAnnouncement(
    createAnnouncementDto: CreateAnnouncementDto,
  ): Promise<Announcement> {
    const announcement = this.announcementRepository.create({
      ...createAnnouncementDto,
    });
    return this.announcementRepository.save(announcement);
  }

  public async deleteAdminById(id: string): Promise<void> {
    const admin = await this.adminRepository.findOneBy({ id });
    console.log(admin);
    if (!admin) throw new NotFoundException(`Admin with id '${id}' not found.`);
    await this.adminRepository.softDelete(id);
  }
}
