import { Injectable, signal, computed } from '@angular/core';
import { User } from '../models';

const MOCK_USER: User = { id: 'u1', name: 'Dr. Stefan Petrov', email: 'admin@dentalclinic.mk', role: 'dentist' };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _user = signal<User | null>(null);

  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null);

  login(email: string, _password: string): boolean {
    this._user.set({ ...MOCK_USER, email });
    localStorage.setItem('auth_user', JSON.stringify(this._user()));
    return true;
  }

  logout(): void {
    this._user.set(null);
    localStorage.removeItem('auth_user');
  }

  restoreSession(): void {
    const saved = localStorage.getItem('auth_user');
    if (saved) this._user.set(JSON.parse(saved));
  }
}
