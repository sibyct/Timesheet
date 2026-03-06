import { createActionGroup, emptyProps, props } from '@ngrx/store';
import type { UtilizationRow, BillingRow, ReportFilters } from '../../core/models/report.models';

export const ReportActions = createActionGroup({
  source: 'Report',
  events: {
    // ── Filters ───────────────────────────────────────────────────────────────
    'Set Filters': props<{ filters: ReportFilters }>(),

    // ── Utilization ───────────────────────────────────────────────────────────
    'Load Utilization':         props<{ filters: ReportFilters }>(),
    'Load Utilization Success': props<{ rows: UtilizationRow[] }>(),
    'Load Utilization Failure': props<{ error: string }>(),

    // ── Billing ───────────────────────────────────────────────────────────────
    'Load Billing':         props<{ filters: ReportFilters }>(),
    'Load Billing Success': props<{ rows: BillingRow[] }>(),
    'Load Billing Failure': props<{ error: string }>(),

    // ── Reset ─────────────────────────────────────────────────────────────────
    'Clear': emptyProps(),
  },
});
