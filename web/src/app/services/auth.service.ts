// web/src/app/services/auth.service.ts
import { Injectable, signal } from '@angular/core';

export interface User {
  id: string;
  name: string;
  email?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _userKey = 'dsn_user';
  private _tokenKey = 'dsn_token';

  // señal para estado global del usuario
  private _user = signal<User | null>(
    JSON.parse(localStorage.getItem(this._userKey) ?? 'null')
  );
  private _token = signal<string | null>(localStorage.getItem(this._tokenKey));

  user() {
    return this._user();
  }

  token() {
    return this._token();
  }

  // web/src/app/services/auth.service.ts
  async register(
    name: string,
    email: string,
    password: string
  ): Promise<boolean> {
    try {
      const res = await fetch(
        'https://dsn-test-production.up.railway.app/auth/register',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        }
      );
      return res.ok;
    } catch (err) {
      console.error('Error registrando usuario', err);
      return false;
    }
  }

  async login(name: string, password: string): Promise<boolean> {
    try {
      const res = await fetch(
        'https://dsn-test-production.up.railway.app/auth/login',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, password }),
        }
      );

      if (!res.ok) return false;

      const data = await res.json();
      const user: User = data.user;
      const token: string = data.token;

      this._user.set(user);
      this._token.set(token);

      localStorage.setItem(this._userKey, JSON.stringify(user));
      localStorage.setItem(this._tokenKey, token);

      return true;
    } catch (err) {
      console.error('Login error', err);
      return false;
    }
  }

  logout() {
    this._user.set(null);
    this._token.set(null);
    localStorage.removeItem(this._userKey);
    localStorage.removeItem(this._tokenKey);
  }
}
