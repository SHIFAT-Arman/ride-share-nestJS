import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { SendEmailDto } from './send-email.dto';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = this.createTransport();
  }

  private createTransport() {
    const port = this.configService.get<number>('SMTP_PORT');
    return nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port,
      secure: port === 465,
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASSWORD'),
      },
    });
  }

  public async sendEmail(sendEmailDto: SendEmailDto) {
    const { recipients, subject, text, html } = sendEmailDto;

    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('SMTP_FROM'),
        to: recipients,
        subject,
        text,
        html,
      });
      this.logger.log(`Email sent to ${recipients} with subject: ${subject}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${recipients}`, error);
      throw new InternalServerErrorException('Failed to send email');
    }
  }
}
