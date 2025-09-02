export type Column = 'todo' | 'doing' | 'done';


export interface Task {
id: string;
title: string;
description?: string;
column: Column;
createdAt: string; // ISO
updatedAt: string; // ISO
}


export interface BoardState {
todo: Task[];
doing: Task[];
done: Task[];
}