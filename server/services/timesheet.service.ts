import moment from "moment";
import mongoose from "mongoose";
import { ITimesheetEntry } from "../types/index";
import Timesheet, { ITimesheetDocument } from "../models/timesheet.model";
import User from "../models/user.model";

export interface WeekData {
  data: ITimesheetDocument[];
  dateRanges: string[];
  projects: unknown[];
  clients: unknown[];
}

export interface SaveEntriesParams {
  dataNeedToUpdate: ITimesheetEntry[];
  newData: ITimesheetEntry[];
  name: string;
  userId: number;
}

export const TimesheetService = {
  buildWeeklyRanges(): string[] {
    const weeks: string[] = [];
    let day = moment(new Date(2016, 7, 1));
    const endDate = moment(new Date());

    while (day <= endDate) {
      const firstDate = day.format("MM/DD/YYYY");
      let lastDate = day.clone().add(6, "d").format("MM/DD/YYYY");
      if (moment(new Date(lastDate)) > endDate) {
        lastDate = moment(new Date()).format("MM/DD/YYYY");
      }
      weeks.push(`${firstDate}-${lastDate}`);
      day = day.add(1, "d").add(6, "d");
    }
    return weeks;
  },

  async getOrInitWeek(
    firstWeekDay: moment.Moment,
    lastWeekDay: moment.Moment,
    userId: number,
    weeks?: string[],
  ): Promise<WeekData> {
    const resData = await Timesheet.find({
      $and: [
        { date: { $gte: firstWeekDay.toDate(), $lte: lastWeekDay.toDate() } },
        { userId },
      ],
    }).sort({ date: 1 });

    const userData = await User.findOne({ userId });

    const buildResult = (data: ITimesheetDocument[]): WeekData => ({
      data,
      dateRanges: weeks || [],
      projects: userData?.projects || [],
      clients: userData?.clients || [],
    });

    if (resData.length === 0) {
      const datesArr: ITimesheetEntry[] = [];
      let day = firstWeekDay.clone();
      while (day <= lastWeekDay) {
        datesArr.push({
          userId,
          date: day.toDate(),
          hours: 0,
          comments: "",
          submitted: 0,
          saved: 0,
        });
        day.add(1, "d");
      }
      await Timesheet.insertMany(datesArr);
      const inserted = await Timesheet.find({
        $and: [
          { date: { $gte: firstWeekDay.toDate(), $lte: lastWeekDay.toDate() } },
          { userId },
        ],
      }).sort({ date: 1 });
      return buildResult(inserted);
    }

    const lastEntry = resData[resData.length - 1];
    const lastDate = moment(lastEntry.date);

    if (
      lastDate.isoWeekday() !== 7 &&
      lastDate.toDate().setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0)
    ) {
      const datesArr: ITimesheetEntry[] = [];
      let day = lastDate.clone().add(1, "d");
      const today = moment(new Date());
      while (day <= today) {
        datesArr.push({
          userId,
          date: day.toDate(),
          hours: 0,
          comments: "",
          submitted: 0,
          saved: 0,
        });
        day.add(1, "d");
      }
      await Timesheet.insertMany(datesArr);
      const combined = await Timesheet.find({
        $and: [
          { date: { $gte: firstWeekDay.toDate(), $lte: lastWeekDay.toDate() } },
          { userId },
        ],
      }).sort({ date: 1 });
      return buildResult(combined);
    }

    return buildResult(resData);
  },

  async saveEntries(
    params: SaveEntriesParams,
    submitted = 0,
  ): Promise<ITimesheetDocument[]> {
    const { dataNeedToUpdate, newData, name, userId } = params;

    if (dataNeedToUpdate && dataNeedToUpdate.length > 0) {
      const bulkOps = dataNeedToUpdate.map((entry: ITimesheetEntry) => ({
        updateOne: {
          filter: {
            $and: [
              {
                _id: { $eq: new mongoose.Types.ObjectId(entry._id as string) },
              },
              { userId: { $eq: userId } },
            ],
          },
          update: {
            $set: {
              ...entry,
              _id: new mongoose.Types.ObjectId(entry._id as string),
              date: new Date(entry.date),
              firstName: name,
              submitted,
              adminTime: entry.hours,
              admincomments: entry.comments,
              adminProject: entry.project,
              adminClient: entry.clients,
              adminProjectType: entry.projectType,
            },
          },
        },
      }));
      await Timesheet.bulkWrite(bulkOps);
    }

    if (newData && newData.length > 0) {
      const toInsert = newData.map((entry: ITimesheetEntry) => ({
        ...entry,
        userId,
        firstName: name,
        date: new Date(entry.date),
        submitted,
        adminTime: entry.hours,
        admincomments: entry.comments,
        adminProject: entry.project,
        adminClient: entry.clients,
        adminProjectType: entry.projectType,
      }));
      await Timesheet.insertMany(toInsert);
    }

    const startDate = dataNeedToUpdate?.[0]?.date || newData?.[0]?.date;
    const lastDate =
      dataNeedToUpdate?.[dataNeedToUpdate.length - 1]?.date ||
      newData?.[newData.length - 1]?.date;

    return Timesheet.find({
      $and: [
        {
          date: {
            $gte: moment(startDate).toDate(),
            $lte: moment(lastDate).toDate(),
          },
        },
        { userId },
      ],
    }).sort({ date: 1 });
  },

  async getProfile(userId: number) {
    return User.findOne(
      { userId },
      { userId: 0, _id: 0, password: 0, __v: 0, role: 0 },
    );
  },

  async saveProfile(
    userId: number,
    data: {
      firstName?: string;
      lastName?: string;
      emailAddress?: string;
      phoneNo?: string;
      address?: string;
      address2?: string;
    },
  ): Promise<void> {
    await User.updateOne(
      { userId },
      {
        $set: {
          firstName: data.firstName,
          lastName: data.lastName,
          emailAddress: data.emailAddress,
          phoneNo: data.phoneNo,
          address: data.address,
          address2: data.address2,
        },
      },
    );
  },
};
