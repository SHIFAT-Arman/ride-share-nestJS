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
import { ChangePasswordDto } from './dto/change-password.dto';
import { AdminFilterParams } from './params/find-admin.params';
import { CreateAnnouncementDto } from './announcement/create-announcement.dto';
import { Announcement } from './announcement/announcement.entity';
import { FindAnnouncementParams } from './params/find-announcement.params';

import { UserService } from '../user/user.service';
import { UserType } from 'src/auth/user-type.enum';
import { PusherService } from '../common/pusher.service';

type Actor = { sub: string; role: UserType };

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,

    @InjectRepository(Announcement)
    private readonly announcementRepository: Repository<Announcement>,

    private readonly profilePictureService: ProfilePictureService,
    private readonly userService: UserService,
    private readonly pusherService: PusherService,
  ) {}

  public async getAdminList(
    filter: AdminFilterParams,
  ): Promise<[Admin[], number]> {
    const where: FindOptionsWhere<Admin> = {};

    if (filter.joiningDate) {
      where.joiningDate = filter.joiningDate;
    }
    if (filter.country) {
      where.country = ILike(`%${filter.country}%`);
    }
    if (filter.firstName) {
      where.firstName = ILike(`%${filter.firstName}%`);
    }
    if (filter.lastName) {
      where.lastName = ILike(`%${filter.lastName}%`);
    }
    if (filter.role) {
      where.user = { role: filter.role };
    }
    if (filter.id) {
      where.id = filter.id;
    }

    return await this.adminRepository.findAndCount({
      where,
      skip: filter.offset,
      take: filter.limit,
      order: {
        createdAt: 'ASC',
      },
      relations: { user: true },
    });
  }

  public async getAdminById(id: string): Promise<Admin> {
    const admin = await this.adminRepository.findOne({
      where: { id },
      relations: { user: true },
    });
    if (!admin) {
      throw new NotFoundException(`Admin with id '${id}' not found.`);
    }
    return admin;
  }

  public async createAdmin(createAdminDto: CreateAdminDto): Promise<Admin> {
    const { email, password, ...profile } = createAdminDto;
    // ponytail: user row can orphan if this save fails; wrap in a transaction if that starts happening
    const user = await this.userService.create(email, password, UserType.ADMIN);

    const admin = this.adminRepository.create({
      ...profile,
      id: user.id,
      user,
    });
    return this.adminRepository.save(admin);
  }

  public async updateAdminById(
    id: string,
    updateAdminDto: UpdateAdminDto,
  ): Promise<Admin> {
    const admin = await this.adminRepository.findOne({
      where: { id },
      relations: { user: true },
    });
    if (!admin) throw new NotFoundException(`Admin with id '${id}' not found.`);

    const { email, ...profile } = updateAdminDto;
    if (email) await this.userService.updateEmail(id, email);
    this.adminRepository.merge(admin, profile);

    const saved = await this.adminRepository.save(admin);
    if (email) saved.user.email = email;
    return saved;
  }

  public async changePassword(
    id: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    const admin = await this.adminRepository.findOneBy({ id });
    if (!admin) throw new NotFoundException(`Admin with id '${id}' not found.`);

    await this.userService.changePassword(
      id,
      changePasswordDto.oldPassword,
      changePasswordDto.newPassword,
    );
  }

  public async uploadProfilePicture(
    id: string,
    file: Express.Multer.File,
  ): Promise<UploadProfilePictureResponseDto> {
    const admin = await this.adminRepository.findOneBy({ id });
    if (!admin) throw new NotFoundException(`Admin with id '${id}' not found.`);

    const profilePictureUrl = await this.profilePictureService.replace(
      admin.profilePictureUrl ?? null,
      file,
      'admins',
    );
    this.adminRepository.merge(admin, {
      profilePictureUrl,
    });
    await this.adminRepository.save(admin);
    return { profilePictureUrl };
  }

  public async getAnnouncements(
    filter: FindAnnouncementParams,
  ): Promise<[Announcement[], number]> {
    const where: FindOptionsWhere<Announcement> = {};
    const adminId = filter.adminId ?? filter.adminProfileId;
    if (adminId) {
      where.admin = { id: adminId } as Admin;
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
    const announcement = this.announcementRepository.create({
      title: createAnnouncementDto.title,
      content: createAnnouncementDto.content,
      targetRoles: createAnnouncementDto.targetRoles,
      admin: { id: adminId } as Admin,
    });
    const saved = await this.announcementRepository.save(announcement);

    const payload = {
      id: saved.id,
      title: saved.title,
      content: saved.content,
      createdAt: saved.createdAt,
      targetRoles: saved.targetRoles,
    };

    // Send to each selected role channel, e.g. rider-notifications
    for (const role of saved.targetRoles) {
      await this.pusherService.trigger(
        `${role}-notifications`,
        'new-announcement',
        payload,
      );
    }

    return saved;
  }

  public async deleteAnnouncementById(id: string): Promise<void> {
    const annnouncement = await this.announcementRepository.findOneBy({ id });

    if (!annnouncement) {
      throw new NotFoundException(`Announcement with id '${id}' not found.`);
    }

    await this.announcementRepository.remove(annnouncement);
  }

  public async deleteAdminById(id: string, actor: Actor): Promise<void> {
    if (id === actor.sub) {
      throw new ForbiddenException('You cannot delete your own account.');
    }
    const admin = await this.adminRepository.findOneBy({ id });
    if (!admin) throw new NotFoundException(`Admin with id '${id}' not found.`);
    await this.userService.remove(id);
  }

  private assertSelfOrAdmin(adminId: string, actor: Actor): void {
    if (actor.role !== UserType.ADMIN && actor.sub !== adminId) {
      throw new ForbiddenException('You can only access your own resources.');
    }
  }
}
