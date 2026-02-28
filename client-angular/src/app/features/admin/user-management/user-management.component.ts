import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AdminService } from '../../../core/services/admin.service';
import { User, Client } from '../../../shared/models/user.model';
import { AddUserDialogComponent } from './dialogs/add-user-dialog.component';
import { AddProjectDialogComponent } from './dialogs/add-project-dialog.component';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
  ],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss'],
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  clients: Client[] = [];
  displayedColumns = ['userId', 'username', 'firstName', 'lastName', 'emailAddress', 'contractType', 'actions'];

  constructor(
    private adminService: AdminService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.adminService.getUserInfo().subscribe((res) => {
      this.users = res.data;
    });
  }

  addUser(): void {
    this.adminService.getUserId().subscribe((res) => {
      const nextId = res.data[0].userId + 1;
      const dialogRef = this.dialog.open(AddUserDialogComponent, {
        disableClose: true,
        data: { userId: nextId, clients: res.projects },
      });
      dialogRef.afterClosed().subscribe((result) => {
        if (result && !result.flg) {
          this.users = [...this.users, result.data];
          this.snackBar.open('User Added Successfully', 'Close', { duration: 3000 });
        }
      });
    });
  }

  editUser(user: User): void {
    this.adminService.getProjectList().subscribe((res) => {
      const dialogRef = this.dialog.open(AddUserDialogComponent, {
        disableClose: true,
        data: { userData: user, clients: res.data },
      });
      dialogRef.afterClosed().subscribe((result) => {
        if (result?.flg) {
          this.users = result.data;
          this.snackBar.open('Updated Successfully', 'Close', { duration: 3000 });
        }
      });
    });
  }

  deleteUser(user: User): void {
    if (!confirm(`Delete user ${user.firstName} ${user.lastName}?`)) return;
    this.adminService.deleteUser(user.userId).subscribe((res) => {
      this.users = res.data;
      this.snackBar.open('User Deleted Successfully', 'Close', { duration: 3000 });
    });
  }

  resetPassword(user: User): void {
    if (!confirm(`Reset password for ${user.username}?`)) return;
    this.adminService.resetPassword(user.username).subscribe({
      next: () => this.snackBar.open('Password Reset Successfully', 'Close', { duration: 3000 }),
    });
  }

  manageProjects(): void {
    this.adminService.getProjectList().subscribe((res) => {
      this.dialog.open(AddProjectDialogComponent, {
        disableClose: true,
        width: '600px',
        data: { projectList: res.data },
      });
    });
  }
}
