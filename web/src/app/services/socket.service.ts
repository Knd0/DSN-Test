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
    this.socket = io('https://dsn-test-production.up.railway.app', {
      autoConnect: false,
    });

    const connectSocket = () => this.socket.connect();

    this.socket.on('connect', () =>
      console.log('WS conectado', this.socket.id)
    );

    this.socket.on('disconnect', () => {
      console.warn('WS desconectado, reintentando en 2s...');
      setTimeout(connectSocket, 2000);
    });

    // snapshot inicial
    this.socket.on('board:snapshot', (board: Board) => {
      console.log('Board inicial recibido por socket:', board);
      this._board.set(board);
    });

    // actualizaciones en tiempo real
    this.socket.on(
      'board:update',
      (event: {
        type: 'created' | 'moved' | 'updated' | 'deleted';
        task: Task;
      }) => {
        const current = { ...this._board() };
        const task = event.task;

        (['todo', 'doing', 'done'] as Column[]).forEach((col) => {
          current[col] = current[col].filter((t) => t.id !== task.id);
        });

        if (['created', 'moved', 'updated'].includes(event.type)) {
          current[task.column].push(task);
        }

        this._board.set(current);
      }
    );

    connectSocket();
  }

  addTask(task: Task) {
    const current = { ...this._board() };
    current[task.column].push(task);
    this._board.set(current);
    this.socket.emit('board:update', { type: 'created', task });
  }

  moveTask(taskId: string, column: Column) {
    const current = { ...this._board() };
    let movedTask: Task | undefined;

    (['todo', 'doing', 'done'] as Column[]).forEach((col) => {
      const index = current[col].findIndex((t) => t.id === taskId);
      if (index !== -1) {
        movedTask = { ...current[col][index], column };
        current[col].splice(index, 1);
      }
    });

    if (movedTask) {
      current[column].push(movedTask);
      this._board.set(current);
      this.socket.emit('board:update', { type: 'moved', task: movedTask });
    }
  }

  updateTask(task: Task) {
    const current = { ...this._board() };
    (['todo', 'doing', 'done'] as Column[]).forEach((col) => {
      current[col] = current[col].map((t) => (t.id === task.id ? task : t));
    });
    this._board.set(current);
    this.socket.emit('board:update', { type: 'updated', task });
  }

  removeTask(taskId: string) {
    const current = { ...this._board() };
    (['todo', 'doing', 'done'] as Column[]).forEach((col) => {
      current[col] = current[col].filter((t) => t.id !== taskId);
    });
    this._board.set(current);
    this.socket.emit('board:update', {
      type: 'deleted',
      task: { id: taskId } as Task,
    });
  }

  // -------------------------------------
  // Fetch inicial desde el backend (corregido)
  // -------------------------------------
  async fetchInitialBoard() {
    try {
      const res = await fetch(
        'https://dsn-test-production.up.railway.app/tasks/board'
      );
      if (!res.ok) throw new Error('Error cargando tareas');

      // ahora recibimos un Board completo
      const board: Board = await res.json();
      console.log('Board inicial recibido:', board);

      // asignar directamente al signal
      this._board.set(board);
    } catch (err) {
      console.error('Error al cargar el board inicial', err);
    }
  }
}
