import { Injectable } from '@nestjs/common';
import { CreateAdminDto } from './dto/create-admin.dto';
import { AdminRole } from './admin-role.model';

@Injectable()
export class AdminService {
  public createAdmin(createAdminDto: CreateAdminDto): object {
    return { ...createAdminDto };
  }
  public adminProfileByRole(adminRole: AdminRole): object {
    return { role: adminRole }; // mock
  }
}
