export type Column = 'todo' | 'doing' | 'done';

export interface Task {
  id: string;
  title: string;
  description?: string;
  column: 'todo' | 'doing' | 'done';
  storyPoints: number; // nueva
  createdBy?: { id: string; name: string }; // nueva
  assignedTo?: { id: string; name: string }; // nueva
  createdAt: string;
  updatedAt: string;
}

