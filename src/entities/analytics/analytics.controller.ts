import { Controller, Get, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserType } from 'src/auth/user-type.enum';
import { AnalyticsService } from './analytics.service';

interface RequestWithUser extends Request {
  user: {
    sub: string;
    email: string;
    role: string;
  };
}

@Controller('/v1/api/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('admin')
  @Roles(UserType.ADMIN)
  admin(@Query('range') range?: string) {
    return this.analyticsService.admin(range);
  }

  @Get('me')
  @Roles(UserType.RIDER, UserType.DRIVER)
  me(@Req() req: RequestWithUser, @Query('range') range?: string) {
    return this.analyticsService.me(req.user.sub, req.user.role, range);
  }
}
