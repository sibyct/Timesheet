import mongoose, { Schema, Document, Types } from "mongoose";
export interface IUser extends Document {
  userId: string;
  firstName: string;
  lastName: string;
  emailAddress: string;
  password: string;
  phoneNo?: string;
  role: number; // e.g., 1 = employee, 2 = manager, etc.
  contractType?: string;
  hourlyPay?: number;
  projects?: string[]; // or ObjectId[] if referencing a Projects collection
  clients?: string[]; // or ObjectId[] if referencing a Clients collection
  address?: string;
  address2?: string;
  managerId?: Types.ObjectId; // optional hierarchy
  timesheets?: Types.ObjectId[]; // reference to Timesheet collection
  status?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const userSchema: Schema<IUser> = new Schema(
  {
    userId: { type: String, unique: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    emailAddress: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: { type: String, required: true },
    phoneNo: { type: String },
    role: { type: Number, default: 1 }, // default to employee
    contractType: { type: String },
    hourlyPay: { type: Number },
    projects: [{ type: String }], // or Schema.Types.ObjectId with ref 'Project'
    clients: [{ type: String }], // or Schema.Types.ObjectId with ref 'Client'
    address: { type: String },
    address2: { type: String },
    managerId: { type: Schema.Types.ObjectId, ref: "User" },
    timesheets: [{ type: Schema.Types.ObjectId, ref: "Timesheet" }],
    status: { type: Boolean, default: true },
  },
  { timestamps: true },
);

userSchema.pre<IUser>("save", async function () {
  if (!this.userId) {
    this.userId = "USR" + Date.now() + Math.floor(Math.random() * 10000); // e.g., USR167651234abcd
  }
});

export default mongoose.model<IUser>("User", userSchema);
