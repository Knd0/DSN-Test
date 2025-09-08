import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Delete,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { WsGateway } from '../ws.gateway';
import type { Task } from './task.model';
import type { TaskEntity } from './task.entity';
import type { UserEntity } from '../users/user.entity';
import { User } from '../users/user.decorator'; // decorador que devuelve el usuario logueado

@Controller('tasks')
export class TasksController {
  constructor(
    private readonly tasks: TasksService,
    private readonly ws: WsGateway,
  ) {}

  @Get('/board')
  async getBoard() {
    return this.tasks.findBoard();
  }

  @Post()
  async create(@Body() dto: CreateTaskDto, @User() user: UserEntity) {
    const entity: TaskEntity = await this.tasks.create(dto, user);
    const task: Task = this.mapEntityToTask(entity);
    this.ws.emitUpdate({ type: 'created', task });
    return task;
  }

  @Patch(':id/move')
  async move(@Param('id') id: string, @Body() dto: MoveTaskDto) {
    const entity: TaskEntity = await this.tasks.move(id, dto);
    const task: Task = this.mapEntityToTask(entity);
    this.ws.emitUpdate({ type: 'moved', task });
    return task;
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: Partial<CreateTaskDto>) {
    const entity: TaskEntity = await this.tasks.update(id, dto);
    const task: Task = this.mapEntityToTask(entity);
    this.ws.emitUpdate({ type: 'updated', task });
    return task;
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    const entity: TaskEntity = await this.tasks.delete(id);
    const task: Task = this.mapEntityToTask(entity);
    this.ws.emitUpdate({ type: 'deleted', task });
    return task;
  }

  // -------------------------
  // Helper: mapear TaskEntity a Task plano
  // -------------------------
  private mapEntityToTask(entity: TaskEntity): Task {
    return {
      id: entity.id,
      title: entity.title,
      description: entity.description,
      column: entity.column,
      storyPoints: entity.storyPoints,
      createdBy: entity.createdBy
        ? { id: entity.createdBy.id, name: entity.createdBy.name }
        : undefined,
      assignedTo: entity.assignedTo
        ? { id: entity.assignedTo.id, name: entity.assignedTo.name }
        : undefined,

      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
