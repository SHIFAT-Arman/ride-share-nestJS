import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Admin } from '../admin.entity';
import { AdminService } from '../admin.service';
import { CreateAdminDto } from '../dto/create-admin.dto';
import { PasswordService } from '../password/password.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(EmailService.name);
  constructor(
    private readonly jwtService: JwtService,
    private readonly adminService: AdminService,
    private readonly passwordService: PasswordService,
    private readonly emailService: EmailService,
  ) {}

  public async register(createAdminDto: CreateAdminDto) {
    // console.log(createAdminDto);

    const existingAdmin = await this.adminService.findOneByEmail(
      createAdminDto.email,
    );

    if (existingAdmin) {
      throw new ConflictException('Admin already exists with this email');
    }

    const admin = await this.adminService.createAdmin(createAdminDto);

    try {
      await this.emailService.sendEmail({
        recipients: [admin.email],
        subject: 'Welcome!',
        // text: `Hi ${admin.profile.firstName}, your account has been created.`,
        html: `<p>Hi ${admin.profile.firstName}, your account has been created.</p> <br> Please Login.`,
      });
    } catch (error) {
      this.logger.log('Error sending email:', error);
    }

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
