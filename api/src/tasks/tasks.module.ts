// tasks.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { WsGateway } from '../ws.gateway';
import { TaskEntity } from './task.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TaskEntity])], // ✅ IMPORTANTE
  controllers: [TasksController],
  providers: [TasksService, WsGateway],
})
export class TasksModule {}
