import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

import { TimesheetActions } from '../../store/timesheet/timesheet.actions';
import {
  selectActiveTimesheet,
  selectActiveStatus,
  selectTimesheetLoading,
  selectTimesheetSaving,
  selectTimesheetSubmitting,
  selectTimesheetRecalling,
  selectIsDirty,
  selectAnyBusy,
} from '../../store/timesheet/timesheet.selectors';
import { WeeklyGridComponent } from '../../shared/components/weekly-grid/weekly-grid.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import type { TimesheetEntry } from '../../core/models/timesheet.models';

// ─── Week helpers ─────────────────────────────────────────────────────────────

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Returns the Monday of the week containing `d` */
function weekMonday(d: Date): Date {
  const date = new Date(d);
  const day  = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

function addWeeks(iso: string, delta: number): string {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + delta * 7);
  return isoDate(d);
}

function toDisplayRange(start: string, end: string): string {
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const s = new Date(start + 'T00:00:00').toLocaleDateString('en-US', opts);
  const e = new Date(end   + 'T00:00:00').toLocaleDateString('en-US', { ...opts, year: 'numeric' });
  return `${s} – ${e}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

@Component({
  selector:    'app-timesheet',
  standalone:  true,
  imports:     [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatInputModule,
    MatFormFieldModule,
    WeeklyGridComponent,
    StatusBadgeComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
  ],
  templateUrl: './timesheet.component.html',
  styleUrl:    './timesheet.component.scss',
})
export class TimesheetComponent implements OnInit, OnDestroy {
  private store = inject(Store);

  // ── Store signals ─────────────────────────────────────────────────────────
  readonly active     = toSignal(this.store.select(selectActiveTimesheet),     { initialValue: null });
  readonly status     = toSignal(this.store.select(selectActiveStatus),        { initialValue: null });
  readonly loading    = toSignal(this.store.select(selectTimesheetLoading),    { initialValue: false });
  readonly saving     = toSignal(this.store.select(selectTimesheetSaving),     { initialValue: false });
  readonly submitting = toSignal(this.store.select(selectTimesheetSubmitting), { initialValue: false });
  readonly recalling  = toSignal(this.store.select(selectTimesheetRecalling),  { initialValue: false });
  readonly dirty      = toSignal(this.store.select(selectIsDirty),            { initialValue: false });
  readonly anyBusy    = toSignal(this.store.select(selectAnyBusy),            { initialValue: false });

  // ── Local UI state ────────────────────────────────────────────────────────
  readonly weekStart      = signal<string>(isoDate(weekMonday(new Date())));
  readonly pendingEntries = signal<TimesheetEntry[]>([]);
  readonly notes          = signal<string>('');

  readonly weekEnd = computed(() => {
    const d = new Date(this.weekStart() + 'T00:00:00');
    d.setDate(d.getDate() + 6);
    return isoDate(d);
  });

  readonly weekLabel = computed(() =>
    toDisplayRange(this.weekStart(), this.weekEnd()),
  );

  readonly isCurrentWeek = computed(() =>
    this.weekStart() === isoDate(weekMonday(new Date())),
  );

  readonly isEditable = computed(() =>
    this.status() === 'draft' || this.status() === 'rejected',
  );

  ngOnInit(): void {
    this.loadWeek();
  }

  ngOnDestroy(): void {
    this.store.dispatch(TimesheetActions.clearActive());
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  prevWeek(): void {
    this.weekStart.set(addWeeks(this.weekStart(), -1));
    this.loadWeek();
  }

  nextWeek(): void {
    this.weekStart.set(addWeeks(this.weekStart(), 1));
    this.loadWeek();
  }

  goToCurrentWeek(): void {
    this.weekStart.set(isoDate(weekMonday(new Date())));
    this.loadWeek();
  }

  private loadWeek(): void {
    this.pendingEntries.set([]);
    this.store.dispatch(TimesheetActions.loadForWeek({ periodStart: this.weekStart() }));
  }

  // ── Grid ──────────────────────────────────────────────────────────────────

  onEntriesChange(entries: TimesheetEntry[]): void {
    this.pendingEntries.set(entries);
    this.store.dispatch(TimesheetActions.setPendingEntries({ entries }));
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  createTimesheet(): void {
    const periodStart = new Date(this.weekStart() + 'T00:00:00').toISOString();
    const periodEnd   = new Date(this.weekEnd()   + 'T23:59:59').toISOString();
    this.store.dispatch(TimesheetActions.create({ payload: { periodStart, periodEnd } }));
  }

  saveEntries(): void {
    const ts = this.active();
    if (!ts) return;
    this.store.dispatch(TimesheetActions.saveEntries({
      id:      ts._id,
      entries: this.pendingEntries(),
      notes:   this.notes(),
    }));
  }

  submit(): void {
    const ts = this.active();
    if (!ts) return;
    this.store.dispatch(TimesheetActions.submit({ id: ts._id }));
  }

  recall(): void {
    const ts = this.active();
    if (!ts) return;
    this.store.dispatch(TimesheetActions.recall({ id: ts._id }));
  }

  formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
    });
  }
}
