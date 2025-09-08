export type Column = 'todo' | 'doing' | 'done';

export interface Task {
  id: string;
  title: string;
  description?: string;
  storyPoints: number;   
  column: 'todo' | 'doing' | 'done'; 
  createdAt: string;
  updatedAt: string;
}


