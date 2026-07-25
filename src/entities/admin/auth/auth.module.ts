// import { Module } from '@nestjs/common';
// import { AuthService } from './auth.service';
// import { AuthController } from './auth.controller';
// import { JwtModule } from '@nestjs/jwt';
// import { AdminModule } from '../admin.module';
// // import { AdminService } from '../admin/admin.service';

// @Module({
//   imports: [
//     JwtModule.register({
//       secret: process.env.JWT_SECRET,
//       signOptions: {
//         expiresIn: (process.env.JWT_EXPIRES_IN as unknown as number) ?? '60m',
//       },
//     }),
//     AdminModule,
//   ],
//   controllers: [AuthController],
//   providers: [AuthService],
// })
// export class AuthModule {}
