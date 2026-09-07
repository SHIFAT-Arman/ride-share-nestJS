import {
  ConflictException,
  Injectable,
  NotFoundException,
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
    const existing = await this.findByEmail(email);

    if (existing && existing.id !== id) {
      throw new ConflictException('Email already registered');
    }

    await this.userRepository.update(id, { email });
  }

  public async updateRole(id: string, role: UserType): Promise<void> {
    await this.userRepository.update(id, { role });
  }

  public async softDelete(id: string): Promise<void> {
    const result = await this.userRepository.softDelete(id);

    if (!result.affected) {
      throw new NotFoundException(`User with id '${id}' not found.`);
    }
  }

  public async remove(id: string): Promise<void> {
    const user = await this.userRepository.findOneBy({ id });

    if (!user) {
      throw new NotFoundException(`User with id '${id}' not found.`);
    }

    await this.userRepository.remove(user);
  }
}
