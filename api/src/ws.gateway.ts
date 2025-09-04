import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { OnModuleInit } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { Task } from './tasks/task.model'; // o TaskEntity según uses en frontend
import { TasksService } from './tasks/tasks.service';
import { WsJwtGuard } from './ws-jwt.guard';

interface Board {
  todo: Task[];
  doing: Task[];
  done: Task[];
}

@Injectable()
@UseGuards(WsJwtGuard)
@WebSocketGateway({ cors: { origin: '*' } })
export class WsGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit
{
  @WebSocketServer() server!: Server;

  private board: Board = { todo: [], doing: [], done: [] };

  constructor(private readonly tasksService: TasksService) {}

  // Cargar board desde la DB al iniciar
  async onModuleInit() {
  try {
    const boardEntities = await this.tasksService.findBoard();
    // mapear a Task con fechas en string
    this.board = {
      todo: boardEntities.todo.map(t => ({ ...t, createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString() })),
      doing: boardEntities.doing.map(t => ({ ...t, createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString() })),
      done: boardEntities.done.map(t => ({ ...t, createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString() })),
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
  handleUpdate(
    @MessageBody()
    event: { type: 'created' | 'moved' | 'updated' | 'deleted'; task: Task },
    @ConnectedSocket() client: Socket
  ) {
    this.applyUpdate(event);
    client.broadcast.emit('board:update', event);
  }

  public emitUpdate(event: { type: 'created' | 'moved' | 'updated' | 'deleted'; task: Task }) {
    this.applyUpdate(event);
    this.server.emit('board:update', event);
  }

  private applyUpdate(event: { type: 'created' | 'moved' | 'updated' | 'deleted'; task: Task }) {
    const task = event.task;

    // eliminar de todas las columnas
    (['todo', 'doing', 'done'] as (keyof Board)[]).forEach((col) => {
      this.board[col] = this.board[col].filter((t) => t.id !== task.id);
    });

    // si no es eliminado, agregar nuevamente
    if (event.type !== 'deleted') {
      this.board[task.column].push(task);
    }
  }

  public getBoardSnapshot(): Board {
    return this.board;
  }
}
