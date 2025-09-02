export type Column = 'todo' | 'doing' | 'done';

export interface Task {
  id: string;
  title: string;
  description?: string;
  column: Column;
  createdAt: string;
  updatedAt: string;
}
