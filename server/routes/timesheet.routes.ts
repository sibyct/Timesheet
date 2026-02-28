import { Router, Response } from 'express';
import moment from 'moment';
import mongoose from 'mongoose';
import { authenticate } from '../middleware/auth.middleware';
import { AuthRequest, ITimesheetEntry } from '../types/index';
import Timesheet from '../models/timesheet.model';
import User from '../models/user.model';

const router = Router();

// Build weekly date ranges from Aug 2016 to today
function buildWeeklyRanges(): string[] {
  const weeks: string[] = [];
  let day = moment(new Date(2016, 7, 1));
  const endDate = moment(new Date());

  while (day <= endDate) {
    const firstDate = day.format('MM/DD/YYYY');
    let lastDate = day.clone().add(6, 'd').format('MM/DD/YYYY');
    if (moment(new Date(lastDate)) > endDate) {
      lastDate = moment(new Date()).format('MM/DD/YYYY');
    }
    weeks.push(`${firstDate}-${lastDate}`);
    day = day.add(1, 'd').add(6, 'd');
  }
  return weeks;
}

async function saveDateRange(
  firstWeekDay: moment.Moment,
  lastWeekDay: moment.Moment,
  userId: number,
  res: Response,
  weeks?: string[],
): Promise<void> {
  try {
    const resData = await Timesheet.find({
      $and: [
        { date: { $gte: firstWeekDay.toDate(), $lte: lastWeekDay.toDate() } },
        { userId: userId },
      ],
    }).sort({ date: 1 });

    const userData = await User.findOne({ userId });

    if (resData.length === 0) {
      const datesArr: ITimesheetEntry[] = [];
      let day = firstWeekDay.clone();
      while (day <= lastWeekDay) {
        datesArr.push({
          userId,
          date: day.toDate(),
          hours: 0,
          comments: '',
          submitted: 0,
          saved: 0,
        });
        day.add(1, 'd');
      }
      await Timesheet.insertMany(datesArr);
      const inserted = await Timesheet.find({
        $and: [
          { date: { $gte: firstWeekDay.toDate(), $lte: lastWeekDay.toDate() } },
          { userId },
        ],
      }).sort({ date: 1 });

      res.status(200).json({
        data: inserted,
        dateRanges: weeks || [],
        projects: userData?.projects || [],
        clients: userData?.clients || [],
      });
      return;
    }

    const lastEntry = resData[resData.length - 1];
    const lastDate = moment(lastEntry.date);

    if (
      lastDate.isoWeekday() !== 7 &&
      lastDate.toDate().setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0)
    ) {
      const datesArr: ITimesheetEntry[] = [];
      let day = lastDate.clone().add(1, 'd');
      const today = moment(new Date());
      while (day <= today) {
        datesArr.push({
          userId,
          date: day.toDate(),
          hours: 0,
          comments: '',
          submitted: 0,
          saved: 0,
        });
        day.add(1, 'd');
      }
      await Timesheet.insertMany(datesArr);
      const combined = await Timesheet.find({
        $and: [
          { date: { $gte: firstWeekDay.toDate(), $lte: lastWeekDay.toDate() } },
          { userId },
        ],
      }).sort({ date: 1 });

      res.status(200).json({
        data: combined,
        dateRanges: weeks || [],
        projects: userData?.projects || [],
        clients: userData?.clients || [],
      });
    } else {
      res.status(200).json({
        data: resData,
        dateRanges: weeks || [],
        projects: userData?.projects || [],
        clients: userData?.clients || [],
      });
    }
  } catch (err) {
    res.status(500).json({ status: 'Server error', error: err });
  }
}

// GET /time/getUserTimeLogin
router.get('/getUserTimeLogin', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const weeks = buildWeeklyRanges();
  const dateRanges = weeks[0].split('-');
  const firstWeekDay = moment(new Date(dateRanges[0]));
  const lastWeekDay = moment(new Date(dateRanges[1]));
  await saveDateRange(firstWeekDay, lastWeekDay, req.user!.userId, res, weeks);
});

// POST /time/getDateInfoBetweenDates
router.post('/getDateInfoBetweenDates', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const dateRanges = req.body.date.split('-');
  const firstWeekDay = moment(new Date(dateRanges[0]));
  const lastWeekDay = moment(new Date(dateRanges[1]));
  await saveDateRange(firstWeekDay, lastWeekDay, req.user!.userId, res);
});

// POST /time/updateTimeSheet
router.post('/updateTimeSheet', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { dataNeedToUpdate, newData, name } = req.body;
  const userId = req.user!.userId;

  try {
    // Update existing records using bulkWrite
    if (dataNeedToUpdate && dataNeedToUpdate.length > 0) {
      const bulkOps = dataNeedToUpdate.map((entry: ITimesheetEntry) => ({
        updateOne: {
          filter: {
            $and: [
              { _id: { $eq: new mongoose.Types.ObjectId(entry._id as string) } },
              { userId: { $eq: userId } },
            ],
          },
          update: {
            $set: {
              ...entry,
              _id: new mongoose.Types.ObjectId(entry._id as string),
              date: new Date(entry.date),
              firstName: name,
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

    // Insert new records
    if (newData && newData.length > 0) {
      const toInsert = newData.map((entry: ITimesheetEntry) => ({
        ...entry,
        userId,
        firstName: name,
        date: new Date(entry.date),
        adminTime: entry.hours,
        admincomments: entry.comments,
        adminProject: entry.project,
        adminClient: entry.clients,
        adminProjectType: entry.projectType,
      }));
      await Timesheet.insertMany(toInsert);
    }

    const startDate = dataNeedToUpdate?.[0]?.date || newData?.[0]?.date;
    const lastDate = dataNeedToUpdate?.[dataNeedToUpdate.length - 1]?.date || newData?.[newData.length - 1]?.date;

    const updated = await Timesheet.find({
      $and: [
        { date: { $gte: moment(startDate).toDate(), $lte: moment(lastDate).toDate() } },
        { userId },
      ],
    }).sort({ date: 1 });

    res.status(200).json({ data: updated, status: 'Saved Successfully' });
  } catch (err) {
    res.status(500).json({ status: 'Server error', error: err });
  }
});

// POST /time/submitTimeSheet
router.post('/submitTimeSheet', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { dataNeedToUpdate, newData, name } = req.body;
  const userId = req.user!.userId;

  try {
    if (dataNeedToUpdate && dataNeedToUpdate.length > 0) {
      const bulkOps = dataNeedToUpdate.map((entry: ITimesheetEntry) => ({
        updateOne: {
          filter: {
            $and: [
              { _id: { $eq: new mongoose.Types.ObjectId(entry._id as string) } },
              { userId: { $eq: userId } },
            ],
          },
          update: {
            $set: {
              ...entry,
              _id: new mongoose.Types.ObjectId(entry._id as string),
              date: new Date(entry.date),
              firstName: name,
              adminTime: entry.hours,
              submitted: 1,
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
        adminTime: entry.hours,
        submitted: 1,
        admincomments: entry.comments,
        adminProject: entry.project,
        adminClient: entry.clients,
        adminProjectType: entry.projectType,
      }));
      await Timesheet.insertMany(toInsert);
    }

    const startDate = dataNeedToUpdate?.[0]?.date || newData?.[0]?.date;
    const lastDate = dataNeedToUpdate?.[dataNeedToUpdate.length - 1]?.date || newData?.[newData.length - 1]?.date;

    const updated = await Timesheet.find({
      $and: [
        { date: { $gte: moment(startDate).toDate(), $lte: moment(lastDate).toDate() } },
        { userId },
      ],
    }).sort({ date: 1 });

    res.status(200).json({ data: updated, status: 'Saved Successfully' });
  } catch (err) {
    res.status(500).json({ status: 'Server error', error: err });
  }
});

// GET /time/getProfileInfo
router.get('/getProfileInfo', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findOne(
      { userId: req.user!.userId },
      { userId: 0, _id: 0, password: 0, __v: 0, role: 0 },
    );
    res.status(200).json({ data: user, status: 'Retrieved Successfully' });
  } catch (err) {
    res.status(500).json({ status: 'Server error', error: err });
  }
});

// POST /time/saveProfileInfo
router.post('/saveProfileInfo', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const data = req.body;
  try {
    await User.updateOne(
      { userId: req.user!.userId },
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
    res.status(200).json({ status: 'Saved Successfully' });
  } catch (err) {
    res.status(500).json({ status: 'Server error', error: err });
  }
});

export default router;
