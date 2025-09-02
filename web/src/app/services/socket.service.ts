import { Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import type { Column, Task } from '../models/task.model';
import type { Board } from '../models/board.model';

@Injectable({ providedIn: 'root' })
export class SocketService {
  socket!: Socket;
  private _board = signal<Board>({ todo: [], doing: [], done: [] });

  board() {
    return this._board();
  }

  connect() {
    this.socket = io('http://localhost:3000', { autoConnect: false });

    const connectSocket = () => this.socket.connect();

    this.socket.on('connect', () => console.log('WS conectado', this.socket.id));

    this.socket.on('disconnect', () => {
      console.warn('WS desconectado, reintentando en 2s...');
      setTimeout(connectSocket, 2000);
    });

    // snapshot inicial
    this.socket.on('board:snapshot', (board: Board) => {
      this._board.set(board);
    });

    // actualizaciones en tiempo real
    this.socket.on('board:update', (event: { type: 'created' | 'moved'; task: Task }) => {
      const current = { ...this._board() };
      const task = event.task;

      // eliminar de todas las columnas
      (['todo', 'doing', 'done'] as Column[]).forEach((col) => {
        current[col] = current[col].filter((t) => t.id !== task.id);
      });

      // agregar a la columna correspondiente
      current[task.column].push(task);

      this._board.set(current);
    });

    connectSocket();
  }
}
