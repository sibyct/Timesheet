import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector:    'app-empty-state',
  standalone:  true,
  imports:     [MatIconModule],
  templateUrl: './empty-state.component.html',
})
export class EmptyStateComponent {
  readonly icon    = input<string>('inbox');
  readonly title   = input<string>('Nothing here yet');
  readonly message = input<string>('');
}
