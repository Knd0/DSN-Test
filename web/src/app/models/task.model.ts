// web/src/app/models/task.model.ts
export type Column = 'todo' | 'doing' | 'done';

export interface Task {
  id: string;
  title: string;
  description?: string;
  column: Column;
  storyPoints?: number;
  createdAt: string;
  updatedAt: string;
  assignedTo?: { id: string; name: string }; // nuevo
}