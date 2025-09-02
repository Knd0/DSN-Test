import { Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import type { BoardState, Task } from '../models/task';


@Injectable({ providedIn: 'root' })
export class WsService {
private socket!: Socket;


board = signal<BoardState>({ todo: [], doing: [], done: [] });
connected = signal(false);


connect() {
// Ajustá la URL si corrés el backend en otro host/puerto
this.socket = io('https://www.dsn-test-production.up.railway.app/', { transports: ['websocket'] });


this.socket.on('connect', () => this.connected.set(true));
this.socket.on('disconnect', () => this.connected.set(false));


this.socket.on('board:snapshot', (payload: BoardState) => {
this.board.set(payload);
});


this.socket.on('board:update', (evt: { type: 'created' | 'moved'; task: Task }) => {
// Por hoy no implementamos; lo haremos cuando existan endpoints reales.
// Dejamos el handler preparado para Día 3/4.
console.log('board:update', evt);
});
}
}