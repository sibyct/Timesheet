import type { UtilizationRow, BillingRow, ReportFilters } from '../../core/models/report.models';

export interface ReportState {
  utilization: UtilizationRow[];
  billing:     BillingRow[];
  filters:     ReportFilters | null;
  loading:     boolean;
  error:       string | null;
}

export const initialReportState: ReportState = {
  utilization: [],
  billing:     [],
  filters:     null,
  loading:     false,
  error:       null,
};
