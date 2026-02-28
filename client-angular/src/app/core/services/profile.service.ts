import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../../shared/models/user.model';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  constructor(private http: HttpClient) {}

  getProfileInfo(): Observable<{ data: User }> {
    return this.http.get<{ data: User }>('/time/getProfileInfo');
  }

  saveProfileInfo(user: Partial<User>): Observable<unknown> {
    return this.http.post('/time/saveProfileInfo', user);
  }
}
