import app from './app';
import { config } from './config/index';

const server = app.listen(config.port, () => {
  console.log(`Timesheet server running on port ${config.port}`);
});

process.on('SIGTERM', () => {
  server.close(() => {
    console.log('Server shut down gracefully');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  server.close(() => {
    console.log('Server shut down gracefully');
    process.exit(0);
  });
});
