export type Column = 'todo' | 'doing' | 'done';

export interface Task {
  id: string;
  title: string;
  description?: string;
  column: 'todo' | 'doing' | 'done';
  storyPoints: number; // nueva
  createdBy?: { id: string; username: string }; // nueva
  assignedTo?: { id: string; username: string }; // nueva
  createdAt: string;
  updatedAt: string;
}

