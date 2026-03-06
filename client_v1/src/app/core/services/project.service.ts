import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { ApiResponse, PaginatedResponse, PaginationMeta } from '../models/api.models';
import type {
  Project,
  CreateProjectPayload,
  UpdateProjectPayload,
  ListProjectsParams,
} from '../models/project.models';

const BASE = '/api/v1/projects';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private http = inject(HttpClient);

  list(params: ListProjectsParams = {}): Observable<{ data: Project[]; meta: PaginationMeta }> {
    let p = new HttpParams();
    if (params.status)             p = p.set('status',   params.status);
    if (params.clientId)           p = p.set('clientId', params.clientId);
    if (params.memberId)           p = p.set('memberId', params.memberId);
    if (params.isActive !== undefined) p = p.set('isActive', params.isActive);
    if (params.search)             p = p.set('search',   params.search);
    if (params.page)               p = p.set('page',     params.page);
    if (params.limit)              p = p.set('limit',    params.limit);
    if (params.sortBy)             p = p.set('sortBy',   params.sortBy);
    if (params.order)              p = p.set('order',    params.order);
    return this.http
      .get<PaginatedResponse<Project>>(BASE, { params: p })
      .pipe(map(({ data, meta }) => ({ data, meta })));
  }

  getById(id: string): Observable<Project> {
    return this.http
      .get<ApiResponse<Project>>(`${BASE}/${id}`)
      .pipe(map((r) => r.data));
  }

  create(payload: CreateProjectPayload): Observable<Project> {
    return this.http
      .post<ApiResponse<Project>>(BASE, payload)
      .pipe(map((r) => r.data));
  }

  update(id: string, payload: UpdateProjectPayload): Observable<Project> {
    return this.http
      .patch<ApiResponse<Project>>(`${BASE}/${id}`, payload)
      .pipe(map((r) => r.data));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${BASE}/${id}`);
  }

  addMember(projectId: string, userId: string): Observable<Project> {
    return this.http
      .post<ApiResponse<Project>>(`${BASE}/${projectId}/members`, { userId })
      .pipe(map((r) => r.data));
  }

  removeMember(projectId: string, userId: string): Observable<Project> {
    return this.http
      .delete<ApiResponse<Project>>(`${BASE}/${projectId}/members`, { body: { userId } })
      .pipe(map((r) => r.data));
  }
}
