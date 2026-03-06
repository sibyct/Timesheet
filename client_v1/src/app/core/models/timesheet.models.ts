export type TimesheetStatus = 'draft' | 'submitted' | 'approved' | 'rejected';
export type EntryStatus    = 'draft' | 'submitted' | 'approved' | 'rejected';

export interface TimesheetEntry {
  entryId:    string;
  projectId:  string;
  taskId:     string;
  date:       string;
  hours:      number;
  isBillable: boolean;
  status:     EntryStatus;
}

export interface Timesheet {
  _id:         string;
  userId:      string;
  managerId:   string | null;
  periodStart: string;
  periodEnd:   string;
  totalHours:  number;
  status:      TimesheetStatus;
  entries:     TimesheetEntry[];
  notes:       string;
  submittedAt: string | null;
  approvedAt:  string | null;
  rejectedAt:  string | null;
  recalledAt:  string | null;
  createdAt:   string;
  updatedAt:   string;
}

export interface CreateTimesheetPayload {
  periodStart: string;
  periodEnd:   string;
  notes?:      string;
}

export interface UpdateTimesheetPayload {
  notes?:   string;
  entries?: TimesheetEntry[];
}

export interface ListTimesheetsParams {
  status?:  TimesheetStatus;
  userId?:  string;
  page?:    number;
  limit?:   number;
  sortBy?:  'periodStart' | 'submittedAt' | 'totalHours' | 'status';
  order?:   'asc' | 'desc';
}
