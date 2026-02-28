import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

interface LoginResponse {
  token: string;
  role: number;
  status: string;
}

interface JwtPayload {
  userId: number;
  username: string;
  role: number;
  firstName: string;
  exp: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'timesheet_token';

  constructor(private http: HttpClient, private router: Router) {}

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/user/login', { username, password }).pipe(
      tap((res) => {
        localStorage.setItem(this.TOKEN_KEY, res.token);
      }),
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      return decoded.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  getUserRole(): number | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      return decoded.role;
    } catch {
      return null;
    }
  }

  getUserInfo(): JwtPayload | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      return jwtDecode<JwtPayload>(token);
    } catch {
      return null;
    }
  }

  changePassword(password: string): Observable<unknown> {
    return this.http.post('/user/changePassword', { password });
  }
}
