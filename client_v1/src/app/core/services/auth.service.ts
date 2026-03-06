import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthUser } from '../../store/auth/auth.state';

export interface LoginResponse {
  token: string;
  user:  AuthUser;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  login(username: string, password: string) {
    return this.http.post<LoginResponse>('/user/login', { username, password });
  }

  changePassword(currentPassword: string, newPassword: string) {
    return this.http.post('/user/change-password', { currentPassword, newPassword });
  }
}
