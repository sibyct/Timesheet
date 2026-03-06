import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';

export interface RejectDialogData {
  employeeName: string;
  period:       string;
}

export interface RejectDialogResult {
  reason: string;
}

@Component({
  selector:    'app-reject-dialog',
  standalone:  true,
  imports:     [
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
  ],
  templateUrl: './reject-dialog.component.html',
  styleUrl:    './reject-dialog.component.scss',
})
export class RejectDialogComponent {
  readonly data: RejectDialogData = inject(MAT_DIALOG_DATA);
  private  ref  = inject(MatDialogRef<RejectDialogComponent, RejectDialogResult>);

  reason = '';

  confirm(): void {
    const trimmed = this.reason.trim();
    if (!trimmed) return;
    this.ref.close({ reason: trimmed });
  }

  cancel(): void {
    this.ref.close();
  }
}
