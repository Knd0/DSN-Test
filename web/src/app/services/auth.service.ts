// web/src/app/services/auth.service.ts
import { Injectable, signal } from '@angular/core';

export interface User {
  id: string;
  username: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  user = signal<User | null>(null);
  token = signal<string | null>(localStorage.getItem('token'));

  get isLoggedIn() {
    return !!this.user();
  }

  async login(username: string, password: string) {
    try {
      const res = await fetch('https://dsn-test-production.up.railway.app/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) throw new Error('Login fallido');
      const data = await res.json();
      this.setUser(data.user, data.token);
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  logout() {
    this.user.set(null);
    this.token.set(null);
    localStorage.removeItem('token');
  }

  setUser(user: User, token: string) {
    this.user.set(user);
    this.token.set(token);
    localStorage.setItem('token', token);
  }
}
