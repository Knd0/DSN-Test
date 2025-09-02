// tasks.module.ts
import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { WsGateway } from '../ws.gateway'; // 👈 ajustá la ruta según tu carpeta

@Module({
  controllers: [TasksController],
  providers: [TasksService, WsGateway], // 👈 agregado acá
})
export class TasksModule {}
