import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { ApiResponse, PaginatedResponse, PaginationMeta } from '../models/api.models';
import type {
  User,
  CreateUserPayload,
  UpdateUserPayload,
  ListUsersParams,
} from '../models/user.models';

const BASE = '/api/v1/users';

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);

  // ── List ────────────────────────────────────────────────────────────────────

  list(params: ListUsersParams = {}): Observable<{ data: User[]; meta: PaginationMeta }> {
    let httpParams = new HttpParams();
    if (params.role)       httpParams = httpParams.set('role',       params.role);
    if (params.department) httpParams = httpParams.set('department', params.department);
    if (params.isActive !== undefined) httpParams = httpParams.set('isActive', params.isActive);
    if (params.search)     httpParams = httpParams.set('search',     params.search);
    if (params.page)       httpParams = httpParams.set('page',       params.page);
    if (params.limit)      httpParams = httpParams.set('limit',      params.limit);
    if (params.sortBy)     httpParams = httpParams.set('sortBy',     params.sortBy);
    if (params.order)      httpParams = httpParams.set('order',      params.order);

    return this.http
      .get<PaginatedResponse<User>>(BASE, { params: httpParams })
      .pipe(map(({ data, meta }) => ({ data, meta })));
  }

  // ── Get by ID ───────────────────────────────────────────────────────────────

  getById(id: string): Observable<User> {
    return this.http
      .get<ApiResponse<User>>(`${BASE}/${id}`)
      .pipe(map((r) => r.data));
  }

  // ── Me (own profile) ────────────────────────────────────────────────────────

  me(): Observable<User> {
    return this.http
      .get<ApiResponse<User>>(`${BASE}/me`)
      .pipe(map((r) => r.data));
  }

  // ── Create ──────────────────────────────────────────────────────────────────

  create(payload: CreateUserPayload): Observable<User> {
    return this.http
      .post<ApiResponse<User>>(BASE, payload)
      .pipe(map((r) => r.data));
  }

  // ── Update ──────────────────────────────────────────────────────────────────

  update(id: string, payload: UpdateUserPayload): Observable<User> {
    return this.http
      .patch<ApiResponse<User>>(`${BASE}/${id}`, payload)
      .pipe(map((r) => r.data));
  }

  // ── Deactivate (soft-delete) ────────────────────────────────────────────────

  deactivate(id: string): Observable<User> {
    return this.http
      .delete<ApiResponse<User>>(`${BASE}/${id}`)
      .pipe(map((r) => r.data));
  }

  // ── Change password ─────────────────────────────────────────────────────────

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.http
      .post<void>(`${BASE}/me/change-password`, { currentPassword, newPassword });
  }
}
