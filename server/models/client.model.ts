import mongoose, { Schema, Document } from 'mongoose';
import { Client } from '../types/index';

export interface IClientDocument extends Omit<Client, '_id'>, Document {}

const projectSchema = new Schema({
  projectName: String,
});

const ClientSchema = new Schema<IClientDocument>(
  {
    clientName: String,
    projects: [projectSchema],
  },
  { collection: 'clients' },
);

export default mongoose.model<IClientDocument>('clients', ClientSchema);
