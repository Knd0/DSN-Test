import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  
} from '@nestjs/websockets';
import {Injectable} from '@nestjs/common'
import { Server, Socket } from 'socket.io';
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

  // Board central en el servidor
  private board: Board = { todo: [], doing: [], done: [] };

  /**
   * Un cliente se conecta
   */
  handleConnection(client: Socket) {
    console.log('Cliente conectado:', client.id);
    // enviar snapshot completo al nuevo cliente
    client.emit('board:snapshot', this.board);
  }

  /**
   * Cliente desconectado
   */
  handleDisconnect(client: Socket) {
    console.log('Cliente desconectado:', client.id);
  }

  /**
   * Recibe actualizaciones desde clientes
   */
  @SubscribeMessage('board:update')
  handleUpdate(
    @MessageBody() event: { type: 'created' | 'moved' | 'updated' | 'deleted'; task: Task },
    @ConnectedSocket() client: Socket
  ) {
    this.applyUpdate(event);
    // emitir a todos los demás clientes
    client.broadcast.emit('board:update', event);
  }

  /**
   * Método público para emitir actualizaciones desde un Controller u otro servicio
   */
  public emitUpdate(event: { type: 'created' | 'moved' | 'updated' | 'deleted'; task: Task }) {
    this.applyUpdate(event);
    this.server.emit('board:update', event);
  }

  /**
   * Actualiza el board central en memoria
   */
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

  /**
   * Permite que un controller obtenga el board actual
   */
  public getBoardSnapshot(): Board {
    return this.board;
  }
}
