import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';
import { User } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;
  private _user = signal<User | null>(null);

  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null);

  login(username: string, password: string): Observable<boolean> {
    return this.http.post<{ message: string }>(`${this.api}/auth/login`, { username, password }).pipe(
      tap(() => {
        const user: User = { username, name: username };
        this._user.set(user);
        localStorage.setItem('auth_user', JSON.stringify(user));
      }),
      map(() => true),
      catchError(() => of(false)),
    );
  }

  logout(): void {
    this.http.post(`${this.api}/auth/logout`, {}).subscribe();
    this._user.set(null);
    localStorage.removeItem('auth_user');
  }

  restoreSession(): void {
    const saved = localStorage.getItem('auth_user');
    if (saved) this._user.set(JSON.parse(saved));
  }
}
