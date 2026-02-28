import moment from "moment";
import mongoose from "mongoose";
import { SearchCriteria, ITimesheetEntry } from "../types/index";
import User from "../models/user.model";
import Timesheet, { ITimesheetDocument } from "../models/timesheet.model";
import Client from "../models/client.model";
import { AppError } from "../utils/app-error";
import { IUser } from "../types";

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

  async getLastUserId() {
    const [lastUser, projects] = await Promise.all([
      User.findOne().sort({ userId: -1 }),
      Client.find(),
    ]);
    return { lastUser, projects };
  },

  async registerUser(
    data: IUser & { projectList: string[]; clientsList: string[] },
  ): Promise<void> {
    // Check for existing username
    const existing = await User.findOne({ username: data.username });
    if (existing) {
      throw new AppError(
        "Username already exists. Please choose a different username.",
        409,
      );
    }

    // Generate plain-text password — pre-save hook on User model hashes it
    const plainPassword = Math.random().toString(36).slice(-8);

    const newUser = new User({
      username: data.username,
      password: plainPassword,
      userId: data.userId,
      hourlyPay: data.hourlyPay,
      firstName: data.firstName,
      lastName: data.lastName,
      emailAddress: data.emailAddress,
      phoneNo: data.phoneNo,
      role: 1,
      contractType: data.contractType,
      projects: data.projectList,
      clients: data.clientsList,
      address: data.address,
      address2: data.address2,
    });

    await newUser.save();
  },

  async deleteUser(userId: string) {
    await User.deleteOne({ userId });
    return User.find({ role: 1 }, { _id: 0, password: 0, __v: 0 });
  },

  async updateUser(data: {
    username: string;
    firstName: string;
    lastName: string;
    emailAddress: string;
    phoneNo: string;
    contractType: string;
    clients: unknown[];
    projects: unknown[];
    address: string;
    address2: string;
  }) {
    await User.updateOne(
      { username: data.username },
      {
        $set: {
          firstName: data.firstName,
          lastName: data.lastName,
          emailAddress: data.emailAddress,
          phoneNo: data.phoneNo,
          contractType: data.contractType,
          clients: data.clients,
          projects: data.projects,
          address: data.address,
          address2: data.address2,
        },
      },
    );
    return User.find({ role: 1 });
  },

  async search(criteria: SearchCriteria): Promise<ITimesheetDocument[]> {
    const query = AdminService.buildQuery(criteria);
    return Timesheet.find({ $and: query }).sort({ date: 1 });
  },

  async saveAdminData(
    dataToUpdate: ITimesheetEntry[],
    searchCriteria: SearchCriteria,
  ): Promise<ITimesheetDocument[]> {
    if (dataToUpdate && dataToUpdate.length > 0) {
      const bulkOps = dataToUpdate.map((entry: ITimesheetEntry) => ({
        updateOne: {
          filter: {
            $and: [
              {
                _id: { $eq: new mongoose.Types.ObjectId(entry._id as string) },
              },
              { userId: { $eq: entry.userId } },
            ],
          },
          update: {
            $set: {
              ...entry,
              _id: new mongoose.Types.ObjectId(entry._id as string),
              date: new Date(entry.date),
            },
          },
        },
      }));
      await Timesheet.bulkWrite(bulkOps);
    }
    return AdminService.search(searchCriteria);
  },

  async exportCSV(criteria: SearchCriteria): Promise<string> {
    const timesheets = await Timesheet.find({
      $and: AdminService.buildQuery(criteria),
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
      t.clients,
      t.project,
      t.projectType,
      t.hours,
      t.comments,
    ]);

    return [header, ...rows].map((r) => r.map(escape).join(",")).join("\n");
  },

  async resetPassword(username: string): Promise<void> {
    const user = await User.findOne({ username });

    if (!user)
      throw new AppError(
        "User not found. Cannot reset password for non-existent user.",
        404,
      );

    user.password = Math.random().toString(36).slice(-8);
    await user.save();
  },
};
