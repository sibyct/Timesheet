import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ReportActions } from '../../../store/report/report.actions';
import {
  selectUtilization,
  selectBilling,
  selectReportLoading,
  selectUtilizationTotals,
  selectBillingTotals,
} from '../../../store/report/report.selectors';
import { ReportService } from '../../../core/services/report.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import type { ReportFilters, UtilizationRow, BillingRow } from '../../../core/models/report.models';

type ReportStatus = 'submitted' | 'approved' | 'all';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTabsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressBarModule,
    MatTooltipModule,
    EmptyStateComponent,
  ],
  templateUrl: './reports.component.html',
  styleUrl:    './reports.component.scss',
})
export class ReportsComponent implements OnInit {
  private store      = inject(Store);
  private reportSvc  = inject(ReportService);

  readonly utilization       = toSignal(this.store.select(selectUtilization),       { initialValue: [] as UtilizationRow[] });
  readonly billing           = toSignal(this.store.select(selectBilling),           { initialValue: [] as BillingRow[] });
  readonly loading           = toSignal(this.store.select(selectReportLoading),     { initialValue: false });
  readonly utilizationTotals = toSignal(this.store.select(selectUtilizationTotals), { initialValue: { totalHours: 0, billableHours: 0, nonBillableHours: 0 } });
  readonly billingTotals     = toSignal(this.store.select(selectBillingTotals),     { initialValue: { billableHours: 0, totalAmount: 0 } });

  // ── Filter state ──────────────────────────────────────────────────────────
  from:   string = this.defaultFrom();
  to:     string = this.toDateString(new Date());
  status: ReportStatus = 'approved';

  readonly statuses: { value: ReportStatus; label: string }[] = [
    { value: 'approved',  label: 'Approved only'  },
    { value: 'submitted', label: 'Submitted only' },
    { value: 'all',       label: 'All statuses'   },
  ];

  // ── Columns ───────────────────────────────────────────────────────────────
  readonly utilColumns = ['name', 'email', 'totalHours', 'billableHours', 'nonBillableHours', 'timesheetCount'];
  readonly billColumns = ['projectCode', 'projectName', 'billableHours', 'totalAmount', 'timesheetCount'];

  ngOnInit(): void {
    this.runReport();
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  runReport(): void {
    const filters = this.buildFilters();
    this.store.dispatch(ReportActions.setFilters({ filters }));
    this.store.dispatch(ReportActions.loadUtilization({ filters }));
    this.store.dispatch(ReportActions.loadBilling({ filters }));
  }

  exportUtilization(): void {
    this.reportSvc.exportUtilizationCsv(this.buildFilters()).subscribe((blob) =>
      this.triggerDownload(blob, `utilization_${this.from}_${this.to}.csv`),
    );
  }

  exportBilling(): void {
    this.reportSvc.exportBillingCsv(this.buildFilters()).subscribe((blob) =>
      this.triggerDownload(blob, `billing_${this.from}_${this.to}.csv`),
    );
  }

  // ── Display helpers ───────────────────────────────────────────────────────

  fmtHours(n: number): string {
    return n.toFixed(1) + 'h';
  }

  fmtAmount(n: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD', maximumFractionDigits: 0,
    }).format(n);
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private buildFilters(): ReportFilters {
    return { from: this.from, to: this.to, status: this.status };
  }

  private defaultFrom(): string {
    const d = new Date();
    d.setDate(1); // first of current month
    return this.toDateString(d);
  }

  private toDateString(d: Date): string {
    return d.toISOString().slice(0, 10);
  }

  private triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
