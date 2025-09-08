import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskEntity } from './task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { Column } from './task-column.enum';
import { UserEntity } from 'src/users/user.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(TaskEntity)
    private readonly taskRepo: Repository<TaskEntity>,
  ) {}

  async findBoard() {
    const tasks = await this.taskRepo.find();
    return {
      todo: tasks.filter((t) => t.column === 'todo'),
      doing: tasks.filter((t) => t.column === 'doing'),
      done: tasks.filter((t) => t.column === 'done'),
    };
  }

  async create(dto: CreateTaskDto, creator: UserEntity): Promise<TaskEntity> {
  const task = this.taskRepo.create({
    title: dto.title,
    description: dto.description,
    column: Column.TODO,       // enum o string
    storyPoints: dto.storyPoints ?? 1,
    createdBy: creator,
  });

  return this.taskRepo.save(task);
}


  async move(id: string, dto: MoveTaskDto) {
    const task = await this.taskRepo.findOne({ where: { id } });
    if (!task) throw new NotFoundException(`Task ${id} not found`);
    task.column = dto.column;
    return this.taskRepo.save(task);
  }

  async update(id: string, dto: Partial<CreateTaskDto>) {
    const task = await this.taskRepo.findOne({ where: { id } });
    if (!task) throw new NotFoundException(`Task ${id} not found`);
    Object.assign(task, dto);
    return this.taskRepo.save(task);
  }

  async delete(id: string) {
    const task = await this.taskRepo.findOne({ where: { id } });
    if (!task) throw new NotFoundException(`Task ${id} not found`);
    return this.taskRepo.remove(task);
  }
}
