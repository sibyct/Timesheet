export type ProjectStatus = 'active' | 'on_hold' | 'completed' | 'archived';

export interface Project {
  _id:         string;
  name:        string;
  code:        string;
  description: string;
  clientId:    string;
  budget:      number;
  spentBudget: number;
  members:     string[];
  status:      ProjectStatus;
  startDate:   string | null;
  endDate:     string | null;
  isActive:    boolean;
  createdAt:   string;
  updatedAt:   string;
}

export interface CreateProjectPayload {
  name:        string;
  code:        string;
  description?: string;
  clientId:    string;
  budget?:     number;
  members?:    string[];
  status?:     ProjectStatus;
  startDate?:  string | null;
  endDate?:    string | null;
}

export interface UpdateProjectPayload {
  name?:        string;
  description?: string;
  budget?:      number;
  status?:      ProjectStatus;
  startDate?:   string | null;
  endDate?:     string | null;
  isActive?:    boolean;
}

export interface ListProjectsParams {
  status?:   ProjectStatus;
  clientId?: string;
  memberId?: string;
  isActive?: boolean;
  search?:   string;
  page?:     number;
  limit?:    number;
  sortBy?:   'name' | 'code' | 'budget' | 'startDate' | 'status';
  order?:    'asc' | 'desc';
}
