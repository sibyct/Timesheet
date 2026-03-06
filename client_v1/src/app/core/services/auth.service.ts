import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';

const TOKEN_KEY = 'timesheet_token';
const ROLE_KEY = 'timesheet_role';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  get role(): number {
    return Number(localStorage.getItem(ROLE_KEY));
  }

  isLoggedIn(): boolean {
    return !!this.token;
  }

  login(username: string, password: string) {
    return this.http.post<{ token: string; role: number }>('/user/login', { username, password }).pipe(
      tap(({ token, role }) => {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(ROLE_KEY, String(role));
      })
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
    this.router.navigate(['/login']);
  }

  changePassword(currentPassword: string, newPassword: string) {
    return this.http.post('/user/change-password', { currentPassword, newPassword });
  }
}
