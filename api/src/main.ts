import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(
    helmet({
      crossOriginResourcePolicy: false,
    }),
  );

  // Habilitar CORS solo para tus dominios
  app.enableCors({
    origin: ['http://localhost:4200', 'https://dsn-test.vercel.app'],
    methods: ['GET', 'POST'],
    credentials: true,
  });

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
