import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn() && auth.getUserRole() === 0) return true;

  router.navigate([auth.isLoggedIn() ? '/timesheet' : '/login']);
  return false;
};
