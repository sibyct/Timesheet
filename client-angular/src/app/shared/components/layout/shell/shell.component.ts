import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent],
  template: `
    <app-header></app-header>
    <main class="page-content">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [
    `
      .page-content {
        padding: 16px;
        max-width: 1400px;
        margin: 0 auto;
      }
    `,
  ],
})
export class ShellComponent {}
