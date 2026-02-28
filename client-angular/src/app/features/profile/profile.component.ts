import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ProfileService } from '../../core/services/profile.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatSnackBarModule,
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  states = ['Kerala', 'Karnataka'];

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      emailAddress: ['', [Validators.required, Validators.email]],
      phoneNo: [''],
      address: [''],
      address2: [''],
      city: [''],
      state: [''],
    });
  }

  ngOnInit(): void {
    this.profileService.getProfileInfo().subscribe((res) => {
      if (res.data) {
        this.profileForm.patchValue(res.data);
      }
    });
  }

  save(): void {
    if (this.profileForm.invalid) return;
    this.profileService.saveProfileInfo(this.profileForm.value).subscribe({
      next: () => {
        this.snackBar.open('Saved Successfully', 'Close', { duration: 3000 });
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/timesheet']);
  }
}
