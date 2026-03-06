export interface UtilizationRow {
  userId:           string;
  firstName:        string;
  lastName:         string;
  email:            string;
  totalHours:       number;
  billableHours:    number;
  nonBillableHours: number;
  timesheetCount:   number;
}

export interface BillingRow {
  projectId:      string;
  projectName:    string;
  projectCode:    string;
  billableHours:  number;
  totalAmount:    number;
  timesheetCount: number;
}

export interface ReportFilters {
  from:       string;   // YYYY-MM-DD
  to:         string;   // YYYY-MM-DD
  status:     'submitted' | 'approved' | 'all';
  userId?:    string;
  projectId?: string;
}
