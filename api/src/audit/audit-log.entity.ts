import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  taskId: string;

  @Column()
  action: 'created' | 'updated' | 'moved' | 'deleted';

  @Column({ type: 'json', nullable: true })
  previousState?: any;

  @Column({ type: 'json', nullable: true })
  newState?: any;

  @CreateDateColumn()
  timestamp: Date;
}
