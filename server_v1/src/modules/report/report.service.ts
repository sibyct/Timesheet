/**
 * @file modules/report/report.service.ts
 * @description Aggregation-based reports: utilization (hours per user) and
 *              billing (billable hours × hourly rate per project).
 *
 * Access: manager or admin only.
 */

import { Types } from 'mongoose';
import { Timesheet } from '@models/index';
import { ApiError } from '@utils/ApiError';
import type { ReportQuery } from './report.validator';

// ─── Result shapes ────────────────────────────────────────────────────────────

export interface UtilizationRow {
  userId:           string;
  firstName:        string;
  lastName:         string;
  email:            string;
  totalHours:       number;
  billableHours:    number;
  nonBillableHours: number;
  timesheetCount:   number;
}

export interface BillingRow {
  projectId:      string;
  projectName:    string;
  projectCode:    string;
  billableHours:  number;
  totalAmount:    number;  // sum of (hours × user.hourlyRate)
  timesheetCount: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveStatuses(status: ReportQuery['status']): string[] {
  if (status === 'all') return ['submitted', 'approved'];
  return [status];
}

function buildDateRange(from: string, to: string): { $gte: Date; $lte: Date } {
  const toDate = new Date(to);
  toDate.setUTCHours(23, 59, 59, 999);
  return { $gte: new Date(from), $lte: toDate };
}

// ─── Utilization ──────────────────────────────────────────────────────────────

/**
 * Returns hours per user within the given date range.
 * Aggregates across all timesheet entries grouped by userId.
 *
 * @throws 403 if requester is not manager/admin.
 */
export async function getUtilizationReport(
  query: ReportQuery,
  requesterRole: string,
): Promise<UtilizationRow[]> {
  if (requesterRole !== 'manager' && requesterRole !== 'admin') {
    throw ApiError.forbidden('Only managers or admins can access reports');
  }

  const matchStage: Record<string, unknown> = {
    periodStart: buildDateRange(query.from, query.to),
    status:      { $in: resolveStatuses(query.status) },
  };

  if (query.userId) {
    matchStage['userId'] = new Types.ObjectId(query.userId);
  }

  return Timesheet.aggregate<UtilizationRow>([
    { $match: matchStage },

    // Unwind entries so we can sum by billable/non-billable
    { $unwind: '$entries' },

    // Group by user — collect unique sheet IDs for the count
    {
      $group: {
        _id:              '$userId',
        totalHours:       { $sum: '$entries.hours' },
        billableHours:    { $sum: { $cond: ['$entries.isBillable', '$entries.hours', 0] } },
        nonBillableHours: { $sum: { $cond: ['$entries.isBillable', 0, '$entries.hours'] } },
        sheetIds:         { $addToSet: '$_id' },
      },
    },

    // Join user record for display fields
    {
      $lookup: {
        from:         'users',
        localField:   '_id',
        foreignField: '_id',
        as:           'user',
      },
    },
    { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },

    {
      $project: {
        _id:              0,
        userId:           { $toString: '$_id' },
        firstName:        { $ifNull: ['$user.firstName', ''] },
        lastName:         { $ifNull: ['$user.lastName', ''] },
        email:            { $ifNull: ['$user.email', ''] },
        totalHours:       1,
        billableHours:    1,
        nonBillableHours: 1,
        timesheetCount:   { $size: '$sheetIds' },
      },
    },

    { $sort: { lastName: 1, firstName: 1 } },
  ]);
}

// ─── Billing ──────────────────────────────────────────────────────────────────

/**
 * Returns billable hours and revenue per project within the given date range.
 * Revenue = sum of (entryHours × user.hourlyRate) for all billable entries.
 *
 * @throws 403 if requester is not manager/admin.
 */
export async function getBillingReport(
  query: ReportQuery,
  requesterRole: string,
): Promise<BillingRow[]> {
  if (requesterRole !== 'manager' && requesterRole !== 'admin') {
    throw ApiError.forbidden('Only managers or admins can access reports');
  }

  const matchStage: Record<string, unknown> = {
    periodStart: buildDateRange(query.from, query.to),
    status:      { $in: resolveStatuses(query.status) },
  };

  // Entry-level filter for projectId goes AFTER unwind
  const entryMatch: Record<string, unknown> = { 'entries.isBillable': true };
  if (query.projectId) {
    entryMatch['entries.projectId'] = new Types.ObjectId(query.projectId);
  }

  return Timesheet.aggregate<BillingRow>([
    { $match: matchStage },

    // Bring in user for hourlyRate before unwinding entries
    {
      $lookup: {
        from:         'users',
        localField:   'userId',
        foreignField: '_id',
        as:           'user',
      },
    },
    { $unwind: '$user' },

    // Unwind entries; then keep only billable ones
    { $unwind: '$entries' },
    { $match: entryMatch },

    // Group by project
    {
      $group: {
        _id:           '$entries.projectId',
        billableHours: { $sum: '$entries.hours' },
        totalAmount:   { $sum: { $multiply: ['$entries.hours', '$user.hourlyRate'] } },
        sheetIds:      { $addToSet: '$_id' },
      },
    },

    // Join project record for display fields
    {
      $lookup: {
        from:         'projects',
        localField:   '_id',
        foreignField: '_id',
        as:           'project',
      },
    },
    { $unwind: { path: '$project', preserveNullAndEmptyArrays: true } },

    {
      $project: {
        _id:            0,
        projectId:      { $toString: '$_id' },
        projectName:    { $ifNull: ['$project.name', 'Unknown'] },
        projectCode:    { $ifNull: ['$project.code', ''] },
        billableHours:  1,
        totalAmount:    1,
        timesheetCount: { $size: '$sheetIds' },
      },
    },

    { $sort: { totalAmount: -1 } },
  ]);
}

// ─── CSV helpers ──────────────────────────────────────────────────────────────

function escapeCsv(val: unknown): string {
  const s = String(val ?? '');
  // Wrap in quotes if contains comma, quote, or newline
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

export function utilizationToCsv(rows: UtilizationRow[]): string {
  const headers = [
    'First Name', 'Last Name', 'Email',
    'Total Hours', 'Billable Hours', 'Non-Billable Hours', 'Timesheets',
  ];

  const lines = rows.map((r) =>
    [
      r.firstName, r.lastName, r.email,
      r.totalHours.toFixed(2), r.billableHours.toFixed(2),
      r.nonBillableHours.toFixed(2), r.timesheetCount,
    ].map(escapeCsv).join(','),
  );

  return [headers.join(','), ...lines].join('\r\n');
}

export function billingToCsv(rows: BillingRow[]): string {
  const headers = [
    'Project Code', 'Project Name',
    'Billable Hours', 'Total Amount (USD)', 'Timesheets',
  ];

  const lines = rows.map((r) =>
    [
      r.projectCode, r.projectName,
      r.billableHours.toFixed(2), r.totalAmount.toFixed(2), r.timesheetCount,
    ].map(escapeCsv).join(','),
  );

  return [headers.join(','), ...lines].join('\r\n');
}
