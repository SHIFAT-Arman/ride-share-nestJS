import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PasswordService } from '../common/password.service';
import { User } from './user.entity';
import { UserType } from 'src/auth/user-type.enum';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly passwordService: PasswordService,
  ) {}

  public async findByEmail(
    email: string,
    withPassword = false,
  ): Promise<User | null> {
    const qb = this.userRepository
      .createQueryBuilder('user')
      .where('user.email = :email', { email });

    if (withPassword) {
      qb.addSelect('user.password');
    }

    return qb.getOne();
  }

  public async changePassword(
    id: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.id = :id', { id })
      .getOne();

    if (!user) {
      throw new NotFoundException(`User with id '${id}' not found.`);
    }

    if (!(await this.passwordService.verify(oldPassword, user.password))) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    await this.userRepository.update(id, {
      password: await this.passwordService.hash(newPassword),
    });
  }

  public async create(
    email: string,
    password: string,
    role: UserType,
  ): Promise<User> {
    if (await this.findByEmail(email)) {
      throw new ConflictException('Email already registered');
    }

    const user = this.userRepository.create({
      email,
      password: await this.passwordService.hash(password),
      role,
    });

    return this.userRepository.save(user);
  }

  public async updateEmail(id: string, email: string): Promise<void> {
    await this.restoreIfSoftDeleted(id);

    const existing = await this.findByEmail(email);

    if (existing && existing.id !== id) {
      throw new ConflictException('Email already registered');
    }

    await this.userRepository.update(id, { email });
  }

  public async updateRole(id: string, role: UserType): Promise<void> {
    await this.restoreIfSoftDeleted(id);
    await this.userRepository.update(id, { role });
  }

  public async softDelete(id: string): Promise<void> {
    const result = await this.userRepository.softDelete(id);

    if (!result.affected) {
      throw new NotFoundException(`User with id '${id}' not found.`);
    }
  }

  /** Undo a soft-delete so dual rider/driver accounts survive a sibling delete. */
  public async restoreIfSoftDeleted(id: string): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id },
      withDeleted: true,
    });
    if (!user) return false;
    if (user.deletedAt) {
      await this.userRepository.recover(user);
    }
    return true;
  }

  /** Restore a soft-deleted login by email (legacy dual-profile delete damage). */
  public async restoreByEmailIfSoftDeleted(email: string): Promise<boolean> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .withDeleted()
      .where('user.email = :email', { email })
      .andWhere('user.deletedAt IS NOT NULL')
      .getOne();
    if (!user) return false;
    await this.userRepository.recover(user);
    return true;
  }

  /**
   * Soft-delete the users row only when no other live profile remains.
   * Otherwise keep the account and set role to the remaining profile.
   */
  public async softDeleteOrKeepForSibling(
    id: string,
    siblingAlive: boolean,
    keepAs: UserType,
  ): Promise<void> {
    if (siblingAlive) {
      await this.restoreIfSoftDeleted(id);
      await this.userRepository.update(id, { role: keepAs });
      return;
    }
    await this.softDelete(id);
  }

  public async remove(id: string): Promise<void> {
    const user = await this.userRepository.findOneBy({ id });

    if (!user) {
      throw new NotFoundException(`User with id '${id}' not found.`);
    }

    await this.userRepository.remove(user);
  }
}
