import { Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import type { Column, Task } from '../models/task.model';
import type { Board } from '../models/board.model';

export interface AuditEvent {
  type: 'created' | 'moved' | 'updated' | 'deleted';
  task: Task;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class SocketService {
  socket!: Socket;
  private _board = signal<Board>({ todo: [], doing: [], done: [] });
  private _auditLog = signal<AuditEvent[]>([]);

  board() {
    return this._board();
  }

  auditLog() {
    return this._auditLog();
  }

  connect() {
    this.socket = io('https://dsn-test-production.up.railway.app', {
      transports: ['websocket'],
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

    // snapshot inicial del board
    this.socket.on('board:snapshot', (board: Board) => {
      this._board.set(board);
    });

    // actualizaciones en tiempo real
    this.socket.on(
      'board:update',
      (event: { type: 'created' | 'moved' | 'updated' | 'deleted'; task: Task }) => {
        this.applyBoardUpdate(event);

        const newEvent: AuditEvent = {
          ...event,
          timestamp: new Date().toISOString(),
        };
        this._auditLog.update((logs) => [newEvent, ...logs]);
      }
    );

    // eventos de auditoría nuevos desde WS
    this.socket.on('audit:new', (event: AuditEvent) => {
      this._auditLog.update((logs) => [event, ...logs]);
    });

    connectSocket();
  }

  // -------------------------
  // HTTP Fetch inicial
  // -------------------------
  async fetchInitialBoard() {
    try {
      const res = await fetch(
        'https://dsn-test-production.up.railway.app/tasks/board'
      );
      if (!res.ok) throw new Error('Error cargando tareas');

      const board: Board = await res.json();
      this._board.set(board);
    } catch (err) {
      console.error('Error al cargar el board inicial', err);
    }
  }

  async fetchAuditLog() {
    try {
      const res = await fetch(
        'https://dsn-test-production.up.railway.app/tasks/audit'
      );
      if (!res.ok) throw new Error('Error cargando auditoría');

      const audit: AuditEvent[] = await res.json();
      this._auditLog.set(audit);
    } catch (err) {
      console.error('Error al cargar auditoría', err);
    }
  }

  async fetchInitialData() {
    await this.fetchInitialBoard();
    await this.fetchAuditLog();
  }

  // -------------------------
  // Métodos de manipulación de tareas
  // -------------------------
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

  // -------------------------
  // Helpers internos
  // -------------------------
  private applyBoardUpdate(event: {
    type: 'created' | 'moved' | 'updated' | 'deleted';
    task: Task;
  }) {
    const task = event.task;

    // eliminar de todas las columnas
    const current = { ...this._board() };
    (['todo', 'doing', 'done'] as Column[]).forEach((col) => {
      current[col] = current[col].filter((t) => t.id !== task.id);
    });

    // si no es eliminado, agregar nuevamente
    if (event.type !== 'deleted') {
      current[task.column].push(task);
    }

    this._board.set(current);
  }
}
