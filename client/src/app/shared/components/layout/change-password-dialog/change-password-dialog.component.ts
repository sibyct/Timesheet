import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';

function passwordMatchValidator(group: AbstractControl) {
  const pw = group.get('newPassword')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return pw === confirm ? null : { mismatch: true };
}

@Component({
  selector: 'app-change-password-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>Change Password</h2>
    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>New Password</mat-label>
          <input matInput type="password" formControlName="newPassword" />
          @if (form.get('newPassword')?.hasError('required') && form.get('newPassword')?.touched) {
            <mat-error>This field is required</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Confirm New Password</mat-label>
          <input matInput type="password" formControlName="confirmPassword" />
          @if (form.hasError('mismatch') && form.get('confirmPassword')?.touched) {
            <mat-error>Passwords do not match</mat-error>
          }
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" (click)="submit()" [disabled]="form.invalid">
        Change Password
      </button>
    </mat-dialog-actions>
  `,
  styles: ['.full-width { width: 100%; margin-bottom: 12px; }'],
})
export class ChangePasswordDialogComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private dialogRef: MatDialogRef<ChangePasswordDialogComponent>,
  ) {
    this.form = this.fb.group(
      {
        newPassword: ['', Validators.required],
        confirmPassword: ['', Validators.required],
      },
      { validators: passwordMatchValidator },
    );
  }

  submit(): void {
    if (this.form.invalid) return;
    this.authService.changePassword(this.form.value.newPassword).subscribe({
      next: () => this.dialogRef.close(true),
    });
  }
}
