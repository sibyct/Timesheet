export const APP_CONSTANTS = {
  appName: 'Timesheet',
  defaultPageSize: 10,
  maxPageSize: 100,
  debounceTime: 300,
  toastDuration: 3000,
  sessionTimeout: 1800000, // 30 mins
  dateFormat: 'DD/MM/YYYY',
  timeFormat: 'HH:mm',
  currencyCode: 'USD',
  maxFileSize: 5242880, // 5MB
  allowedFileTypes: ['pdf', 'xlsx', 'csv'],
} as const;
