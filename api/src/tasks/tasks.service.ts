import { Injectable, NotFoundException } from '@nestjs/common';
import { Task } from './task.model';
import { CreateTaskDto } from './dto/create-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { v4 as uuid } from 'uuid';

@Injectable()
export class TasksService {
  private tasks: Task[] = [];

  findBoard() {
    return {
      todo: this.tasks.filter(t => t.column === 'todo'),
      doing: this.tasks.filter(t => t.column === 'doing'),
      done: this.tasks.filter(t => t.column === 'done'),
    };
  }

  create(dto: CreateTaskDto): Task {
    const now = new Date().toISOString();
    const task: Task = {
      id: uuid(),
      title: dto.title,
      description: dto.description,
      column: 'todo',
      createdAt: now,
      updatedAt: now,
    };
    this.tasks.push(task);
    return task;
  }

  move(id: string, dto: MoveTaskDto): Task {
    const task = this.tasks.find(t => t.id === id);
    if (!task) throw new NotFoundException(`Task ${id} not found`);
    task.column = dto.column;
    task.updatedAt = new Date().toISOString();
    return task;
  }

  update(id: string, dto: Partial<CreateTaskDto>): Task {
  const task = this.tasks.find(t => t.id === id);
  if (!task) throw new NotFoundException(`Task ${id} not found`);
  if (dto.title !== undefined) task.title = dto.title;
  if (dto.description !== undefined) task.description = dto.description;
  task.updatedAt = new Date().toISOString();
  return task;
}

remove(id: string): Task {
  const index = this.tasks.findIndex(t => t.id === id);
  if (index === -1) throw new NotFoundException(`Task ${id} not found`);
  const [task] = this.tasks.splice(index, 1);
  return task;
}
}
