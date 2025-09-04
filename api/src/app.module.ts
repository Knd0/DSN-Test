import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksModule } from './tasks/tasks.module';
import { TaskEntity } from './tasks/task.entity';
import { KeycloakModule } from './keycloak.module';

@Module({
  imports: [
    KeycloakModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [TaskEntity],
      synchronize: true, // Solo para dev; para producción usar migrations
      ssl: {
        rejectUnauthorized: false, // necesario para Railway/PostgreSQL remoto
      },
    }),

    TasksModule,
  ],
})
export class AppModule {}
