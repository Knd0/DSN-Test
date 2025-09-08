// web/src/app/pages/login.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div
      class="flex items-center justify-center min-h-screen bg-gray-900 text-white"
    >
      <form
        (ngSubmit)="login()"
        class="bg-gray-800 p-8 rounded-xl w-80 flex flex-col gap-4"
      >
        <h2 class="text-2xl font-bold mb-4 text-center">Login</h2>

        <input
          type="text"
          [(ngModel)]="name"
          name="name"
          placeholder="Usuario"
          class="p-2 rounded bg-gray-700"
          required
        />
        <input
          type="password"
          [(ngModel)]="password"
          name="password"
          placeholder="Contraseña"
          class="p-2 rounded bg-gray-700"
          required
        />

        <button
          type="submit"
          class="bg-indigo-600 hover:bg-indigo-700 p-2 rounded"
        >
          Ingresar
        </button>

        <!-- Botón para registrar -->
        <button
          type="button"
          (click)="goToRegister()"
          class="bg-green-600 hover:bg-green-700 p-2 rounded mt-2"
        >
          Registrarse
        </button>
      </form>
    </div>
  `,
})
export class LoginComponent {
  name = '';
  password = '';

  constructor(private auth: AuthService, private router: Router) {}

  async login() {
    const ok = await this.auth.login(this.name, this.password);
    if (ok) this.router.navigate(['/home']);
    else alert('Usuario o contraseña inválidos');
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }
}
