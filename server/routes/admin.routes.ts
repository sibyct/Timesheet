import { Router, Response } from 'express';
import moment from 'moment';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { AuthRequest, SearchCriteria, ITimesheetEntry } from '../types/index';
import User from '../models/user.model';
import Client from '../models/client.model';
import Timesheet from '../models/timesheet.model';

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticate, requireAdmin);

function buildQuery(reqData: SearchCriteria): Record<string, unknown>[] {
  const query: Record<string, unknown>[] = [];
  const dateObj: Record<string, unknown> = {};

  if (reqData.fromDate) {
    dateObj['date'] = { $gte: moment(reqData.fromDate).toDate() };
  }
  if (reqData.toDate) {
    if (!dateObj['date']) dateObj['date'] = {};
    (dateObj['date'] as Record<string, unknown>)['$lte'] = moment(reqData.toDate).toDate();
  }
  query.push(dateObj);

  if (reqData.project) query.push({ adminProject: { $eq: reqData.project } });
  if (reqData.client) query.push({ adminClient: { $eq: reqData.client } });
  if (reqData.projectType) query.push({ adminProjectType: { $eq: reqData.projectType } });
  if (reqData.users) query.push({ userId: { $eq: reqData.users.userId } });

  query.push({ submitted: { $eq: 1 } });
  return query;
}

// GET /admin/getuserInfo
router.get('/getuserInfo', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await User.find({ role: 1 }, { salt: 0, password: 0, __v: 0 });
    res.status(200).json({ data: users, status: 'Retrieved Successfully' });
  } catch (err) {
    res.status(500).json({ status: 'Server error', error: err });
  }
});

// GET /admin/getuserId
router.get('/getuserId', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [lastUser] = await User.find().sort({ userId: -1 }).limit(1);
    const projects = await Client.find({});
    res.status(200).json({ data: [lastUser], projects });
  } catch (err) {
    res.status(500).json({ status: 'Server error', error: err });
  }
});

// POST /admin/register
router.post('/register', async (req: AuthRequest, res: Response): Promise<void> => {
  const data = req.body;
  try {
    const existing = await User.findOne({ username: data.username });
    if (existing) {
      res.status(200).json({ res: 'duplicatesFound' });
      return;
    }

    const passwordStr = Math.random().toString(36).slice(-8);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(passwordStr, salt);

    const newUser = new User({
      username: data.username,
      password: hashedPassword,
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

    res.status(200).json({ data, status: 'saved' });
  } catch (err) {
    res.status(500).json({ status: 'Server error', error: err });
  }
});

// GET /admin/deleteUser/:userId
router.get('/deleteUser/:userId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await User.deleteOne({ userId: req.params.userId });
    const users = await User.find({ role: 1 }, { _id: 0, password: 0, __v: 0 });
    res.status(200).json({ data: users, status: 'Retrieved Successfully' });
  } catch (err) {
    res.status(500).json({ status: 'Server error', error: err });
  }
});

// POST /admin/updateUserDetails
router.post('/updateUserDetails', async (req: AuthRequest, res: Response): Promise<void> => {
  const data = req.body;
  try {
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
    const users = await User.find({ role: 1 });
    res.status(200).json({ data: users, status: 'saved' });
  } catch (err) {
    res.status(500).json({ status: 'Server error', error: err });
  }
});

// GET /admin/getProjectList
router.get('/getProjectList', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const clients = await Client.find({});
    res.status(200).json({ data: clients, status: 'Retrieved' });
  } catch (err) {
    res.status(500).json({ status: 'Server error', error: err });
  }
});

// POST /admin/saveProjectList
router.post('/saveProjectList', async (req: AuthRequest, res: Response): Promise<void> => {
  const { newClients, updatedList } = req.body;
  try {
    if (newClients && newClients.length > 0) {
      await Client.insertMany(newClients);
    }
    if (updatedList && updatedList.length > 0) {
      const bulkOps = updatedList.map((client: { _id: string; clientName: string; projects: unknown[] }) => ({
        updateOne: {
          filter: { _id: new mongoose.Types.ObjectId(client._id) },
          update: { $set: { clientName: client.clientName, projects: client.projects } },
        },
      }));
      await Client.bulkWrite(bulkOps);
    }
    const clients = await Client.find({});
    res.status(200).json({ data: clients, status: 'saved' });
  } catch (err) {
    res.status(500).json({ status: 'Server error', error: err });
  }
});

// GET /admin/deleteProjectList/:id
router.get('/deleteProjectList/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await Client.deleteOne({ _id: new mongoose.Types.ObjectId(req.params.id) });
    res.status(200).json({ status: 'deleted' });
  } catch (err) {
    res.status(500).json({ status: 'Server error', error: err });
  }
});

// GET /admin/getProjectListAndUserList
router.get('/getProjectListAndUserList', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [clientsList, userList] = await Promise.all([
      Client.find({}),
      User.find({ role: 1 }),
    ]);
    res.status(200).json({ clientsList, userList });
  } catch (err) {
    res.status(500).json({ status: 'Server error', error: err });
  }
});

// POST /admin/getSearchDetails
router.post('/getSearchDetails', async (req: AuthRequest, res: Response): Promise<void> => {
  const query = buildQuery(req.body);
  try {
    const results = await Timesheet.find({ $and: query }).sort({ date: 1 });
    res.status(200).json({ data: results });
  } catch (err) {
    res.status(500).json({ status: 'Server error', error: err });
  }
});

// POST /admin/saveAdminData
router.post('/saveAdminData', async (req: AuthRequest, res: Response): Promise<void> => {
  const { dataToUpdate, searchCriteria } = req.body;
  try {
    if (dataToUpdate && dataToUpdate.length > 0) {
      const bulkOps = dataToUpdate.map((entry: ITimesheetEntry) => ({
        updateOne: {
          filter: {
            $and: [
              { _id: { $eq: new mongoose.Types.ObjectId(entry._id as string) } },
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

    const query = buildQuery(searchCriteria);
    const results = await Timesheet.find({ $and: query }).sort({ date: 1 });
    res.status(200).json({ data: results });
  } catch (err) {
    res.status(500).json({ status: 'Server error', error: err });
  }
});

// POST /admin/exportToExcel
router.post('/exportToExcel', async (req: AuthRequest, res: Response): Promise<void> => {
  const query = buildQuery(req.body);
  try {
    const timesheets = await Timesheet.find({ $and: query }).sort({ date: 1 });

    // Build CSV export (replacing the old excel-export library)
    const rows = timesheets.map((t) => [
      moment(t.date).format('MM/DD/YYYY'),
      t.userId,
      t.clients || '',
      t.project || '',
      t.projectType || '',
      t.hours || '',
      t.comments || '',
    ]);

    const header = ['Date', 'User Id', 'Client', 'Project', 'Project Type', 'Hours Worked', 'Comments'];
    const csvRows = [header, ...rows].map((r) => r.map(String).join(',')).join('\n');

    res.setHeader('Content-Disposition', 'attachment; filename=timesheet.csv');
    res.setHeader('Content-Type', 'text/csv');
    res.send(csvRows);
  } catch (err) {
    res.status(500).json({ status: 'Server error', error: err });
  }
});

// GET /admin/resetPassword/:username
router.get('/resetPassword/:username', async (req: AuthRequest, res: Response): Promise<void> => {
  const newPassword = Math.random().toString(36).slice(-8);
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    user.password = newPassword;
    await user.save();
    res.status(200).json({ message: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ status: 'Server error', error: err });
  }
});

export default router;
