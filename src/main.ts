import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import {
  assertCookieEnv,
  frontendOriginAllowlist,
} from './frontend-origins';

async function bootstrap() {
  assertCookieEnv();
  const allowlist = frontendOriginAllowlist();

  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true, // rejects unknown query params
    }),
  );

  app.use(cookieParser());

  if (config.get<string>('TRUST_PROXY') === 'true') {
    app.getHttpAdapter().getInstance().set('trust proxy', 1);
  }

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean | string) => void,
    ) => {
      // Non-browser / same-origin clients omit Origin
      if (!origin) {
        callback(null, true);
        return;
      }
      if (allowlist.has(origin)) {
        callback(null, origin);
        return;
      }
      callback(null, false);
    },
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  await app.listen(config.get<string>('PORT') ?? 3000);
}
bootstrap();
