import type { Task, Column } from './task.model';

export interface Board {
  todo: Task[];
  doing: Task[];
  done: Task[];
}

// Opcional: helper para iterar las columnas
export const allColumns: Column[] = ['todo', 'doing', 'done'];
