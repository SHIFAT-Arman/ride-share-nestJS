import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateAdminDto } from './dto/create-admin.dto';
import { ProfilePictureService } from '../common/profile-picture/profile-picture.service';
import { UploadProfilePictureResponseDto } from '../common/dto/upload-profile-picture-response.dto';
import { Admin } from './admin.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { AdminFilterParams } from './params/find-admin.params';
import { AdminProfile } from './adminProfile/admin-profile.entity';
import { CreateAnnouncementDto } from './announcement/create-announcement.dto';
import { Announcement } from './announcement/announcement.entity';
import { FindAnnouncementParams } from './params/find-announcement.params';

import { UserService } from '../user/user.service';
import { UserType } from 'src/auth/user-type.enum';

type Actor = { sub: string; role: UserType };

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
    private readonly userService: UserService,
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
      where.user = { role: filter.role };
    }
    if (filter.id) {
      where.id = filter.id;
    }

    where.profile = profileWhere;

    return await this.adminRepository.findAndCount({
      where,
      skip: filter.offset,
      take: filter.limit,
      order: {
        createdAt: 'ASC',
      },
      relations: { profile: true, user: true },
    });
  }

  public async getAdminByProfileId(
    profileId: string,
    actor: Actor,
  ): Promise<Admin> {
    const admin = await this.adminRepository.findOne({
      where: { profile: { id: profileId } },
      relations: { profile: true, user: true },
    });
    if (!admin) {
      throw new NotFoundException(
        `Admin with profile id '${profileId}' not found.`,
      );
    }
    this.assertSelfOrSuperAdmin(admin.id, actor);
    return admin;
  }

  public async createAdmin(createAdminDto: CreateAdminDto): Promise<Admin> {
    // ponytail: user row can orphan if this save fails; wrap in a transaction if that starts happening
    const user = await this.userService.create(
      createAdminDto.email,
      createAdminDto.password,
      createAdminDto.role,
    );

    const admin = this.adminRepository.create({
      id: user.id,
      user,
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
  }

  public async updateAdminById(
    id: string,
    updateAdminDto: UpdateAdminDto,
    actor: Actor,
  ): Promise<Admin | null> {
    const admin = await this.adminRepository.findOne({
      where: { id },
      relations: { profile: true, user: true },
    });
    if (!admin) throw new NotFoundException(`Admin with id '${id}' not found.`);

    const patch: UpdateAdminDto = { ...updateAdminDto };
    if (actor.role !== UserType.SUPER_ADMIN) {
      delete patch.role;
    }
    if (patch.role) {
      await this.userService.updateRole(id, patch.role);
      admin.user.role = patch.role;
      delete patch.role;
    }

    this.adminProfileRepository.merge(admin.profile, patch);

    return this.adminRepository.save(admin);
  }

  // public adminProfileByRole(UserType: AdminParams): object {
  //   return { role: UserType };
  // }

  public async getProfilePictureUrl(
    id: string,
  ): Promise<UploadProfilePictureResponseDto> {
    const admin = await this.adminRepository.findOne({
      where: { id },
      relations: { profile: true },
    });
    if (!admin) throw new NotFoundException(`Admin with id '${id}' not found.`);
    return { profilePictureUrl: admin.profile.profilePictureUrl };
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
      relations: { admin: true },
    });
  }

  public async createAnnouncement(
    createAnnouncementDto: CreateAnnouncementDto,
    adminId: string,
  ): Promise<Announcement> {
    // console.log(createAnnouncementDto);
    const announcement = this.announcementRepository.create({
      title: createAnnouncementDto.title,
      content: createAnnouncementDto.content,
      admin: { id: adminId } as Admin,
    });
    return this.announcementRepository.save(announcement);
  }

  public async deleteAnnouncementById(id: string): Promise<void> {
    const annnouncement = await this.announcementRepository.findOneBy({ id });

    if (!annnouncement) {
      throw new NotFoundException(`Announcement with id '${id}' not found.`);
    }

    await this.announcementRepository.delete(annnouncement);
  }

  public async deleteAdminById(id: string, actor: Actor): Promise<void> {
    if (id === actor.sub) {
      throw new ForbiddenException('You cannot delete your own account.');
    }
    const admin = await this.adminRepository.findOneBy({ id });
    if (!admin) throw new NotFoundException(`Admin with id '${id}' not found.`);
    await this.userService.remove(id);
  }

  private assertSelfOrSuperAdmin(adminId: string, actor: Actor): void {
    if (actor.role !== UserType.SUPER_ADMIN && actor.sub !== adminId) {
      throw new ForbiddenException('You can only access your own resources.');
    }
  }
}
