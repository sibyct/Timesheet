import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import type { Project, CreateProjectPayload, UpdateProjectPayload } from '../../../../core/models/project.models';

export interface ProjectFormDialogData {
  project?: Project;   // undefined = create mode
}

export type ProjectFormDialogResult = CreateProjectPayload | UpdateProjectPayload;

const PROJECT_STATUSES = ['active', 'on_hold', 'completed', 'archived'] as const;

@Component({
  selector:    'app-project-form-dialog',
  standalone:  true,
  imports:     [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
  ],
  templateUrl: './project-form-dialog.component.html',
  styleUrl:    './project-form-dialog.component.scss',
})
export class ProjectFormDialogComponent implements OnInit {
  readonly data: ProjectFormDialogData = inject(MAT_DIALOG_DATA);
  private  ref  = inject(MatDialogRef<ProjectFormDialogComponent, ProjectFormDialogResult>);
  private  fb   = inject(FormBuilder);

  readonly statuses = PROJECT_STATUSES;
  readonly isEdit   = !!this.data?.project;

  readonly form = this.fb.nonNullable.group({
    name:        ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
    code:        ['', [Validators.required, Validators.pattern(/^[A-Z0-9\-]{2,20}$/)]],
    description: [''],
    clientId:    ['', Validators.required],
    budget:      [0, [Validators.min(0)]],
    status:      ['active' as typeof PROJECT_STATUSES[number]],
    startDate:   ['' as string],
    endDate:     ['' as string],
  });

  ngOnInit(): void {
    const p = this.data?.project;
    if (p) {
      this.form.patchValue({
        name:        p.name,
        code:        p.code,
        description: p.description,
        clientId:    p.clientId,
        budget:      p.budget,
        status:      p.status,
        startDate:   p.startDate ? p.startDate.slice(0, 10) : '',
        endDate:     p.endDate   ? p.endDate.slice(0, 10)   : '',
      });
      // Code is immutable after creation
      this.form.get('code')!.disable();
      this.form.get('clientId')!.disable();
    }
  }

  get codeCtrl(): AbstractControl { return this.form.get('code')!; }

  onCodeInput(): void {
    const ctrl = this.codeCtrl;
    ctrl.setValue(ctrl.value.toUpperCase().replace(/[^A-Z0-9\-]/g, ''));
  }

  submit(): void {
    if (this.form.invalid) return;
    const raw = this.form.getRawValue();
    const result: Record<string, unknown> = {
      name:        raw.name,
      description: raw.description,
      budget:      raw.budget,
      status:      raw.status,
      startDate:   raw.startDate ? new Date(raw.startDate).toISOString() : null,
      endDate:     raw.endDate   ? new Date(raw.endDate).toISOString()   : null,
    };
    if (!this.isEdit) {
      result['code']     = raw.code;
      result['clientId'] = raw.clientId;
    }
    this.ref.close(result as ProjectFormDialogResult);
  }

  cancel(): void {
    this.ref.close();
  }
}
