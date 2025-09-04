import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar pipes globales para validación DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // elimina propiedades no declaradas en DTO
      forbidNonWhitelisted: true, // lanza error si hay propiedades extra
      transform: true, // transforma payload a clases DTO
    }),
  );

  // CORS para que Angular pueda conectarse
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:4200',
    credentials: true,
  });

  await app.listen(process.env.PORT || 3000);
  console.log(`Server running on port ${process.env.PORT || 3000}`);
}
bootstrap();
