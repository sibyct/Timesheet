import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, Client } from '../../shared/models/user.model';
import { TimesheetEntry } from '../../shared/models/timesheet.model';

export interface SearchCriteria {
  fromDate?: string;
  toDate?: string;
  project?: string;
  client?: string;
  projectType?: string;
  users?: { userId: number };
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private http: HttpClient) {}

  getUserInfo(): Observable<{ data: User[] }> {
    return this.http.get<{ data: User[] }>('/admin/getuserInfo');
  }

  getUserId(): Observable<{ data: User[]; projects: Client[] }> {
    return this.http.get<{ data: User[]; projects: Client[] }>('/admin/getuserId');
  }

  getProjectList(): Observable<{ data: Client[] }> {
    return this.http.get<{ data: Client[] }>('/admin/getProjectList');
  }

  getProjectListAndUserList(): Observable<{ clientsList: Client[]; userList: User[] }> {
    return this.http.get<{ clientsList: Client[]; userList: User[] }>('/admin/getProjectListAndUserList');
  }

  registerUser(user: Partial<User>): Observable<unknown> {
    return this.http.post('/admin/register', user);
  }

  updateUserDetails(user: Partial<User>): Observable<{ data: User[] }> {
    return this.http.post<{ data: User[] }>('/admin/updateUserDetails', user);
  }

  deleteUser(userId: number): Observable<{ data: User[] }> {
    return this.http.get<{ data: User[] }>(`/admin/deleteUser/${userId}`);
  }

  saveProjectList(payload: { newClients: Client[]; updatedList: Client[] }): Observable<{ data: Client[] }> {
    return this.http.post<{ data: Client[] }>('/admin/saveProjectList', payload);
  }

  deleteProjectList(id: string): Observable<{ status: string }> {
    return this.http.get<{ status: string }>(`/admin/deleteProjectList/${id}`);
  }

  getSearchDetails(criteria: SearchCriteria): Observable<{ data: TimesheetEntry[] }> {
    return this.http.post<{ data: TimesheetEntry[] }>('/admin/getSearchDetails', criteria);
  }

  saveAdminData(payload: {
    dataToUpdate: TimesheetEntry[];
    searchCriteria: SearchCriteria;
  }): Observable<{ data: TimesheetEntry[] }> {
    return this.http.post<{ data: TimesheetEntry[] }>('/admin/saveAdminData', payload);
  }

  exportToExcel(criteria: SearchCriteria): Observable<Blob> {
    return this.http.post('/admin/exportToExcel', criteria, { responseType: 'blob' });
  }

  resetPassword(username: string): Observable<unknown> {
    return this.http.get(`/admin/resetPassword/${username}`);
  }
}
