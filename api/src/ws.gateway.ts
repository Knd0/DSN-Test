import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { Task } from './tasks/task.model'; // o TaskEntity según tu implementación
import { TasksService } from './tasks/tasks.service';
import { AuditLogService } from './audit/audit-log.service';

interface Board {
  todo: Task[];
  doing: Task[];
  done: Task[];
}

@Injectable()
@WebSocketGateway({ cors: { origin: ['http://localhost:4200', 'https://dsn-test.vercel.app'], methods: ['GET', 'POST'],
    credentials: true, } })
export class WsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server!: Server;

  private board: Board = { todo: [], doing: [], done: [] };

  constructor(
    private readonly tasksService: TasksService,
    private readonly auditService: AuditLogService,
  ) {}

  // Cargar board desde la DB al iniciar
  async onModuleInit() {
    try {
      const boardEntities = await this.tasksService.findBoard();
      this.board = {
        todo: boardEntities.todo.map((t) => ({
          ...t,
          createdAt: t.createdAt.toISOString(),
          updatedAt: t.updatedAt.toISOString(),
        })),
        doing: boardEntities.doing.map((t) => ({
          ...t,
          createdAt: t.createdAt.toISOString(),
          updatedAt: t.updatedAt.toISOString(),
        })),
        done: boardEntities.done.map((t) => ({
          ...t,
          createdAt: t.createdAt.toISOString(),
          updatedAt: t.updatedAt.toISOString(),
        })),
      };
      console.log('Board cargado desde DB:', this.board);
    } catch (err) {
      console.error('Error cargando board inicial:', err);
    }
  }

  handleConnection(client: Socket) {
    console.log('Cliente conectado:', client.id);
    client.emit('board:snapshot', this.board);
  }

  handleDisconnect(client: Socket) {
    console.log('Cliente desconectado:', client.id);
  }

  @SubscribeMessage('board:update')
  async handleUpdate(
    @MessageBody()
    event: { type: 'created' | 'moved' | 'updated' | 'deleted'; task: Task },
    @ConnectedSocket() client: Socket,
  ) {
    const previousState = this.getPreviousState(event.task.id);

    // Guardar en auditoría
    await this.auditService.createLog({
      taskId: event.task.id,
      action: event.type,
      previousState: previousState || null,
      newState: event.task,
    });

    // Aplicar cambios al board
    this.applyUpdate(event);

    // Emitir a todos los clientes excepto quien envió
    client.broadcast.emit('board:update', event);

    // Emitir también evento de auditoría
    this.server.emit('audit:new', {
      taskId: event.task.id,
      action: event.type,
      previousState,
      newState: event.task,
      timestamp: new Date(),
    });
  }

  public emitUpdate(event: {
    type: 'created' | 'moved' | 'updated' | 'deleted';
    task: Task;
  }) {
    this.applyUpdate(event);
    this.server.emit('board:update', event);
  }

  private applyUpdate(event: {
    type: 'created' | 'moved' | 'updated' | 'deleted';
    task: Task;
  }) {
    const task = event.task;

    // eliminar task de todas las columnas
    (['todo', 'doing', 'done'] as (keyof Board)[]).forEach((col) => {
      this.board[col] = this.board[col].filter((t) => t.id !== task.id);
    });

    // si no es eliminado, agregar nuevamente
    if (event.type !== 'deleted') {
      this.board[task.column].push(task);
    }
  }

  private getPreviousState(taskId: string) {
    const allCols: (keyof Board)[] = ['todo', 'doing', 'done'];
    for (const col of allCols) {
      const task = this.board[col].find((t) => t.id === taskId);
      if (task) return { ...task };
    }
    return null;
  }

  public getBoardSnapshot(): Board {
    return this.board;
  }
}
