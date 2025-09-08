// web/src/app/components/board.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  DragDropModule,
  CdkDragDrop,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import Swal from 'sweetalert2';
import { SocketService } from '../services/socket.service';
import { AuthService, User } from '../services/auth.service';
import type { Column, Task } from '../models/task.model';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  template: `
    <div
      class="p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-black min-h-screen text-white"
    >
      <h1
        class="text-4xl font-extrabold mb-8 text-center tracking-wide bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent"
      >
        DSN Kanban
      </h1>

      <!-- Buscar -->
      <div class="flex justify-center mb-8">
        <div class="relative w-full md:w-1/3">
          <input
            type="text"
            [(ngModel)]="searchText"
            placeholder="Buscar tareas..."
            class="pl-10 pr-4 py-3 w-full rounded-xl text-gray-900 border border-gray-700 shadow focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <i
            class="fa-solid fa-magnifying-glass absolute left-3 top-3.5 text-gray-400"
          ></i>
        </div>
      </div>

      <!-- Crear nueva tarea -->
      <form
        (ngSubmit)="createTask()"
        class="mb-10 flex justify-center gap-3 flex-wrap"
      >
        <input
          type="text"
          [(ngModel)]="newTaskTitle"
          name="title"
          placeholder="Título de la tarea..."
          class="p-3 rounded-xl w-64 text-gray-900 border border-gray-700 shadow focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
        />
        <input
          type="text"
          [(ngModel)]="newTaskDescription"
          name="description"
          placeholder="Descripción..."
          class="p-3 rounded-xl w-64 text-gray-900 border border-gray-700 shadow focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <input
          type="number"
          [(ngModel)]="newTaskStorypoints"
          name="storypoints"
          placeholder="Story Points"
          min="0"
          class="p-3 rounded-xl w-32 text-gray-900 border border-gray-700 shadow focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
        />
        <button
          type="submit"
          class="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-3 rounded-xl hover:opacity-90 transition shadow-lg"
        >
          <i class="fa-solid fa-plus"></i>
          Agregar
        </button>
      </form>

      <!-- Tablero -->
      <div class="flex gap-6 flex-wrap md:flex-nowrap">
        <div
          *ngFor="let col of columns"
          class="flex-1 bg-gray-800/80 backdrop-blur-sm p-4 rounded-2xl shadow-xl transition-transform hover:scale-[1.02]"
        >
          <div
            class="flex justify-between items-center mb-4 border-b border-gray-700 pb-2"
          >
            <h2 class="text-lg font-bold capitalize tracking-wide">
              {{ col }}
            </h2>
            <span class="bg-gray-700 text-sm px-2 py-1 rounded-full shadow">{{
              filteredBoard[col]?.length || 0
            }}</span>
          </div>

          <div
            *ngIf="filteredBoard[col]"
            cdkDropList
            [id]="col"
            [cdkDropListData]="filteredBoard[col]"
            [cdkDropListConnectedTo]="getConnectedCols(col)"
            class="min-h-[200px] flex flex-col gap-3"
            (cdkDropListDropped)="drop($event, col)"
          >
            <div
              *ngFor="let task of filteredBoard[col]"
              cdkDrag
              class="bg-gray-700/90 p-4 rounded-xl shadow-md hover:bg-gray-600/90 transition cursor-pointer flex flex-col gap-1"
              (click)="openModal(task)"
            >
              <div class="truncate max-w-[80%] font-medium">
                {{ task.title }}
              </div>
              <span
                class="text-gray-400 text-xs group-hover:text-indigo-300 transition"
                >{{ task.createdAt | date : 'shortTime' }}</span
              >
              <span *ngIf="task.assignedTo" class="text-indigo-300 text-xs"
                >Asignado a: {{ task.assignedTo.name }}</span
              >
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div
      *ngIf="modalTask"
      class="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-50"
    >
      <div
        class="bg-gray-800 rounded-2xl p-6 w-96 shadow-2xl transform transition-all duration-300 scale-100 border border-gray-700"
      >
        <h3 class="text-2xl font-bold mb-4 text-indigo-400">
          {{ isEditing ? 'Editar Tarea' : modalTask.title }}
        </h3>

        <p *ngIf="!isEditing" class="mb-4 text-gray-300">
          {{ modalTask.description || 'Sin descripción' }}
        </p>

        <div *ngIf="isEditing" class="flex flex-col gap-3">
          <input
            type="text"
            [(ngModel)]="modalTask.title"
            class="p-3 rounded-xl text-gray-900 w-full focus:ring-2 focus:ring-indigo-500"
          />
          <textarea
            [(ngModel)]="modalTask.description"
            rows="4"
            class="p-3 rounded-xl text-gray-900 w-full focus:ring-2 focus:ring-indigo-500"
            placeholder="Descripción"
          ></textarea>

          <label class="text-gray-300">Asignar a:</label>
          <select
            [(ngModel)]="modalTask.assignedTo"
            class="p-3 rounded-xl text-gray-900 w-full focus:ring-2 focus:ring-indigo-500"
          >
            <option [ngValue]="null">-- Ninguno --</option>
            <option *ngFor="let user of availableUsers" [ngValue]="user">
              {{ user.name }}
            </option>
          </select>
        </div>

        <div class="flex justify-end gap-2 mt-6">
          <button
            *ngIf="!isEditing"
            class="flex items-center gap-1 bg-indigo-600 px-4 py-2 rounded-xl hover:bg-indigo-700 transition"
            (click)="isEditing = true"
          >
            <i class="fa-solid fa-pencil"></i> Editar
          </button>
          <button
            *ngIf="isEditing"
            class="flex items-center gap-1 bg-green-600 px-4 py-2 rounded-xl hover:bg-green-700 transition"
            (click)="updateTask()"
          >
            <i class="fa-solid fa-check"></i> Guardar
          </button>
          <button
            class="flex items-center gap-1 bg-red-600 px-4 py-2 rounded-xl hover:bg-red-700 transition"
            (click)="confirmDelete()"
          >
            <i class="fa-solid fa-trash"></i> Eliminar
          </button>
          <button
            class="flex items-center gap-1 bg-gray-600 px-4 py-2 rounded-xl hover:bg-gray-700 transition"
            (click)="closeModal()"
          >
            <i class="fa-solid fa-x"></i> Cerrar
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .cdk-drag-preview {
        box-shadow: 0 5px 25px rgba(0, 0, 0, 0.6);
        border-radius: 1rem;
        transform: rotate(2deg) scale(1.05);
      }
      .cdk-drag-placeholder {
        opacity: 0.2;
      }
      .cdk-drag {
        transition: transform 0.2s ease;
      }
      .cdk-drop-list-dragging {
        background-color: rgba(255, 255, 255, 0.05);
        transition: background-color 0.2s ease;
        border-radius: 0.75rem;
      }
    `,
  ],
})
export class BoardComponent implements OnInit {
  columns: Column[] = ['todo', 'doing', 'done'];
  newTaskTitle = '';
  newTaskDescription = '';
  newTaskStorypoints = 0;
  searchText = '';
  modalTask: Task | null = null;
  isEditing = false;
  availableUsers: User[] = [];

  constructor(public socket: SocketService, private auth: AuthService) {}

  async ngOnInit() {
    this.socket.connect();
    await this.loadUsers();
  }

  async loadUsers() {
    try {
      const res = await fetch(
        'https://dsn-test-production.up.railway.app/users',
        {
          headers: { Authorization: `Bearer ${this.auth.token()}` },
        }
      );
      if (!res.ok) throw new Error('Error cargando usuarios');
      this.availableUsers = await res.json();
    } catch (err) {
      console.error('Error cargando usuarios', err);
      // fallback si falla
      this.availableUsers = [];
    }
  }

  get filteredBoard(): Record<Column, Task[]> {
    const board = this.socket.board();
    const filtered: Record<Column, Task[]> = { todo: [], doing: [], done: [] };
    this.columns.forEach((col) => {
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
      storypoints: this.newTaskStorypoints,
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
