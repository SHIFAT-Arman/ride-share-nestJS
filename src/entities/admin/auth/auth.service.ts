import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Admin } from '../admin.entity';
import { AdminService } from '../admin.service';
import { CreateAdminDto } from '../dto/create-admin.dto';
import { PasswordService } from '../password/password.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly adminService: AdminService,
    private readonly passwordService: PasswordService,
  ) {}

  public async register(createAdminDto: CreateAdminDto) {
    console.log(createAdminDto);
    const existingAdmin = await this.adminService.findOneByEmail(
      createAdminDto.email,
    );

    if (existingAdmin) {
      throw new ConflictException('Admin already exists with this email');
    }

    const admin = await this.adminService.createAdmin(createAdminDto);

    // return the user
    // return user and token
    // return token only

    return admin;
  }

  public async login(email: string, password: string): Promise<string> {
    const admin = await this.adminService.findOneByEmail(email);

    //no user
    // password incorrect
    if (!admin) {
      throw new UnauthorizedException('Invalid Credentials');
    }
    if (!(await this.passwordService.verify(password, admin.password))) {
      throw new UnauthorizedException('Invalid Credentials');
    }

    return this.generateToken(admin);
  }

  private generateToken(admin: Admin): string {
    const payload = { sub: admin.id, role: admin.role };
    return this.jwtService.sign(payload); //creating payload
  }
}
