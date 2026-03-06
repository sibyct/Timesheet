import type { Request, Response } from 'express';
import { ApiResponse } from '@utils/ApiResponse';
import * as service from './dashboard.service';

export async function getDashboard(req: Request, res: Response): Promise<void> {
  const stats = await service.getDashboardStats(req.user!.role);
  ApiResponse.ok(res, stats, 'Dashboard data retrieved');
}
