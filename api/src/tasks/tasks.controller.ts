import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { WsGateway } from '../ws.gateway';
import type { Task } from './task.model';
import type { TaskEntity } from './task.entity';
import { Roles, Resource, RoleMatchingMode, RoleGuard, AuthGuard } from 'nest-keycloak-connect';

@Controller('tasks')
@Resource('tasks') // nombre del recurso en Keycloak
@UseGuards(AuthGuard, RoleGuard) // activa autenticación y roles
export class TasksController {
  constructor(
    private readonly tasks: TasksService,
    private readonly ws: WsGateway,
  ) {}

  // Solo usuarios con rol "user" pueden acceder
  @Get('/board')
  @Roles({ roles: ['user'], mode: RoleMatchingMode.ANY })
  async getBoard() {
    return this.tasks.findBoard();
  }

  @Post()
  @Roles({ roles: ['user'], mode: RoleMatchingMode.ANY })
  async create(@Body() dto: CreateTaskDto) {
    const entity: TaskEntity = await this.tasks.create(dto);
    const task: Task = this.mapEntityToTask(entity);
    this.ws.emitUpdate({ type: 'created', task });
    return task;
  }

  @Patch(':id/move')
  @Roles({ roles: ['user'], mode: RoleMatchingMode.ANY })
  async move(@Param('id') id: string, @Body() dto: MoveTaskDto) {
    const entity: TaskEntity = await this.tasks.move(id, dto);
    const task: Task = this.mapEntityToTask(entity);
    this.ws.emitUpdate({ type: 'moved', task });
    return task;
  }

  @Patch(':id')
  @Roles({ roles: ['user'], mode: RoleMatchingMode.ANY })
  async update(@Param('id') id: string, @Body() dto: Partial<CreateTaskDto>) {
    const entity: TaskEntity = await this.tasks.update(id, dto);
    const task: Task = this.mapEntityToTask(entity);
    this.ws.emitUpdate({ type: 'updated', task });
    return task;
  }

  @Delete(':id')
  @Roles({ roles: ['user'], mode: RoleMatchingMode.ANY })
  async delete(@Param('id') id: string) {
    const entity: TaskEntity = await this.tasks.delete(id);
    const task: Task = this.mapEntityToTask(entity);
    this.ws.emitUpdate({ type: 'deleted', task });
    return task;
  }

  private mapEntityToTask(entity: TaskEntity): Task {
    return {
      id: entity.id,
      title: entity.title,
      description: entity.description,
      column: entity.column,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
