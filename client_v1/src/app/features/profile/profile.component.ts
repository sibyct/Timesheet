import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-title">My Profile</div>
    <p style="color: var(--ts-text-muted)">Profile feature — coming soon.</p>
  `,
})
export class ProfileComponent {}
