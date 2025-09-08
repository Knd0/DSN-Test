import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { OnModuleInit, Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { Task } from './tasks/task.model';
import { TasksService } from './tasks/tasks.service';
import { AuditLogService } from './audit/audit-log.service';
import type { TaskEntity } from './tasks/task.entity';

interface Board {
  todo: Task[];
  doing: Task[];
  done: Task[];
}

@Injectable()
@WebSocketGateway({ cors: { origin: '*' } })
export class WsGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit
{
  @WebSocketServer() server!: Server;

  private board: Board = { todo: [], doing: [], done: [] };

  constructor(
    private readonly tasksService: TasksService,
    private readonly auditService: AuditLogService,
  ) {}

  async onModuleInit() {
    const boardEntities = await this.tasksService.findBoard();
    const mapTask = (t: TaskEntity, col: keyof Board): Task => ({
      id: t.id,
      title: t.title,
      description: t.description,
      column: col,
      storyPoints: t.storyPoints ?? 0,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    });

    this.board = {
      todo: boardEntities.todo.map((t) => mapTask(t, 'todo')),
      doing: boardEntities.doing.map((t) => mapTask(t, 'doing')),
      done: boardEntities.done.map((t) => mapTask(t, 'done')),
    };
  }

  handleConnection(client: Socket) {
    client.emit('board:snapshot', this.board);
  }

  handleDisconnect(client: Socket) {}

  @SubscribeMessage('board:update')
  async handleUpdate(
    @MessageBody()
    event: { type: 'created' | 'moved' | 'updated' | 'deleted'; task: Task },
    @ConnectedSocket() client: Socket,
  ) {
    const previousState = this.getPreviousState(event.task.id);

    await this.auditService.createLog({
      taskId: event.task.id,
      action: event.type,
      previousState: previousState || null,
      newState: event.type === 'deleted' ? null : event.task,
    });

    this.applyUpdate(event);
    client.broadcast.emit('board:update', event);

    this.server.emit('audit:new', {
      taskId: event.task.id,
      action: event.type,
      previousState,
      newState: event.type === 'deleted' ? null : event.task,
      timestamp: new Date(),
    });
  }

  public emitUpdate(event: { type: 'created' | 'moved' | 'updated' | 'deleted'; task: Task }) {
    this.applyUpdate(event);
    this.server.emit('board:update', event);
  }

  private applyUpdate(event: { type: 'created' | 'moved' | 'updated' | 'deleted'; task: Task }) {
    const task = event.task;
    (['todo', 'doing', 'done'] as (keyof Board)[]).forEach((col) => {
      this.board[col] = this.board[col].filter((t) => t.id !== task.id);
    });
    if (event.type !== 'deleted') {
      this.board[task.column].push(task);
    }
  }

  private getPreviousState(taskId: string) {
    for (const col of ['todo', 'doing', 'done'] as (keyof Board)[]) {
      const task = this.board[col].find((t) => t.id === taskId);
      if (task) return { ...task };
    }
    return null;
  }

  public getBoardSnapshot(): Board {
    return this.board;
  }
}
