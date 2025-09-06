import { Entity, PrimaryGeneratedColumn, Column as ORMColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { UserEntity } from '../users/user.entity';
import { Column as TaskColumn } from './task-column.enum'; // enum 'todo' | 'doing' | 'done'

@Entity('tasks')
export class TaskEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ORMColumn()
  title: string;

  @ORMColumn({ nullable: true })
  description?: string;

  @ORMColumn({ type: 'enum', enum: TaskColumn, default: TaskColumn.TODO })
  column: TaskColumn;

  @ORMColumn({ type: 'int', default: 1 })
  storyPoints: number;

  @ManyToOne(() => UserEntity, { nullable: true })
  createdBy?: UserEntity;

  @ManyToOne(() => UserEntity, { nullable: true })
  assignedTo?: UserEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
