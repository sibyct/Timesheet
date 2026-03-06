/**
 * @file modules/report/report.controller.ts
 *
 *   GET /reports/utilization         → JSON utilization rows
 *   GET /reports/billing             → JSON billing rows
 *   GET /reports/utilization/export  → CSV download
 *   GET /reports/billing/export      → CSV download
 */

import type { Request, Response } from 'express';
import { ApiResponse } from '@utils/ApiResponse';
import * as service from './report.service';
import type { ReportQuery } from './report.validator';

function queryFromReq(req: Request): ReportQuery {
  return req.query as unknown as ReportQuery;
}

// ── JSON endpoints ────────────────────────────────────────────────────────────

export async function utilization(req: Request, res: Response): Promise<void> {
  const rows = await service.getUtilizationReport(queryFromReq(req), req.user!.role);
  ApiResponse.ok(res, rows, 'Utilization report retrieved');
}

export async function billing(req: Request, res: Response): Promise<void> {
  const rows = await service.getBillingReport(queryFromReq(req), req.user!.role);
  ApiResponse.ok(res, rows, 'Billing report retrieved');
}

// ── CSV export endpoints ──────────────────────────────────────────────────────

export async function exportUtilization(req: Request, res: Response): Promise<void> {
  const rows = await service.getUtilizationReport(queryFromReq(req), req.user!.role);
  const csv  = service.utilizationToCsv(rows);

  const filename = `utilization_${req.query['from']}_${req.query['to']}.csv`;
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.status(200).send(csv);
}

export async function exportBilling(req: Request, res: Response): Promise<void> {
  const rows = await service.getBillingReport(queryFromReq(req), req.user!.role);
  const csv  = service.billingToCsv(rows);

  const filename = `billing_${req.query['from']}_${req.query['to']}.csv`;
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.status(200).send(csv);
}
