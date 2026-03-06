import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { ApiResponse } from '../models/api.models';
import type { DashboardStats } from '../models/dashboard.models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);

  getStats(): Observable<DashboardStats> {
    return this.http
      .get<ApiResponse<DashboardStats>>('/api/v1/dashboard')
      .pipe(map((r) => r.data));
  }
}
