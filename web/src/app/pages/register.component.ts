// web/src/app/pages/register.component.ts
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <form (ngSubmit)="register()" class="bg-gray-800 p-8 rounded-xl w-80 flex flex-col gap-4">
        <h2 class="text-2xl font-bold mb-4 text-center">Registro</h2>

        <input type="text" [(ngModel)]="name" name="name" placeholder="Usuario" class="p-2 rounded bg-gray-700" required>
        <input type="email" [(ngModel)]="email" name="email" placeholder="Email" class="p-2 rounded bg-gray-700" required>
        <input type="password" [(ngModel)]="password" name="password" placeholder="Contraseña" class="p-2 rounded bg-gray-700" required>
        <input type="password" [(ngModel)]="confirmPassword" name="confirmPassword" placeholder="Confirmar contraseña" class="p-2 rounded bg-gray-700" required>

        <button type="submit" class="bg-indigo-600 hover:bg-indigo-700 p-2 rounded">Registrarse</button>

        <!-- Botón para volver al login -->
        <button type="button" (click)="goToLogin()" class="bg-gray-600 hover:bg-gray-700 p-2 rounded mt-2">
          Volver al Login
        </button>
      </form>
    </div>
  `
})
export class RegisterComponent {
  name = '';
  email = '';
  password = '';
  confirmPassword = '';

  constructor(private auth: AuthService, private router: Router) {}

  async register() {
    if (this.password !== this.confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    const success = await this.auth.register(this.name, this.email, this.password);
    if (success) {
      alert('Usuario registrado correctamente');
      this.router.navigate(['/login']);
    } else {
      alert('Error registrando usuario');
    }
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
