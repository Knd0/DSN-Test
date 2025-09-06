import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { OnModuleInit } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { Task } from './tasks/task.model';
import { TasksService } from './tasks/tasks.service';
import type { TaskEntity } from './tasks/task.entity';
import type { UserEntity } from './users/user.entity';

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

  constructor(private readonly tasksService: TasksService) {}

  // -------------------------
  // Helper: mapear UserEntity a {id, username}
  // -------------------------
  private mapUser(user?: UserEntity): { id: string; username: string } | undefined {
    return user ? { id: user.id, username: user.name } : undefined;
  }

  // Cargar board desde la DB al iniciar
  async onModuleInit() {
    try {
      const boardEntities = await this.tasksService.findBoard();
      const mapTask = (t: TaskEntity): Task => ({
        id: t.id,
        title: t.title,
        description: t.description,
        column: t.column,
        storyPoints: t.storyPoints,
        createdBy: this.mapUser(t.createdBy),
        assignedTo: this.mapUser(t.assignedTo),
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      });

      this.board = {
        todo: boardEntities.todo.map(mapTask),
        doing: boardEntities.doing.map(mapTask),
        done: boardEntities.done.map(mapTask),
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
