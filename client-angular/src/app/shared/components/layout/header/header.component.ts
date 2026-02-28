import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';
import { ChangePasswordDialogComponent } from '../change-password-dialog/change-password-dialog.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDialogModule,
    MatSnackBarModule,
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  firstName = '';
  isAdmin = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    const user = this.authService.getUserInfo();
    if (user) {
      this.firstName = user.firstName;
      this.isAdmin = user.role === 0;
    }
  }

  goToProfile(): void {
    this.router.navigate(['/profile']);
  }

  openChangePassword(): void {
    const ref = this.dialog.open(ChangePasswordDialogComponent, {
      width: '380px',
      disableClose: true,
    });
    ref.afterClosed().subscribe((changed) => {
      if (changed) {
        this.snackBar.open('Password changed successfully', 'Close', { duration: 3000 });
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
