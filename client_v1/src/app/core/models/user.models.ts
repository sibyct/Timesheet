export type UserRole = 'employee' | 'manager' | 'admin';

export interface User {
  _id:         string;
  firstName:   string;
  lastName:    string;
  email:       string;
  role:        UserRole;
  department:  string;
  managerId:   string | null;
  hourlyRate:  number;
  isActive:    boolean;
  lastLoginAt: string | null;
  createdAt:   string;
  updatedAt:   string;
}

export interface CreateUserPayload {
  firstName:  string;
  lastName:   string;
  email:      string;
  password:   string;
  role:       UserRole;
  department: string;
  managerId?: string;
  hourlyRate?: number;
}

export interface UpdateUserPayload {
  firstName?:  string;
  lastName?:   string;
  email?:      string;
  role?:       UserRole;
  department?: string;
  managerId?:  string | null;
  hourlyRate?: number;
  isActive?:   boolean;
}

export interface ListUsersParams {
  role?:       UserRole;
  department?: string;
  isActive?:   boolean;
  search?:     string;
  page?:       number;
  limit?:      number;
  sortBy?:     string;
  order?:      'asc' | 'desc';
}
