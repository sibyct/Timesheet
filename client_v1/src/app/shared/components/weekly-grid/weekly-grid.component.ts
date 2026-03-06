import {
  Component,
  input,
  output,
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TimesheetEntry } from '../../../core/models/timesheet.models';

export interface GridRow {
  projectId: string;
  taskId:    string;
  label:     string;
  /** hours keyed by ISO date string */
  hours:     Record<string, number>;
  billable:  boolean;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

@Component({
  selector:    'app-weekly-grid',
  standalone:  true,
  imports:     [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatTooltipModule,
    MatCheckboxModule,
  ],
  templateUrl: './weekly-grid.component.html',
  styleUrl:    './weekly-grid.component.scss',
})
export class WeeklyGridComponent {
  readonly entries     = input<TimesheetEntry[]>([]);
  readonly periodStart = input.required<string>();
  readonly readonly    = input<boolean>(false);

  readonly entriesChange = output<TimesheetEntry[]>();

  /** 7 ISO date strings for the week */
  readonly days = computed<string[]>(() => {
    const start = new Date(this.periodStart());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return isoDate(d);
    });
  });

  readonly dayLabels = computed<{ iso: string; short: string; dayNum: string }[]>(() =>
    this.days().map((iso) => {
      const d = new Date(iso + 'T00:00:00');
      return {
        iso,
        short:  d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: String(d.getDate()),
      };
    }),
  );

  /** Build rows from incoming entries */
  readonly rows = computed<GridRow[]>(() => {
    const map = new Map<string, GridRow>();
    for (const e of this.entries()) {
      const key = `${e.projectId}||${e.taskId}`;
      if (!map.has(key)) {
        map.set(key, {
          projectId: e.projectId,
          taskId:    e.taskId,
          label:     e.taskId || e.projectId,
          hours:     {},
          billable:  e.isBillable,
        });
      }
      map.get(key)!.hours[e.date] = e.hours;
    }
    return [...map.values()];
  });

  /** Mutable copy for editing */
  readonly editRows = signal<GridRow[]>([]);

  ngOnInit(): void {
    this.editRows.set(structuredClone(this.rows()));
  }

  dayTotal(day: string): number {
    return this.editRows().reduce((s, r) => s + (r.hours[day] ?? 0), 0);
  }

  rowTotal(row: GridRow): number {
    return Object.values(row.hours).reduce((s, h) => s + h, 0);
  }

  grandTotal(): number {
    return this.editRows().reduce((s, r) => s + this.rowTotal(r), 0);
  }

  onHoursChange(rowIdx: number, day: string, value: string): void {
    const hours = Math.max(0, Math.min(24, parseFloat(value) || 0));
    this.editRows.update((rows) => {
      const next = structuredClone(rows);
      next[rowIdx].hours[day] = hours;
      return next;
    });
    this.emitEntries();
  }

  addRow(): void {
    this.editRows.update((rows) => [
      ...rows,
      { projectId: '', taskId: '', label: 'New row', hours: {}, billable: true },
    ]);
  }

  removeRow(idx: number): void {
    this.editRows.update((rows) => rows.filter((_, i) => i !== idx));
    this.emitEntries();
  }

  private emitEntries(): void {
    const entries: TimesheetEntry[] = [];
    for (const row of this.editRows()) {
      for (const day of this.days()) {
        const hours = row.hours[day] ?? 0;
        if (hours > 0) {
          entries.push({
            entryId:    crypto.randomUUID(),
            projectId:  row.projectId,
            taskId:     row.taskId,
            date:       day,
            hours,
            isBillable: row.billable,
            status:     'draft',
          });
        }
      }
    }
    this.entriesChange.emit(entries);
  }
}
