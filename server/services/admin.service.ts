import { randomBytes } from "crypto";
import moment from "moment";
import mongoose from "mongoose";
import { SearchCriteria, ITimesheetEntry, IUser } from "../types/index";
import User from "../models/user.model";
import Timesheet, { ITimesheetDocument } from "../models/timesheet.model";
import Client from "../models/client.model";
import { AppError } from "../utils/app-error";

export const AdminService = {
  buildQuery(reqData: SearchCriteria): Record<string, unknown>[] {
    const query: Record<string, unknown>[] = [{ submitted: 1 }];

    const date: Record<string, Date> = {
      ...(reqData.fromDate && { $gte: moment(reqData.fromDate).toDate() }),
      ...(reqData.toDate && { $lte: moment(reqData.toDate).toDate() }),
    };

    if (Object.keys(date).length) query.push({ date });

    if (reqData.project) {
      query.push({ adminProject: reqData.project });
    }

    if (reqData.client) {
      query.push({ adminClient: reqData.client });
    }

    if (reqData.projectType) {
      query.push({ adminProjectType: reqData.projectType });
    }

    if (reqData.users) {
      query.push({ userId: reqData.users.userId });
    }

    return query;
  },

  async getUsers() {
    return User.find({ role: 1 }, { salt: 0, password: 0, __v: 0 });
  },

  async getRegisterFormData() {
    const [lastUser, projects] = await Promise.all([
      User.findOne().sort({ userId: -1 }),
      Client.find(),
    ]);
    return { lastUser, projects };
  },

  async registerUser(
    data: IUser & { projectList: string[]; clientsList: string[] },
  ): Promise<{ password: string }> {
    // Check for existing username
    const existing = await User.findOne({ username: data.username });
    if (existing) {
      throw new AppError(
        "Username already exists. Please choose a different username.",
        409,
      );
    }

    // Check for existing userId
    const existingId = await User.findOne({ userId: data.userId });
    if (existingId) {
      throw new AppError(
        "User ID already exists. Please choose a different user ID.",
        409,
      );
    }

    // Generate cryptographically secure plain-text password — pre-save hook hashes it
    const plainPassword = randomBytes(6).toString("base64url");
    const {
      userId,
      hourlyPay,
      firstName,
      lastName,
      emailAddress,
      phoneNo,
      contractType,
      address,
      address2,
    } = data;

    const newUser = new User({
      username: data.username,
      password: plainPassword,
      role: 1,
      projects: data.projectList,
      clients: data.clientsList,
      userId,
      hourlyPay,
      firstName,
      lastName,
      emailAddress,
      phoneNo,
      contractType,
      address,
      address2,
    });

    await newUser.save();
    return { password: plainPassword };
  },

  async deleteUser(userId: string) {
    await User.deleteOne({ userId });
    return User.find({ role: 1 }, { salt: 0, password: 0, __v: 0 });
  },

  async updateUser({
    firstName,
    lastName,
    emailAddress,
    phoneNo,
    contractType,
    clients,
    projects,
    address,
    address2,
    username,
  }: IUser & { clients: string[]; projects: string[] }): Promise<IUser[]> {
    const result = await User.updateOne(
      { username },
      {
        $set: {
          firstName,
          lastName,
          emailAddress,
          phoneNo,
          contractType,
          clients,
          projects,
          address,
          address2,
        },
      },
    );

    if (result.matchedCount === 0) {
      throw new AppError("User not found.", 404);
    }

    return User.find({ role: 1 }, { salt: 0, password: 0, __v: 0 });
  },

  async search(criteria: SearchCriteria): Promise<ITimesheetDocument[]> {
    const query = this.buildQuery(criteria);
    return Timesheet.find({ $and: query }).sort({ date: 1 });
  },

  async saveAdminData(
    dataToUpdate: ITimesheetEntry[],
    searchCriteria: SearchCriteria,
  ): Promise<ITimesheetDocument[]> {
    if (dataToUpdate && dataToUpdate.length > 0) {
      const bulkOps = dataToUpdate.map((entry: ITimesheetEntry) => {
        const { _id, ...mutableFields } = entry;
        return {
          updateOne: {
            filter: {
              $and: [
                { _id: { $eq: new mongoose.Types.ObjectId(_id as string) } },
                { userId: { $eq: entry.userId } },
              ],
            },
            update: {
              $set: {
                ...mutableFields,
                date: new Date(entry.date),
              },
            },
          },
        };
      });
      await Timesheet.bulkWrite(bulkOps);
    }
    return this.search(searchCriteria);
  },

  async exportCSV(criteria: SearchCriteria): Promise<string> {
    const timesheets = await Timesheet.find({
      $and: this.buildQuery(criteria),
    }).sort({ date: 1 });

    const escape = (val: unknown) => {
      const str = String(val ?? "");
      return /[,"\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
    };

    const header = [
      "Date",
      "User Id",
      "Client",
      "Project",
      "Project Type",
      "Hours Worked",
      "Comments",
    ];

    const rows = timesheets.map((t) => [
      moment(t.date).format("MM/DD/YYYY"),
      t.userId,
      t.clients ?? "",
      t.project,
      t.projectType,
      t.hours,
      t.comments,
    ]);

    return [header, ...rows].map((r) => r.map(escape).join(",")).join("\n");
  },

  async resetPassword(username: string): Promise<{ password: string }> {
    const user = await User.findOne({ username });

    if (!user)
      throw new AppError(
        "User not found. Cannot reset password for non-existent user.",
        404,
      );

    const plainPassword = randomBytes(6).toString("base64url");
    user.password = plainPassword;
    await user.save();
    return { password: plainPassword };
  },
};
