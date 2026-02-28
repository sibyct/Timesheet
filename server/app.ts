import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import mongoose from 'mongoose';
import { config } from './config/index';
import authRoutes from './routes/auth.routes';
import timesheetRoutes from './routes/timesheet.routes';
import adminRoutes from './routes/admin.routes';
import { notFound, errorHandler } from './middleware/error.middleware';

const app = express();

// Connect to MongoDB
mongoose
  .connect(config.mongoUri)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve Angular frontend build
app.use(express.static(path.join(__dirname, '../client-angular/dist/client-angular/browser')));

// API Routes
app.use('/user', authRoutes);
app.use('/time', timesheetRoutes);
app.use('/admin', adminRoutes);

// Catch-all: serve Angular app for all non-API routes (SPA routing)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/user') || req.path.startsWith('/time') || req.path.startsWith('/admin')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../client-angular/dist/client-angular/browser/index.html'));
});

// Error handlers
app.use(notFound);
app.use(errorHandler);

export default app;
