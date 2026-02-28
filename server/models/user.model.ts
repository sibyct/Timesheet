import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser } from '../types/index';

export interface IUserDocument extends IUser, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const projectSchema = new Schema({
  projectName: String,
  refId: String,
});

const clientSchema = new Schema({
  _id: String,
  clientName: String,
  projects: [projectSchema],
});

const UserSchema = new Schema<IUserDocument>({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  userId: { type: Number },
  contractType: { type: String },
  projects: [projectSchema],
  clients: [clientSchema],
  hourlyPay: { type: Number },
  firstName: { type: String },
  lastName: { type: String },
  emailAddress: { type: String },
  phoneNo: { type: Number },
  address: { type: String },
  address2: { type: String },
  city: { type: String },
  state: { type: String },
  postalCode: { type: Number },
  role: { type: Number, default: 1 },
});

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUserDocument>('users', UserSchema);
