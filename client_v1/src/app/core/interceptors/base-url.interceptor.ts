import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

/**
 * Prepends `environment.baseUrl` to every request whose URL is relative
 * (does not start with http:// or https://).
 * Absolute URLs — Google Fonts, external CDNs, etc. — pass through unchanged.
 */
export const baseUrlInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.startsWith('http://') || req.url.startsWith('https://')) {
    return next(req);
  }

  const apiReq = req.clone({
    url: `${environment.baseUrl}${req.url.startsWith('/') ? '' : '/'}${req.url}`,
  });

  return next(apiReq);
};
