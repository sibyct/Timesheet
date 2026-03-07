import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthUser } from '../store/auth.state';

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  login(username: string, password: string) {
    return this.http.post<LoginResponse>('/api/v1/auth/login', {
      username,
      password,
    });
  }

  changePassword(currentPassword: string, newPassword: string) {
    return this.http.post('/api/v1/users/me/change-password', {
      currentPassword,
      newPassword,
    });
  }
}
