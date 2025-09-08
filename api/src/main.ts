// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(
    helmet({
      crossOriginResourcePolicy: false,
    }),
  );
  app.enableCors({
    origin: ['http://localhost:4200', 'https://dsn-test.vercel.app'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );

  await app.listen(process.env.PORT || 3000, '0.0.0.0'); // 👈 importante para Railway
}
bootstrap();
