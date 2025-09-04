import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { WsGateway } from '../ws.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskEntity } from './task.entity';
import { KeycloakModule } from '../keycloak.module';

@Module({
  imports: [TypeOrmModule.forFeature([TaskEntity]), KeycloakModule],
  controllers: [TasksController],
  providers: [TasksService, WsGateway],
})
export class TasksModule {}
