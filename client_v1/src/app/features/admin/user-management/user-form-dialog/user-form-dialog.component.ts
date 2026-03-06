import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import type { User, UserRole, CreateUserPayload, UpdateUserPayload } from '../../../../core/models/user.models';

export interface UserFormDialogData {
  user?: User;
}

export type UserFormDialogResult = CreateUserPayload | UpdateUserPayload;

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'employee', label: 'Employee' },
  { value: 'manager',  label: 'Manager'  },
  { value: 'admin',    label: 'Admin'    },
];

@Component({
  selector: 'app-user-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatCheckboxModule,
  ],
  templateUrl: './user-form-dialog.component.html',
  styleUrl:    './user-form-dialog.component.scss',
})
export class UserFormDialogComponent implements OnInit {
  readonly data: UserFormDialogData = inject(MAT_DIALOG_DATA);
  private ref = inject(MatDialogRef<UserFormDialogComponent>);
  private fb  = inject(FormBuilder);

  readonly isEdit = !!this.data.user;
  readonly roles  = ROLES;

  readonly form = this.fb.group({
    firstName:  ['', [Validators.required, Validators.maxLength(50)]],
    lastName:   ['', [Validators.required, Validators.maxLength(50)]],
    email:      ['', [Validators.required, Validators.email]],
    password:   ['', this.isEdit ? [] : [Validators.required, Validators.minLength(8)]],
    role:       ['employee' as UserRole, Validators.required],
    department: ['', Validators.maxLength(100)],
    hourlyRate: [0, [Validators.min(0)]],
  });

  ngOnInit(): void {
    if (this.data.user) {
      const u = this.data.user;
      this.form.patchValue({
        firstName:  u.firstName,
        lastName:   u.lastName,
        email:      u.email,
        role:       u.role,
        department: u.department,
        hourlyRate: u.hourlyRate,
      });
    }
  }

  get f(): Record<string, AbstractControl> {
    return this.form.controls;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();

    if (this.isEdit) {
      const payload: UpdateUserPayload = {
        firstName:  v.firstName ?? undefined,
        lastName:   v.lastName  ?? undefined,
        email:      v.email     ?? undefined,
        role:       (v.role as UserRole) ?? undefined,
        department: v.department || undefined,
        hourlyRate: v.hourlyRate ?? undefined,
      };
      this.ref.close(payload);
    } else {
      const payload: CreateUserPayload = {
        firstName:  v.firstName!,
        lastName:   v.lastName!,
        email:      v.email!,
        password:   v.password!,
        role:       v.role as UserRole,
        department: v.department ?? '',
        hourlyRate: v.hourlyRate ?? 0,
      };
      this.ref.close(payload);
    }
  }

  cancel(): void {
    this.ref.close();
  }
}
