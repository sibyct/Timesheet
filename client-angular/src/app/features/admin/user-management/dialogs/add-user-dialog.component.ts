import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { AdminService } from '../../../../core/services/admin.service';
import { User, Client, Project } from '../../../../shared/models/user.model';

export interface AddUserDialogData {
  userId?: number;
  userData?: User;
  clients: Client[];
}

@Component({
  selector: 'app-add-user-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatAutocompleteModule,
    MatChipsModule,
    MatIconModule,
  ],
  templateUrl: './add-user-dialog.component.html',
  styleUrls: ['./add-user-dialog.component.scss'],
})
export class AddUserDialogComponent implements OnInit {
  userForm: FormGroup;
  isEdit = false;
  title = 'Add User';
  contractTypes = ['PartTime', 'Permanent'];
  selectedClients: Client[] = [];
  selectedProjects: Project[] = [];
  availableProjects: Project[] = [];

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    private dialogRef: MatDialogRef<AddUserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddUserDialogData,
  ) {
    this.userForm = this.fb.group({
      username: ['', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      emailAddress: ['', [Validators.required, Validators.email]],
      phoneNo: [''],
      contractType: ['', Validators.required],
      address: [''],
      address2: [''],
    });
  }

  ngOnInit(): void {
    if (this.data.userData) {
      this.isEdit = true;
      this.title = 'Edit User';
      this.userForm.patchValue(this.data.userData);
      this.selectedClients = this.data.userData.clients || [];
      this.selectedProjects = this.data.userData.projects || [];
      this.buildProjectList();
    }
  }

  onClientSelect(clients: Client[]): void {
    this.selectedClients = clients;
    this.buildProjectList();
    // Remove projects that don't belong to remaining clients
    const availableNames = new Set(this.availableProjects.map((p) => p.projectName));
    this.selectedProjects = this.selectedProjects.filter((p) => availableNames.has(p.projectName));
  }

  buildProjectList(): void {
    const projects: Project[] = [];
    this.selectedClients.forEach((c) => {
      const full = this.data.clients.find((fc) => fc.clientName === c.clientName);
      if (full) projects.push(...full.projects);
    });
    this.availableProjects = projects;
  }

  save(): void {
    if (this.userForm.invalid) return;
    const payload = {
      ...this.userForm.value,
      userId: this.data.userId,
      clients: this.selectedClients,
      projectList: this.selectedProjects,
      clientsList: this.selectedClients,
    };

    if (this.isEdit) {
      const userData = this.data.userData!;
      this.adminService.updateUserDetails({ ...userData, ...payload, projects: this.selectedProjects }).subscribe((res) => {
        this.dialogRef.close({ data: res.data, flg: true });
      });
    } else {
      this.adminService.registerUser(payload).subscribe((res: unknown) => {
        const r = res as { res?: string; data?: User };
        if (r.res === 'duplicatesFound') {
          this.userForm.get('username')?.setErrors({ duplicate: true });
          return;
        }
        this.dialogRef.close({ data: payload, flg: false });
      });
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
