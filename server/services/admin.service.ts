import moment from "moment";
import mongoose from "mongoose";
import { SearchCriteria, ITimesheetEntry } from "../types/index";
import User from "../models/user.model";
import Timesheet, { ITimesheetDocument } from "../models/timesheet.model";
import Client from "../models/client.model";

export const AdminService = {
  buildQuery(reqData: SearchCriteria): Record<string, unknown>[] {
    const query: Record<string, unknown>[] = [];
    const dateObj: Record<string, unknown> = {};

    if (reqData.fromDate)
      dateObj["date"] = { $gte: moment(reqData.fromDate).toDate() };
    if (reqData.toDate) {
      if (!dateObj["date"]) dateObj["date"] = {};
      (dateObj["date"] as Record<string, unknown>)["$lte"] = moment(
        reqData.toDate,
      ).toDate();
    }
    query.push(dateObj);

    if (reqData.project) query.push({ adminProject: { $eq: reqData.project } });
    if (reqData.client) query.push({ adminClient: { $eq: reqData.client } });
    if (reqData.projectType)
      query.push({ adminProjectType: { $eq: reqData.projectType } });
    if (reqData.users) query.push({ userId: { $eq: reqData.users.userId } });

    query.push({ submitted: { $eq: 1 } });
    return query;
  },

  async getUsers() {
    return User.find({ role: 1 }, { salt: 0, password: 0, __v: 0 });
  },

  async getLastUserId() {
    const [lastUser] = await User.find().sort({ userId: -1 }).limit(1);
    const projects = await Client.find({});
    return { lastUser, projects };
  },

  async registerUser(data: {
    username: string;
    userId: number;
    hourlyPay: number;
    firstName: string;
    lastName: string;
    emailAddress: string;
    phoneNo: string;
    contractType: string;
    projectList: unknown[];
    clientsList: unknown[];
    address: string;
    address2: string;
  }): Promise<"saved" | "duplicatesFound"> {
    const existing = await User.findOne({ username: data.username });
    if (existing) return "duplicatesFound";

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
    return "saved";
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
      throw Object.assign(new Error("User not found"), { status: 404 });
    user.password = Math.random().toString(36).slice(-8);
    await user.save();
  },
};
