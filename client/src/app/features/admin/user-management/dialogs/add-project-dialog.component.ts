import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AdminService } from '../../../../core/services/admin.service';
import { Client } from '../../../../shared/models/user.model';

@Component({
  selector: 'app-add-project-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSnackBarModule,
  ],
  templateUrl: './add-project-dialog.component.html',
  styleUrls: ['./add-project-dialog.component.scss'],
})
export class AddProjectDialogComponent {
  clients: Client[];
  newProjectNames: { [key: number]: string } = {};

  constructor(
    private adminService: AdminService,
    private dialogRef: MatDialogRef<AddProjectDialogComponent>,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) data: { projectList: Client[] },
  ) {
    this.clients = data.projectList.length > 0 ? data.projectList : [{ clientName: '', projects: [], newproject: true } as Client & { newproject: boolean }];
  }

  addClient(): void {
    this.clients = [...this.clients, { clientName: '', projects: [], newproject: true } as Client & { newproject: boolean }];
  }

  removeClient(index: number, client: Client & { newproject?: boolean }): void {
    if (client.newproject) {
      this.clients.splice(index, 1);
      this.clients = [...this.clients];
    } else {
      this.adminService.deleteProjectList(client._id!).subscribe(() => {
        this.clients.splice(index, 1);
        this.clients = [...this.clients];
        this.snackBar.open('Deleted Successfully', 'Close', { duration: 3000 });
      });
    }
  }

  addProject(clientIndex: number): void {
    const name = this.newProjectNames[clientIndex]?.trim();
    if (!name) return;
    this.clients[clientIndex].projects = [...this.clients[clientIndex].projects, { projectName: name }];
    this.newProjectNames[clientIndex] = '';
  }

  removeProject(clientIndex: number, projectIndex: number): void {
    this.clients[clientIndex].projects.splice(projectIndex, 1);
    this.clients[clientIndex].projects = [...this.clients[clientIndex].projects];
  }

  save(): void {
    const newClients = this.clients.filter((c) => (c as Client & { newproject?: boolean }).newproject);
    const updatedList = this.clients.filter((c) => !(c as Client & { newproject?: boolean }).newproject);

    this.adminService.saveProjectList({ newClients, updatedList }).subscribe((res) => {
      this.clients = res.data;
      this.snackBar.open('Saved Successfully', 'Close', { duration: 3000 });
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
