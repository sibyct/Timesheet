// core/guards/auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs/operators';

import { selectIsLoggedIn } from '@core/store/auth/auth.selectors';
import { LoggerService } from '@core/services/logger.service';
import { ROUTES } from '@core/constants/routes-path.constants';

export const authGuard: CanActivateFn = (route, state) => {
  const store = inject(Store);
  const router = inject(Router);
  const logger = inject(LoggerService).withContext('AuthGuard');

  return store.select(selectIsLoggedIn).pipe(
    take(1),
    map((isLoggedIn) => {
      if (isLoggedIn) {
        return true;
      }

      logger.warn('Unauthenticated access denied', {
        attemptedUrl: state.url,
      });

      return router.createUrlTree([ROUTES.LOGIN], {
        queryParams: { returnUrl: state.url },
      });
    }),
  );
};
