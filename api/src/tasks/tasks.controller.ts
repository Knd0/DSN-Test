import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Delete,
} from '@nestjs/common';
import { Task } from './task.model';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { WsGateway } from '../ws.gateway';

@Controller('tasks')
export class TasksController {
  constructor(
    private readonly tasks: TasksService,
    private readonly ws: WsGateway,
  ) {}

  @Get('/board')
  getBoard() {
    return this.tasks.findBoard();
  }

  @Post()
  create(@Body() dto: CreateTaskDto) {
    const task = this.tasks.create(dto);
    this.ws.emitUpdate({ type: 'created', task });
    return task;
  }

  @Patch(':id/move')
  move(@Param('id') id: string, @Body() dto: MoveTaskDto) {
    const task = this.tasks.move(id, dto);
    this.ws.emitUpdate({ type: 'moved', task });
    return task;
  }

  // PATCH /tasks/:id
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateTaskDto>) {
    const task = this.tasks.update(id, dto);
    this.ws.emitUpdate({ type: 'updated', task });
    return task;
  }

  // DELETE /tasks/:id
  @Delete(':id')
  remove(@Param('id') id: string) {
    const task = this.tasks.remove(id);
    this.ws.emitUpdate({ type: 'deleted', task });
    return { success: true };
  }
}
