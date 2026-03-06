import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { filter, take } from 'rxjs/operators';

import { ApprovalActions } from '../../../store/approval/approval.actions';
import {
  selectQueue,
  selectQueueMeta,
  selectUserMap,
  selectLoading,
  selectSelected,
  selectActioning,
  selectSelectedCount,
  selectAllSelected,
  selectPendingHours,
} from '../../../store/approval/approval.selectors';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import type { ConfirmDialogData } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { RejectDialogComponent } from './reject-dialog/reject-dialog.component';
import type { RejectDialogData, RejectDialogResult } from './reject-dialog/reject-dialog.component';
import type { Timesheet } from '../../../core/models/timesheet.models';

@Component({
  selector:    'app-approval',
  standalone:  true,
  imports:     [
    CommonModule,
    MatTableModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatPaginatorModule,
    MatProgressBarModule,
    StatusBadgeComponent,
    EmptyStateComponent,
  ],
  templateUrl: './approval.component.html',
  styleUrl:    './approval.component.scss',
})
export class ApprovalComponent implements OnInit {
  private store  = inject(Store);
  private dialog = inject(MatDialog);

  readonly displayedColumns = ['select', 'employee', 'period', 'hours', 'submitted', 'actions'];

  readonly queue         = toSignal(this.store.select(selectQueue),         { initialValue: [] as Timesheet[] });
  readonly meta          = toSignal(this.store.select(selectQueueMeta),     { initialValue: null });
  readonly userMap       = toSignal(this.store.select(selectUserMap),       { initialValue: {} as Record<string, string> });
  readonly loading       = toSignal(this.store.select(selectLoading),       { initialValue: false });
  readonly selected      = toSignal(this.store.select(selectSelected),      { initialValue: new Set<string>() });
  readonly actioning     = toSignal(this.store.select(selectActioning),     { initialValue: new Set<string>() });
  readonly selectedCount = toSignal(this.store.select(selectSelectedCount), { initialValue: 0 });
  readonly allSelected   = toSignal(this.store.select(selectAllSelected),   { initialValue: false });
  readonly pendingHours  = toSignal(this.store.select(selectPendingHours),  { initialValue: 0 });

  readonly pendingCount = computed(() => this.meta()?.total ?? this.queue().length);

  ngOnInit(): void {
    this.store.dispatch(ApprovalActions.loadQueue({}));
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  isSelected(id: string):  boolean { return this.selected().has(id);  }
  isActioning(id: string): boolean { return this.actioning().has(id); }

  employeeName(userId: string): string {
    return this.userMap()[userId] ?? `…${userId.slice(-6).toUpperCase()}`;
  }

  initials(userId: string): string {
    const name = this.userMap()[userId];
    if (!name) return '?';
    const parts = name.split(' ');
    return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
  }

  formatPeriod(ts: Timesheet): string {
    const fmt = (s: string) =>
      new Date(s.slice(0, 10) + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${fmt(ts.periodStart)} – ${fmt(ts.periodEnd)}`;
  }

  formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  // ── Selection ─────────────────────────────────────────────────────────────

  toggleSelect(id: string): void {
    this.store.dispatch(ApprovalActions.toggleSelect({ id }));
  }

  toggleSelectAll(): void {
    this.allSelected()
      ? this.store.dispatch(ApprovalActions.deselectAll())
      : this.store.dispatch(ApprovalActions.selectAll());
  }

  // ── Approve ───────────────────────────────────────────────────────────────

  approve(ts: Timesheet): void {
    const name   = this.employeeName(ts.userId);
    const period = this.formatPeriod(ts);
    const ref = this.dialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(
      ConfirmDialogComponent,
      {
        data: {
          title:        'Approve Timesheet',
          message:      `Approve ${name}'s timesheet for ${period} (${ts.totalHours} hrs)?`,
          confirmLabel: 'Approve',
        },
        width: '420px',
      },
    );
    ref.afterClosed().pipe(take(1), filter(Boolean)).subscribe(() => {
      this.store.dispatch(ApprovalActions.approve({ id: ts._id }));
    });
  }

  // ── Reject ────────────────────────────────────────────────────────────────

  openReject(ts: Timesheet): void {
    const ref = this.dialog.open<RejectDialogComponent, RejectDialogData, RejectDialogResult>(
      RejectDialogComponent,
      {
        data: {
          employeeName: this.employeeName(ts.userId),
          period:       this.formatPeriod(ts),
        },
        width: '480px',
      },
    );
    ref.afterClosed().pipe(take(1), filter(Boolean)).subscribe(({ reason }) => {
      this.store.dispatch(ApprovalActions.reject({ id: ts._id, reason }));
    });
  }

  // ── Bulk approve ──────────────────────────────────────────────────────────

  bulkApprove(): void {
    const count = this.selectedCount();
    const ref = this.dialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(
      ConfirmDialogComponent,
      {
        data: {
          title:        'Bulk Approve',
          message:      `Approve all ${count} selected timesheet(s)? This cannot be undone.`,
          confirmLabel: 'Approve all',
        },
        width: '420px',
      },
    );
    ref.afterClosed().pipe(take(1), filter(Boolean)).subscribe(() => {
      this.store.dispatch(ApprovalActions.bulkApprove());
    });
  }

  // ── Pagination ────────────────────────────────────────────────────────────

  onPage(event: PageEvent): void {
    this.store.dispatch(ApprovalActions.loadQueue({
      page:  event.pageIndex + 1,
      limit: event.pageSize,
    }));
  }
}
