import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { DashboardActions } from '../../../store/dashboard/dashboard.actions';
import {
  selectDashboardStats,
  selectDashboardLoading,
} from '../../../store/dashboard/dashboard.selectors';
import type { DashboardStats } from '../../../core/models/dashboard.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl:    './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private store = inject(Store);

  readonly stats   = toSignal(this.store.select(selectDashboardStats),   { initialValue: null as DashboardStats | null });
  readonly loading = toSignal(this.store.select(selectDashboardLoading), { initialValue: false });

  // Billable utilization 0–100 (for the progress bar)
  readonly billableRatio = computed(() => {
    const s = this.stats();
    if (!s || s.hours.totalThisMonth === 0) return 0;
    return Math.min(100, Math.round((s.hours.billableThisMonth / s.hours.totalThisMonth) * 100));
  });

  ngOnInit(): void {
    this.store.dispatch(DashboardActions.load());
  }

  refresh(): void {
    this.store.dispatch(DashboardActions.load());
  }

  // ── Display helpers ───────────────────────────────────────────────────────

  fmtHours(n: number): string {
    return n.toFixed(1) + 'h';
  }

  fmtCurrency(n: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD', maximumFractionDigits: 0,
    }).format(n);
  }

  fmtDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  fmtPeriod(start: string, end: string): string {
    const s = new Date(start);
    const e = new Date(end);
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${s.toLocaleDateString('en-US', opts)} – ${e.toLocaleDateString('en-US', opts)}`;
  }

  overBy(budget: number, spent: number): number {
    return spent - budget;
  }

  // Returns 0–100, clamped — safe to bind to [style.width.%]
  budgetPct(budget: number, spent: number): number {
    if (budget === 0) return 100;
    return Math.min(100, Math.round((spent / budget) * 100));
  }
}
