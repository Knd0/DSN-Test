import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { Task } from './tasks/task.model';

interface Board {
  todo: Task[];
  doing: Task[];
  done: Task[];
}

@Injectable()
@WebSocketGateway({ cors: { origin: '*' } })
export class WsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server!: Server;

  // <-- el board central en el servidor
  private board: Board = { todo: [], doing: [], done: [] };

  handleConnection(client: Socket) {
    console.log('Cliente conectado:', client.id);

    // enviar el board actual al usuario que se conecta
    client.emit('board:snapshot', this.board);
  }

  handleDisconnect(client: Socket) {
    console.log('Cliente desconectado:', client.id);
  }

  // recibir actualizaciones de los clientes
  @SubscribeMessage('board:update')
  handleUpdate(
    @MessageBody()
    event: { type: 'created' | 'moved' | 'updated' | 'deleted'; task: Task },
    @ConnectedSocket() client: Socket
  ) {
    const task = event.task;

    // eliminar de todas las columnas
    (['todo', 'doing', 'done'] as (keyof Board)[]).forEach((col) => {
      this.board[col] = this.board[col].filter((t) => t.id !== task.id);
    });

    // si es created, moved o updated, agregar nuevamente
    if (['created', 'moved', 'updated'].includes(event.type)) {
      this.board[task.column].push(task);
    }

    // emitir la actualización a todos excepto el que envió
    client.broadcast.emit('board:update', event);
  }
}
