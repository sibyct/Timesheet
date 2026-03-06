/**
 * @file modules/dashboard/dashboard.service.ts
 * @description Aggregates KPI data for the admin dashboard in a single call.
 *
 * All queries run in parallel via Promise.all to minimise latency.
 * Access: manager or admin only (enforced in controller / route).
 */

import { Types } from 'mongoose';
import { User, Project, Timesheet } from '@models/index';
import { ApiError } from '@utils/ApiError';

// ─── Return shapes ────────────────────────────────────────────────────────────

export interface PendingItem {
  timesheetId: string;
  userId:      string;
  userName:    string;
  periodStart: string;
  periodEnd:   string;
  totalHours:  number;
  submittedAt: string | null;
}

export interface OverBudgetItem {
  projectId:   string;
  projectName: string;
  projectCode: string;
  budget:      number;
  spentBudget: number;
}

export interface DashboardStats {
  users: {
    total:  number;
    active: number;
  };
  projects: {
    active:     number;
    overBudget: number;
  };
  approvals: {
    pending:           number;
    approvedThisMonth: number;
    rejectedThisMonth: number;
  };
  hours: {
    totalThisMonth:    number;
    billableThisMonth: number;
  };
  revenue: {
    thisMonth: number;
  };
  recentPending:      PendingItem[];
  overBudgetProjects: OverBudgetItem[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function startOfMonth(): Date {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

// ─── getDashboardStats ────────────────────────────────────────────────────────

export async function getDashboardStats(requesterRole: string): Promise<DashboardStats> {
  if (requesterRole !== 'manager' && requesterRole !== 'admin') {
    throw ApiError.forbidden('Only managers or admins can access the dashboard');
  }

  const monthStart = startOfMonth();

  // ── Run all queries in parallel ──────────────────────────────────────────────
  const [
    totalUsers,
    activeUsers,
    activeProjects,
    overBudgetCount,
    pendingCount,
    approvedThisMonth,
    rejectedThisMonth,
    hoursAgg,
    revenueAgg,
    recentPending,
    overBudgetProjects,
  ] = await Promise.all([

    // User counts
    User.countDocuments({}),
    User.countDocuments({ isActive: true }),

    // Project counts
    Project.countDocuments({ status: 'active', isActive: true }),
    Project.countDocuments({
      isActive: true,
      budget:   { $gt: 0 },
      $expr:    { $gt: ['$spentBudget', '$budget'] },
    }),

    // Approval counts
    Timesheet.countDocuments({ status: 'submitted' }),
    Timesheet.countDocuments({ status: 'approved', approvedAt: { $gte: monthStart } }),
    Timesheet.countDocuments({ status: 'rejected', rejectedAt: { $gte: monthStart } }),

    // Hours this month (approved timesheets)
    Timesheet.aggregate<{ totalHours: number; billableHours: number }>([
      { $match: { status: 'approved', periodStart: { $gte: monthStart } } },
      { $unwind: '$entries' },
      {
        $group: {
          _id:           null,
          totalHours:    { $sum: '$entries.hours' },
          billableHours: { $sum: { $cond: ['$entries.isBillable', '$entries.hours', 0] } },
        },
      },
    ]),

    // Revenue this month: billable hours × user hourly rate
    Timesheet.aggregate<{ totalAmount: number }>([
      { $match: { status: 'approved', periodStart: { $gte: monthStart } } },
      { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $unwind: '$entries' },
      { $match: { 'entries.isBillable': true } },
      {
        $group: {
          _id:         null,
          totalAmount: { $sum: { $multiply: ['$entries.hours', '$user.hourlyRate'] } },
        },
      },
    ]),

    // 5 most recently submitted timesheets (pending approval)
    Timesheet.aggregate<PendingItem>([
      { $match: { status: 'submitted' } },
      { $sort: { submittedAt: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from:         'users',
          localField:   'userId',
          foreignField: '_id',
          as:           'user',
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id:         0,
          timesheetId: { $toString: '$_id' },
          userId:      { $toString: '$userId' },
          userName: {
            $concat: [
              { $ifNull: ['$user.firstName', ''] },
              ' ',
              { $ifNull: ['$user.lastName', ''] },
            ],
          },
          periodStart: { $dateToString: { format: '%Y-%m-%d', date: '$periodStart' } },
          periodEnd:   { $dateToString: { format: '%Y-%m-%d', date: '$periodEnd'   } },
          totalHours:  1,
          submittedAt: { $dateToString: { format: '%Y-%m-%dT%H:%M:%SZ', date: '$submittedAt' } },
        },
      },
    ]),

    // Up to 5 projects most over budget
    Project.find({
      isActive: true,
      budget:   { $gt: 0 },
      $expr:    { $gt: ['$spentBudget', '$budget'] },
    })
      .sort({ spentBudget: -1 })
      .limit(5)
      .select('name code budget spentBudget')
      .lean(),
  ]);

  // ── Shape the response ───────────────────────────────────────────────────────

  const hoursRow    = hoursAgg[0]   ?? { totalHours: 0, billableHours: 0 };
  const revenueRow  = revenueAgg[0] ?? { totalAmount: 0 };

  const mappedOverBudget: OverBudgetItem[] = overBudgetProjects.map((p) => ({
    projectId:   String((p as unknown as { _id: Types.ObjectId })._id),
    projectName: p.name,
    projectCode: p.code,
    budget:      p.budget,
    spentBudget: p.spentBudget,
  }));

  return {
    users:    { total: totalUsers, active: activeUsers },
    projects: { active: activeProjects, overBudget: overBudgetCount },
    approvals: {
      pending:           pendingCount,
      approvedThisMonth: approvedThisMonth,
      rejectedThisMonth: rejectedThisMonth,
    },
    hours:   { totalThisMonth: hoursRow.totalHours, billableThisMonth: hoursRow.billableHours },
    revenue: { thisMonth: revenueRow.totalAmount },
    recentPending:      recentPending,
    overBudgetProjects: mappedOverBudget,
  };
}
