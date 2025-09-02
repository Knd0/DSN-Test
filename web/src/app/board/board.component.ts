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
  template: `
    <div class="p-4 bg-gray-900 min-h-screen text-white">
      <h1 class="text-3xl font-bold mb-6 text-center tracking-wide">🚀 Mini Kanban</h1>

      <!-- Buscar -->
      <input
        type="text"
        [(ngModel)]="searchText"
        placeholder="Buscar tareas..."
        class="mb-6 p-3 w-full md:w-1/3 rounded text-black border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <!-- Crear nueva tarea -->
      <form (ngSubmit)="createTask()" class="mb-6 flex justify-center gap-2 flex-wrap">
        <input
          type="text"
          [(ngModel)]="newTaskTitle"
          name="title"
          placeholder="Título de la tarea..."
          class="p-3 rounded w-64 text-black border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <input
          type="text"
          [(ngModel)]="newTaskDescription"
          name="description"
          placeholder="Descripción..."
          class="p-3 rounded w-64 text-black border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          class="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 transition-shadow shadow-md"
        >
          Agregar
        </button>
      </form>

      <!-- Tablero -->
      <div class="flex gap-6 flex-wrap md:flex-nowrap">
        <div
          *ngFor="let col of columns"
          class="flex-1 p-4 rounded-xl shadow-lg transition-transform hover:scale-[1.02]"
          [ngClass]="columnColors[col]"
        >
          <div class="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
            <h2 class="text-xl font-semibold capitalize tracking-wide">{{ col }}</h2>
            <span class="bg-gray-700 text-sm px-2 py-1 rounded-full">
              {{ filteredBoard()[col]?.length || 0 }}
            </span>
          </div>

          <div
            *ngIf="filteredBoard()[col]"
            cdkDropList
            [id]="col"
            [cdkDropListData]="filteredBoard()[col]"
            [cdkDropListConnectedTo]="getConnectedCols(col)"
            class="min-h-[150px] flex flex-col gap-3"
            (cdkDropListDropped)="drop($event, col)"
          >
            <div
              *ngFor="let task of filteredBoard()[col]"
              cdkDrag
              class="bg-gray-700 p-3 rounded-lg shadow hover:bg-gray-600 transition flex justify-between items-center cursor-pointer"
              (click)="openModal(task)"
            >
              <div class="truncate max-w-[80%]">{{ task.title }}</div>
              <span class="text-gray-400 text-xs">{{ task.createdAt | date:'shortTime' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div *ngIf="modalTask" class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div class="bg-gray-800 rounded-2xl p-6 w-96 shadow-lg transform transition-transform duration-300 scale-100">
        <h3 class="text-2xl font-bold mb-4">{{ isEditing ? 'Editar Tarea' : modalTask.title }}</h3>

        <p *ngIf="!isEditing" class="mb-4 text-gray-300">{{ modalTask.description || 'Sin descripción' }}</p>

        <div *ngIf="isEditing" class="flex flex-col gap-2">
          <input type="text" [(ngModel)]="modalTask.title" class="p-2 rounded text-black w-full" />
          <textarea [(ngModel)]="modalTask.description" rows="4" class="p-2 rounded text-black w-full" placeholder="Descripción"></textarea>
        </div>

        <div class="flex justify-end gap-2 mt-4">
          <button *ngIf="!isEditing" class="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700" (click)="isEditing = true">Editar</button>
          <button *ngIf="isEditing" class="bg-green-600 px-4 py-2 rounded hover:bg-green-700" (click)="updateTask()">Guardar</button>
          <button class="bg-red-600 px-4 py-2 rounded hover:bg-red-700" (click)="confirmDelete()">Eliminar</button>
          <button class="bg-gray-600 px-4 py-2 rounded hover:bg-gray-700" (click)="closeModal()">Cerrar</button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .cdk-drag-preview { box-shadow: 0 5px 15px rgba(0,0,0,0.5); border-radius: 0.75rem; transform: rotate(2deg); }
      .cdk-drag-placeholder { opacity: 0.3; }
      .cdk-drag { transition: transform 0.3s ease; }
      .cdk-drop-list-dragging { background-color: rgba(255, 255, 255, 0.05); transition: background-color 0.2s ease; }
    `
  ]
})
export class BoardComponent implements OnInit {
  columns: Column[] = ['todo', 'doing', 'done'];
  newTaskTitle = '';
  newTaskDescription = '';
  searchText = '';
  modalTask: Task | null = null;
  isEditing = false;

  columnColors: Record<Column, string> = {
    todo: 'bg-purple-800',
    doing: 'bg-yellow-800',
    done: 'bg-green-800',
  };

  constructor(public socket: SocketService) {}

  ngOnInit() {
    this.socket.connect();
  }

  filteredBoard() {
    const board = this.socket.board();
    const filtered: Record<Column, Task[]> = { todo: [], doing: [], done: [] };
    (['todo','doing','done'] as Column[]).forEach(col => {
      filtered[col] = board[col].filter(t => t.title.toLowerCase().includes(this.searchText.toLowerCase()));
    });
    return filtered;
  }

  getConnectedCols(col: Column) {
    return this.columns.filter(c => c !== col);
  }

  createTask() {
    if (!this.newTaskTitle.trim()) return;
    fetch('https://dsn-test-production.up.railway.app/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: this.newTaskTitle, description: this.newTaskDescription }),
    })
      .then(res => res.json())
      .then((task: Task) => {
        this.socket.addTask(task);
      });
    this.newTaskTitle = '';
    this.newTaskDescription = '';
  }

  drop(event: CdkDragDrop<Task[]>, targetCol: Column) {
    const task = event.previousContainer.data[event.previousIndex];
    if (task.column === targetCol) return;

    transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);

    fetch(`https://dsn-test-production.up.railway.app/tasks/${task.id}/move`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ column: targetCol }),
    }).then(() => {
      this.socket.moveTask(task.id, targetCol);
    });
  }

  openModal(task: Task) { this.modalTask = { ...task }; this.isEditing = false; }
  closeModal() { this.modalTask = null; this.isEditing = false; }

  updateTask() {
    if (!this.modalTask) return;
    const taskId = this.modalTask.id;
    const updatedTask = { ...this.modalTask };

    // Actualizar UI local
    this.socket.updateTask(updatedTask);

    // Persistir backend
    fetch(`https://dsn-test-production.up.railway.app/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: updatedTask.title, description: updatedTask.description }),
    }).then(() => {
    });

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
    }).then(result => {
      if (result.isConfirmed) this.deleteTask();
    });
  }

  deleteTask() {
    if (!this.modalTask) return;
    const taskId = this.modalTask.id;

    fetch(`https://dsn-test-production.up.railway.app/tasks/${taskId}`, { method: 'DELETE' })
      .then(() => {
        this.socket.removeTask(taskId);
        this.closeModal();
      });
  }
}
