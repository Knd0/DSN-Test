# 📝 DSN Mini-Kanban

## 🚀 Descripción

Mini-Kanban en **tiempo real** con tres columnas: To-do / Doing / Done. Los usuarios pueden **crear, mover y eliminar tareas**, y todos los cambios se reflejan en todos los navegadores conectados.

---

## 📂 Estructura del repositorio

```
/api          → Backend en NestJS (API + WS Gateway)
/web          → Frontend en Angular 17 (standalone)
README.md     → Documentación
DB.png        → Diagrama de la base de datos
```

---

## ⚙️ Instalación y ejecución

### 🔧 Requisitos

* Node.js 20+
* PostgreSQL 15+
* Angular CLI 17+
* NestJS CLI 11+

### 1️⃣ Backend (NestJS)

```bash
cd api
npm install
npm run start:dev
```

La API corre en `http://localhost:3000`.

#### Endpoints

| Método | Ruta                  | Descripción              |
| ------ | --------------------- | ------------------------ |
| POST   | /tasks                | Crear tarea              | 
| PATCH  | /tasks/\:id/move      | Mover tarea              |
| PATCH  | /tasks/\:id           | Editar tarea             | 
| DELETE | /tasks/\:id           | Eliminar tarea           |
| GET    | /tasks/board          | Obtener tablero completo |
| GET    | /tasks/audit          | Auditoría completa       | 
| GET    | /tasks/audit/\:taskId | Auditoría por tarea      |

#### WebSocket

| Evento          | Descripción                                            |
| --------------- | ------------------------------------------------------ |
| board\:snapshot | Estado completo al conectar                            |
| board\:update   | Actualización de tareas (create, move, update, delete) |
| audit\:new      | Evento de auditoría en tiempo real                     |

---

### 2️⃣ Frontend (Angular 17)

```bash
cd web
npm install
ng serve
```

App corre en `http://localhost:4200`.

Características:

* Tablero con 3 columnas
* Crear tareas con formulario
* Mover tareas (Drag & Drop)
* Auditoría en tiempo real
* Búsqueda y filtrado de tareas

---

## 🛠️ Modelo de datos

### Task

```ts
export interface Task {
  id: string;
  title: string;
  description?: string;
  storyPoints: number;
  column: 'todo' | 'doing' | 'done';
  createdAt: string;
  updatedAt: string;
}
```

### AuditLog

```ts
export class AuditLog {
  id: string;
  taskId: string;
  action: 'created' | 'updated' | 'moved' | 'deleted';
  previousState?: any;
  newState?: any;
  timestamp: Date;
}
```

### Diagrama de la base de datos

![Diagrama de la base de datos](/DB.png)

---

## 🛠️ Decisiones de diseño

1. **Estado global:** Señales de Angular + `SocketService` para sincronización en tiempo real.
2. **Reconexión automática:** Cliente reintenta conectar si se pierde WebSocket.
3. **Auditoría:** Cada acción sobre tareas genera un `AuditLog`.
4. **Enum de columnas:** `'todo' | 'doing' | 'done'` para consistencia backend/frontend.
5. **UI/UX:** Diseño simple, responsivo y accesible.

---

## 📊 Ejemplo de flujo de auditoría

| Timestamp | Tarea    | Acción  | 
| --------- | -------- | ------- | 
| 12:01     | Crear UI | created | 
| 12:05     | Crear UI | moved   | 
| 12:10     | Crear UI | updated | 
| 12:15     | Crear UI | deleted | 

---

## 🤖 Uso de IA

Se utilizó **ChatGPT** para:

* Generar DTOs y validaciones con ValidationPipe
* Ejemplos de Angular 17 con drag & drop y socket.io
* Optimización de auditoría y sincronización en tiempo real

---

## 📌 Próximas mejoras

* Autenticación básica por usuario
* Filtrado avanzado de tareas
* Notificaciones visuales para auditoría
* Dashboard de métricas y estadísticas
