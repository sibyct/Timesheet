import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { TimesheetService } from '../../core/services/timesheet.service';
import { AuthService } from '../../core/services/auth.service';
import { TimesheetEntry } from '../../shared/models/timesheet.model';
import { Project, Client } from '../../shared/models/user.model';

@Component({
  selector: 'app-timesheet',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatSnackBarModule,
    MatCardModule,
  ],
  templateUrl: './timesheet.component.html',
  styleUrls: ['./timesheet.component.scss'],
})
export class TimesheetComponent implements OnInit {
  timedata: TimesheetEntry[] = [];
  dates: string[] = [];
  selectedDate = '';
  projects: Project[] = [];
  clients: Client[] = [];
  projectTypes = ['Maintenance', 'Support'];
  total = 0;
  maxHours = 9;
  firstName = '';

  displayedColumns = ['date', 'clients', 'project', 'projectType', 'hours', 'comments', 'actions'];

  constructor(
    private timesheetService: TimesheetService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    const user = this.authService.getUserInfo();
    if (user) {
      this.firstName = user.firstName;
      if ((user as { contractType?: string }).contractType === 'PartTime') {
        this.maxHours = 8;
      }
    }
    this.timesheetService.getUserTimeLogin().subscribe((res) => {
      this.timedata = res.data;
      this.dates = res.dateRanges || [];
      this.selectedDate = this.dates[0] || '';
      this.projects = res.projects || [];
      this.clients = res.clients || [];
      this.calcTotal();
    });
  }

  onDateChange(): void {
    this.timesheetService.getDateInfoBetweenDates(this.selectedDate).subscribe((res) => {
      this.timedata = res.data;
      this.projects = res.projects || this.projects;
      this.clients = res.clients || this.clients;
      this.calcTotal();
    });
  }

  calcTotal(): void {
    this.total = this.timedata.reduce((sum, entry) => sum + (Number(entry.hours) || 0), 0);
  }

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  }

  canAdd(entry: TimesheetEntry): boolean {
    return entry.submitted !== 1 && !entry.newData;
  }

  canDelete(entry: TimesheetEntry): boolean {
    return entry.submitted !== 1 && !!entry.newData;
  }

  addRow(entry: TimesheetEntry, index: number): void {
    const newRow: TimesheetEntry = {
      date: this.formatDate(entry.date),
      clients: '',
      project: '',
      projectType: '',
      hours: 0,
      comments: '',
      submitted: 0,
      newData: true,
    };
    this.timedata.splice(index + 1, 0, newRow);
    this.timedata = [...this.timedata];
  }

  deleteRow(index: number): void {
    this.timedata.splice(index, 1);
    this.timedata = [...this.timedata];
    this.calcTotal();
  }

  private buildPayload() {
    const newData: TimesheetEntry[] = [];
    const dataNeedToUpdate: TimesheetEntry[] = [];

    this.timedata.forEach((entry) => {
      if (entry.newData) {
        const { newData: _, ...clean } = entry;
        newData.push(clean);
      } else {
        dataNeedToUpdate.push(entry);
      }
    });

    return { name: this.firstName, newData, dataNeedToUpdate };
  }

  save(): void {
    const payload = this.buildPayload();
    this.timesheetService.updateTimeSheet(payload).subscribe((res) => {
      this.timedata = res.data;
      this.calcTotal();
      this.snackBar.open('Saved Successfully', 'Close', { duration: 3000 });
    });
  }

  submit(): void {
    const payload = this.buildPayload();
    this.timesheetService.submitTimeSheet(payload).subscribe((res) => {
      this.timedata = res.data;
      this.calcTotal();
      this.snackBar.open('Submitted Successfully', 'Close', { duration: 3000 });
    });
  }
}
