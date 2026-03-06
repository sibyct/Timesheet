import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { ApiResponse, PaginatedResponse, PaginationMeta } from '../models/api.models';
import type {
  Timesheet,
  CreateTimesheetPayload,
  UpdateTimesheetPayload,
  ListTimesheetsParams,
} from '../models/timesheet.models';

const BASE = '/api/v1/timesheets';

@Injectable({ providedIn: 'root' })
export class TimesheetService {
  private http = inject(HttpClient);

  // ── List ────────────────────────────────────────────────────────────────────

  list(params: ListTimesheetsParams = {}): Observable<{ data: Timesheet[]; meta: PaginationMeta }> {
    let httpParams = new HttpParams();
    if (params.status)  httpParams = httpParams.set('status',  params.status);
    if (params.userId)  httpParams = httpParams.set('userId',  params.userId);
    if (params.page)    httpParams = httpParams.set('page',    params.page);
    if (params.limit)   httpParams = httpParams.set('limit',   params.limit);
    if (params.sortBy)  httpParams = httpParams.set('sortBy',  params.sortBy);
    if (params.order)   httpParams = httpParams.set('order',   params.order);

    return this.http
      .get<PaginatedResponse<Timesheet>>(BASE, { params: httpParams })
      .pipe(map(({ data, meta }) => ({ data, meta })));
  }

  // ── Get by ID ───────────────────────────────────────────────────────────────

  getById(id: string): Observable<Timesheet> {
    return this.http
      .get<ApiResponse<Timesheet>>(`${BASE}/${id}`)
      .pipe(map((r) => r.data));
  }

  // ── Create ──────────────────────────────────────────────────────────────────

  create(payload: CreateTimesheetPayload): Observable<Timesheet> {
    return this.http
      .post<ApiResponse<Timesheet>>(BASE, payload)
      .pipe(map((r) => r.data));
  }

  // ── Update ──────────────────────────────────────────────────────────────────

  update(id: string, payload: UpdateTimesheetPayload): Observable<Timesheet> {
    return this.http
      .patch<ApiResponse<Timesheet>>(`${BASE}/${id}`, payload)
      .pipe(map((r) => r.data));
  }

  // ── Delete ──────────────────────────────────────────────────────────────────

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${BASE}/${id}`);
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  submit(id: string): Observable<Timesheet> {
    return this.http
      .post<ApiResponse<Timesheet>>(`${BASE}/${id}/submit`, {})
      .pipe(map((r) => r.data));
  }

  // ── Recall ──────────────────────────────────────────────────────────────────

  recall(id: string): Observable<Timesheet> {
    return this.http
      .post<ApiResponse<Timesheet>>(`${BASE}/${id}/recall`, {})
      .pipe(map((r) => r.data));
  }

  // ── Approve ─────────────────────────────────────────────────────────────────

  approve(id: string): Observable<Timesheet> {
    return this.http
      .post<ApiResponse<Timesheet>>(`${BASE}/${id}/approve`, {})
      .pipe(map((r) => r.data));
  }

  // ── Reject ──────────────────────────────────────────────────────────────────

  reject(id: string, reason: string): Observable<Timesheet> {
    return this.http
      .post<ApiResponse<Timesheet>>(`${BASE}/${id}/reject`, { reason })
      .pipe(map((r) => r.data));
  }

  // ── Bulk Approve ─────────────────────────────────────────────────────────────

  bulkApprove(ids: string[]): Observable<{ approved: string[]; skipped: string[] }> {
    return this.http
      .post<ApiResponse<{ approved: string[]; skipped: string[] }>>(`${BASE}/bulk-approve`, { ids })
      .pipe(map((r) => r.data));
  }
}
