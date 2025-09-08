// user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { TaskEntity } from '../tasks/task.entity';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ default: 'Usuario' })
  name: string;

  @OneToMany(() => TaskEntity, (task) => task.createdBy)
  createdTasks: TaskEntity[];

  @OneToMany(() => TaskEntity, (task) => task.assignedTo)
  assignedTasks: TaskEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
