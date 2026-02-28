import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { AdminService, SearchCriteria } from '../../../core/services/admin.service';
import { TimesheetEntry } from '../../../shared/models/timesheet.model';
import { User, Client, Project } from '../../../shared/models/user.model';

@Component({
  selector: 'app-admin-timesheet',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatTableModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatIconModule,
  ],
  templateUrl: './admin-timesheet.component.html',
  styleUrls: ['./admin-timesheet.component.scss'],
})
export class AdminTimesheetComponent implements OnInit {
  userList: User[] = [];
  clientList: Client[] = [];
  projectList: Project[] = [];
  projectTypes = ['Maintenance', 'Support'];
  timedata: TimesheetEntry[] = [];
  search: SearchCriteria = {};

  displayedColumns = [
    'date', 'userId', 'clients', 'project', 'projectType', 'hours',
    'comments', 'admincomments', 'adminProject', 'adminClient', 'adminProjectType',
  ];

  constructor(private adminService: AdminService, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.adminService.getProjectListAndUserList().subscribe((res) => {
      this.userList = res.userList;
      this.clientList = res.clientsList;
      this.clientList.forEach((c) => {
        this.projectList = [...this.projectList, ...c.projects];
      });
    });
  }

  searchClick(): void {
    this.adminService.getSearchDetails(this.search).subscribe((res) => {
      this.timedata = res.data;
    });
  }

  save(): void {
    this.adminService.saveAdminData({ dataToUpdate: this.timedata, searchCriteria: this.search }).subscribe((res) => {
      this.timedata = res.data;
      this.snackBar.open('Saved Successfully', 'Close', { duration: 3000 });
    });
  }

  exportToExcel(): void {
    this.adminService.exportToExcel(this.search).subscribe((blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'timesheet.csv';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    });
  }

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  }
}
