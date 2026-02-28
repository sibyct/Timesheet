import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TimesheetEntry, TimesheetResponse } from '../../shared/models/timesheet.model';

@Injectable({ providedIn: 'root' })
export class TimesheetService {
  constructor(private http: HttpClient) {}

  getUserTimeLogin(): Observable<TimesheetResponse> {
    return this.http.get<TimesheetResponse>('/time/getUserTimeLogin');
  }

  getDateInfoBetweenDates(date: string): Observable<TimesheetResponse> {
    return this.http.post<TimesheetResponse>('/time/getDateInfoBetweenDates', { date });
  }

  updateTimeSheet(payload: {
    name: string;
    newData: TimesheetEntry[];
    dataNeedToUpdate: TimesheetEntry[];
  }): Observable<TimesheetResponse> {
    return this.http.post<TimesheetResponse>('/time/updateTimeSheet', payload);
  }

  submitTimeSheet(payload: {
    name: string;
    newData: TimesheetEntry[];
    dataNeedToUpdate: TimesheetEntry[];
  }): Observable<TimesheetResponse> {
    return this.http.post<TimesheetResponse>('/time/submitTimeSheet', payload);
  }
}
