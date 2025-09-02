import { OnGatewayConnection, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Task } from './tasks/task.model';


@WebSocketGateway({ cors: { origin: '*' } })
export class WsGateway implements OnGatewayConnection {
  @WebSocketServer() server!: Server;

  handleConnection(client: Socket) {
    client.emit('board:snapshot', { todo: [], doing: [], done: [] });
  }

  emitUpdate(event: { type: 'created' | 'moved'; task: Task }) {
    this.server.emit('board:update', event);
  }
}
