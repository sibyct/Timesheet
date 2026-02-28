import mongoose, { Schema, Document } from 'mongoose';
import { ITimesheetEntry } from '../types/index';

export interface ITimesheetDocument extends Omit<ITimesheetEntry, '_id'>, Document {}

const TimesheetSchema = new Schema<ITimesheetDocument>(
  {
    userId: { type: Number },
    date: { type: Date },
    firstName: { type: String },
    clients: { type: String },
    project: { type: String },
    projectType: { type: String },
    hours: { type: Number },
    adminTime: { type: Number },
    comments: { type: String },
    admincomments: { type: String },
    adminProject: { type: String },
    adminClient: { type: String },
    adminProjectType: { type: String },
    submitted: { type: Number, default: 0 },
    saved: { type: Number, default: 0 },
  },
  { collection: 'userTimeData' },
);

export default mongoose.model<ITimesheetDocument>('userTimeData', TimesheetSchema);
