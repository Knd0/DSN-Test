import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
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
}
