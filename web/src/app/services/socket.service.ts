import { Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import type { Column, Task } from '../models/task.model';
import type { Board } from '../models/board.model';

export interface AuditEventBase {
  type: 'created' | 'updated' | 'deleted' | 'moved';
  task: Task;
  timestamp: string;
}

export interface AuditMoveEvent extends AuditEventBase {
  type: 'moved';
  fromColumn: Column;
  toColumn: Column;
}

export type AuditEvent = AuditEventBase | AuditMoveEvent;

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

  isMoveEvent(evt: AuditEvent): evt is AuditMoveEvent {
    return evt.type === 'moved';
  }

  connect() {
    this.socket = io('https://dsn-test-production.up.railway.app', {
      transports: ['websocket'],
      autoConnect: false,
    });

    const connectSocket = () => this.socket.connect();

    this.socket.on('connect', () => console.log('WS conectado', this.socket.id));
    this.socket.on('disconnect', () => {
      console.warn('WS desconectado, reintentando en 2s...');
      setTimeout(connectSocket, 2000);
    });

    // Recibimos snapshot completo del board
    this.socket.on('board:snapshot', (board: Board) => this._board.set(board));

    // Solo aplicamos actualizaciones de board, la auditoría viene de audit:new
    this.socket.on(
      'board:update',
      (event: { type: 'created' | 'moved' | 'updated' | 'deleted'; task?: Task; fromColumn?: Column }) => {
        if (!event.task) return;
        this.applyBoardUpdate({ type: event.type, task: event.task });
      }
    );

    // Todos los eventos de auditoría reales vienen de aquí
    this.socket.on('audit:new', async (event: AuditEvent) => {
      if (!event.task) return;

      // Esperamos a tener toda la info de la tarea
      const fullTask = await this.fetchTaskIfNeeded(event.task);

      const auditEvent: AuditEvent =
        event.type === 'moved' && 'fromColumn' in event && 'toColumn' in event
          ? { type: 'moved', task: fullTask, fromColumn: event.fromColumn!, toColumn: event.toColumn!, timestamp: event.timestamp }
          : { type: event.type, task: fullTask, timestamp: event.timestamp };

      // Actualizamos auditoría local
      this._auditLog.update((logs) => [auditEvent, ...logs]);
    });

    connectSocket();
  }

  private async fetchTaskIfNeeded(task: Task): Promise<Task> {
    if (task.title && task.title !== '(sin título)') return task;

    try {
      const res = await fetch(`https://dsn-test-production.up.railway.app/tasks/audit/${task.id}`);
      if (!res.ok) throw new Error('No se pudo cargar task');
      return await res.json();
    } catch (err) {
      console.error('Error al cargar task del audit', task.id, err);
      return { ...task, title: '(sin título)' };
    }
  }

  async fetchInitialBoard() {
    try {
      const res = await fetch('https://dsn-test-production.up.railway.app/tasks/board');
      if (!res.ok) throw new Error('Error cargando tareas');
      const board: Board = await res.json();
      this._board.set(board);
    } catch (err) {
      console.error('Error al cargar el board inicial', err);
    }
  }

  async fetchAuditLog() {
    try {
      const res = await fetch('https://dsn-test-production.up.railway.app/tasks/audit');
      if (!res.ok) throw new Error('Error cargando auditoría');
      const rawAudit: any[] = await res.json();

      const audit: AuditEvent[] = await Promise.all(
        rawAudit.map(async (r) => {
          const task: Task = r.newState
            ? r.newState
            : await this.fetchTaskIfNeeded({ id: r.taskId, title: '(sin título)', column: 'todo', description: '', storyPoints: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });

          if (r.action === 'moved') {
            return {
              type: 'moved',
              task,
              fromColumn: r.previousState?.column ?? 'todo',
              toColumn: r.newState?.column ?? 'todo',
              timestamp: r.timestamp,
            } as AuditMoveEvent;
          } else {
            return { type: r.action, task, timestamp: r.timestamp } as AuditEventBase;
          }
        })
      );

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

    const event: AuditEventBase = { type: 'created', task, timestamp: new Date().toISOString() };

    this._auditLog.update((logs) => [event, ...logs]);

    this.socket.emit('board:update', { type: 'created', task });
    this.socket.emit('audit:new', event);
  }

  moveTask(taskId: string, column: Column) {
    const current = { ...this._board() };
    let movedTask: Task | undefined;
    let fromColumn: Column | undefined;

    (['todo', 'doing', 'done'] as Column[]).forEach((col) => {
      const index = current[col].findIndex((t) => t.id === taskId);
      if (index !== -1) {
        movedTask = { ...current[col][index], column };
        fromColumn = col;
        current[col].splice(index, 1);
      }
    });

    if (movedTask && fromColumn) {
      current[column].push(movedTask);
      this._board.set(current);

      const event: AuditMoveEvent = {
        type: 'moved',
        task: movedTask,
        fromColumn,
        toColumn: column,
        timestamp: new Date().toISOString(),
      };

      this._auditLog.update((logs) => [event, ...logs]);

      this.socket.emit('board:update', { type: 'moved', task: movedTask, fromColumn });
      this.socket.emit('audit:new', event);
    }
  }

  updateTask(task: Task) {
    const current = { ...this._board() };
    (['todo', 'doing', 'done'] as Column[]).forEach((col) => {
      current[col] = current[col].map((t) => (t.id === task.id ? task : t));
    });
    this._board.set(current);

    const event: AuditEventBase = { type: 'updated', task, timestamp: new Date().toISOString() };

    this._auditLog.update((logs) => [event, ...logs]);

    this.socket.emit('board:update', { type: 'updated', task });
    this.socket.emit('audit:new', event);
  }

  removeTask(taskId: string) {
    const current = { ...this._board() };
    let removedTask: Task | undefined;

    (['todo', 'doing', 'done'] as Column[]).forEach((col) => {
      const index = current[col].findIndex((t) => t.id === taskId);
      if (index !== -1) {
        removedTask = current[col][index];
        current[col].splice(index, 1);
      }
    });

    this._board.set(current);
    if (!removedTask) return;

    const event: AuditEventBase = { type: 'deleted', task: removedTask, timestamp: new Date().toISOString() };

    this._auditLog.update((logs) => [event, ...logs]);

    this.socket.emit('board:update', { type: 'deleted', task: removedTask });
    this.socket.emit('audit:new', event);
  }

  // -------------------------
  // Helpers internos
  // -------------------------
  private applyBoardUpdate(event: { type: 'created' | 'moved' | 'updated' | 'deleted'; task: Task }) {
    const task = event.task;
    const current = { ...this._board() };

    (['todo', 'doing', 'done'] as Column[]).forEach((col) => {
      current[col] = current[col].filter((t) => t.id !== task.id);
    });

    if (event.type !== 'deleted') {
      const targetCol: Column = ['todo', 'doing', 'done'].includes(task.column) ? task.column : 'todo';
      current[targetCol].push(task);
    }

    this._board.set(current);
  }
}
