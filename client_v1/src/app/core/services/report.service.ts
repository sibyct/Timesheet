import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { ApiResponse } from '../models/api.models';
import type { UtilizationRow, BillingRow, ReportFilters } from '../models/report.models';

const BASE = '/api/v1/reports';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private http = inject(HttpClient);

  // ── JSON reports ────────────────────────────────────────────────────────────

  getUtilization(filters: ReportFilters): Observable<UtilizationRow[]> {
    return this.http
      .get<ApiResponse<UtilizationRow[]>>(`${BASE}/utilization`, {
        params: this.toParams(filters),
      })
      .pipe(map((r) => r.data));
  }

  getBilling(filters: ReportFilters): Observable<BillingRow[]> {
    return this.http
      .get<ApiResponse<BillingRow[]>>(`${BASE}/billing`, {
        params: this.toParams(filters),
      })
      .pipe(map((r) => r.data));
  }

  // ── CSV exports ─────────────────────────────────────────────────────────────

  exportUtilizationCsv(filters: ReportFilters): Observable<Blob> {
    return this.http.get(`${BASE}/utilization/export`, {
      params:       this.toParams(filters),
      responseType: 'blob',
    });
  }

  exportBillingCsv(filters: ReportFilters): Observable<Blob> {
    return this.http.get(`${BASE}/billing/export`, {
      params:       this.toParams(filters),
      responseType: 'blob',
    });
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private toParams(filters: ReportFilters): HttpParams {
    let params = new HttpParams()
      .set('from',   filters.from)
      .set('to',     filters.to)
      .set('status', filters.status);

    if (filters.userId)    params = params.set('userId',    filters.userId);
    if (filters.projectId) params = params.set('projectId', filters.projectId);

    return params;
  }
}
