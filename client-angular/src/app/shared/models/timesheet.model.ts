export interface TimesheetEntry {
  _id?: string;
  userId?: number;
  date: string | Date;
  clients?: string;
  project?: string;
  projectType?: string;
  hours: number;
  comments?: string;
  admincomments?: string;
  adminProject?: string;
  adminClient?: string;
  adminProjectType?: string;
  submitted: number;
  saved?: number;
  newData?: boolean;
}

export interface TimesheetResponse {
  data: TimesheetEntry[];
  dateRanges?: string[];
  projects?: import('./user.model').Project[];
  clients?: import('./user.model').Client[];
  status?: string;
}
