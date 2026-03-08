// core/guards/admin.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs/operators';

import { selectAuthState } from '@core/store/auth/auth.selectors';
import { LoggerService } from '@core/services/logger.service';
import { ROUTES } from '@core/constants/routes-path.constants';
import { UserRole } from '@core/constants/user-role.constants';

export const adminGuard: CanActivateFn = (route, state) => {
  const store = inject(Store);
  const router = inject(Router);
  const logger = inject(LoggerService).withContext('AdminGuard');

  return store.select(selectAuthState).pipe(
    take(1),
    map((authState) => {
      // Only checks role — authGuard handles token upstream
      if (authState.user?.role === UserRole.ADMIN) return true;

      // Log access denial with context
      logger.warn('Admin access denied', {
        role: authState.user?.role,
        attemptedUrl: state.url,
      });

      // Redirect to forbidden — correct semantic
      return router.createUrlTree([ROUTES.LOGIN]);
    }),
  );
};
