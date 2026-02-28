import { Request } from 'express';

export interface JwtPayload {
  userId: number;
  username: string;
  role: number;
  firstName: string;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export interface Project {
  projectName: string;
  refId?: string;
}

export interface Client {
  _id?: string;
  clientName: string;
  projects: Project[];
}

export interface IUser {
  userId: number;
  username: string;
  password: string;
  contractType: 'PartTime' | 'Permanent';
  projects: Project[];
  clients: Client[];
  hourlyPay: number;
  firstName: string;
  lastName: string;
  emailAddress: string;
  phoneNo: number;
  address: string;
  address2: string;
  city: string;
  state: string;
  postalCode: number;
  role: number;
}

export interface ITimesheetEntry {
  _id?: string;
  userId: number;
  date: Date;
  firstName?: string;
  clients?: string;
  project?: string;
  projectType?: string;
  hours: number;
  adminTime?: number;
  comments?: string;
  admincomments?: string;
  adminProject?: string;
  adminClient?: string;
  adminProjectType?: string;
  submitted: number;
  saved?: number;
  newData?: boolean;
}

export interface SearchCriteria {
  fromDate?: string;
  toDate?: string;
  project?: string;
  client?: string;
  projectType?: string;
  users?: { userId: number };
}
