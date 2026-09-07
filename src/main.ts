import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true, // rejects unknown query params
    }),
  );

  // cookie parser as global middleware
  app.use(cookieParser());

  // CORS as global middleware
  app.enableCors({
    origin: 'http://localhost:3001',
    methods: 'GET,HEAD,POST,PUT,PATCH,DELETE',
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
