import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop, transferArrayItem } from '@angular/cdk/drag-drop';
import Swal from 'sweetalert2';
import { SocketService } from '../services/socket.service';
import type { Column, Task } from '../models/task.model';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.css'],
})
export class BoardComponent implements OnInit {
  columns: Column[] = ['todo', 'doing', 'done'];
  newTaskTitle = '';
  newTaskDescription = '';
  searchText = '';
  modalTask: Task | null = null;
  isEditing = false;

  constructor(public socket: SocketService) {}

  async ngOnInit() {
    this.socket.connect();
  }

  get filteredBoard(): Record<Column, Task[]> {
    const board = this.socket.board();
    const filtered: Record<Column, Task[]> = { todo: [], doing: [], done: [] };
    (['todo', 'doing', 'done'] as Column[]).forEach((col) => {
      filtered[col] = board[col].filter((task) =>
        task.title.toLowerCase().includes(this.searchText.toLowerCase())
      );
    });
    return filtered;
  }

  createTask() {
    if (!this.newTaskTitle.trim()) return;
    const newTask: Task = {
      id: crypto.randomUUID(),
      title: this.newTaskTitle,
      description: this.newTaskDescription,
      column: 'todo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.socket.addTask(newTask);
    this.newTaskTitle = '';
    this.newTaskDescription = '';
  }

  drop(event: CdkDragDrop<Task[]>, targetCol: Column) {
    const task = event.previousContainer.data[event.previousIndex];
    if (task.column === targetCol) return;

    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex
    );

    this.socket.moveTask(task.id, targetCol);
  }

  openModal(task: Task) {
    this.modalTask = { ...task };
    this.isEditing = false;
  }

  closeModal() {
    this.modalTask = null;
    this.isEditing = false;
  }

  updateTask() {
    if (!this.modalTask) return;
    this.socket.updateTask(this.modalTask);
    this.closeModal();
  }

  confirmDelete() {
    if (!this.modalTask) return;
    Swal.fire({
      title: '¿Estás seguro?',
      text: '¡No podrás revertir esto!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) this.deleteTask();
    });
  }

  deleteTask() {
    if (!this.modalTask) return;
    this.socket.removeTask(this.modalTask.id);
    this.closeModal();
  }

  getConnectedCols(col: Column): string[] {
    return this.columns.filter((c) => c !== col);
  }
}
