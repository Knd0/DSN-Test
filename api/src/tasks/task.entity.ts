// task.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column as ColumnType,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Column } from './task-column.enum';

@Entity('tasks')
export class TaskEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ColumnType({ length: 255 })
  title: string;

  @ColumnType({ type: 'text', nullable: true })
  description?: string;

  @ColumnType({ type: 'enum', enum: Column, default: Column.TODO })
  column: Column;

  @ColumnType({ type: 'int', default: 0 })
  storyPoints: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
