import { InjectionToken } from '@angular/core';
import { APP_CONSTANTS } from './app.config';
import { HttpConfig } from './http.config';
import { Environment } from '@core/types/envionments';
export const APP_CONFIG = new InjectionToken<typeof APP_CONSTANTS>(
  'APP_CONFIG',
);

export const HTTP_CONFIG_TOKEN = new InjectionToken<HttpConfig>('HTTP_CONFIG');

export const ENVIRONMENT = new InjectionToken<Environment>('ENVIRONMENT');
