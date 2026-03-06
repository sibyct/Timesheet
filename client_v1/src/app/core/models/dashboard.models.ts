export interface PendingItem {
  timesheetId: string;
  userId:      string;
  userName:    string;
  periodStart: string;
  periodEnd:   string;
  totalHours:  number;
  submittedAt: string | null;
}

export interface OverBudgetItem {
  projectId:   string;
  projectName: string;
  projectCode: string;
  budget:      number;
  spentBudget: number;
}

export interface DashboardStats {
  users: {
    total:  number;
    active: number;
  };
  projects: {
    active:     number;
    overBudget: number;
  };
  approvals: {
    pending:           number;
    approvedThisMonth: number;
    rejectedThisMonth: number;
  };
  hours: {
    totalThisMonth:    number;
    billableThisMonth: number;
  };
  revenue: {
    thisMonth: number;
  };
  recentPending:      PendingItem[];
  overBudgetProjects: OverBudgetItem[];
}
