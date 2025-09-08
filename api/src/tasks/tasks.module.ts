import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { TaskEntity } from './task.entity';
import { WsGateway } from '../ws.gateway';
import { AuditLogModule } from '../audit/audit-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TaskEntity]),
    AuditLogModule,
  ],
  providers: [TasksService, WsGateway],
  controllers: [TasksController],
  exports: [TasksService],
})
export class TasksModule {}
