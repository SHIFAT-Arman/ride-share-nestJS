import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DriverService } from '../driver.service';
import { CreateDriverDto } from '../dto/create-driver.dto';
import { DriverEntity } from '../driver.entity';
import { PasswordService } from 'src/entities/admin/password/password.service';
import { EmailService } from 'src/entities/admin/email/email.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly driverService: DriverService,
    private readonly passwordService: PasswordService,
    private readonly emailService: EmailService,
  ) {}

  public async register(createDriverDto: CreateDriverDto) {
    const existingDriver = await this.driverService.findOneByEmail(
      createDriverDto.email,
    );

    if (existingDriver) {
      throw new ConflictException('Driver already exists with this email');
    }

    const driver = await this.driverService.createDriver(createDriverDto);

    // try {
    //   await this.emailService.sendEmail({
    //     recipients: [admin.email],
    //     subject: 'Welcome!',
    //     // text: `Hi ${admin.profile.firstName}, your account has been created.`,
    //     html: `<p>Hi ${admin.profile.firstName}, your account has been created.</p> <br> Please Login.`,
    //   });
    // } catch (error) {
    //   this.logger.log('Error sending email:', error);
    // }

    // return the user
    // return user and token
    // return token only

    return driver;
  }

  public async login(email: string, password: string): Promise<string> {
    const driver = await this.driverService.findOneByEmail(email);

    //no user
    // password incorrect
    if (!driver) {
      throw new UnauthorizedException('Invalid Credentials');
    }
    if (!(await this.passwordService.verify(password, driver.password))) {
      throw new UnauthorizedException('Invalid Credentials');
    }

    return this.generateToken(driver);
  }

  private generateToken(driver: DriverEntity): string {
    const payload = { sub: driver.id, role: 'driver' };
    return this.jwtService.sign(payload); //creating payload
  }
}
