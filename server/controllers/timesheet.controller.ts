import { Response, NextFunction } from "express";
import moment from "moment";
import { TimesheetService } from "../services/timesheet.service";
import { AuthRequest } from "../types/index";

export const TimesheetController = {
  async getUserTimeLogin(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const weeks = TimesheetService.buildWeeklyRanges();
      const [start, end] = weeks[0].split("-");
      const result = await TimesheetService.getOrInitWeek(
        moment(new Date(start)),
        moment(new Date(end)),
        req.user!.userId,
        weeks,
      );
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  async getDateInfoBetweenDates(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const [start, end] = req.body.date.split("-");
      const result = await TimesheetService.getOrInitWeek(
        moment(new Date(start)),
        moment(new Date(end)),
        req.user!.userId,
      );
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  async updateTimeSheet(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { dataNeedToUpdate, newData, name } = req.body;
      const data = await TimesheetService.saveEntries(
        { dataNeedToUpdate, newData, name, userId: req.user!.userId },
        0,
      );
      res.status(200).json({ data, status: "Saved Successfully" });
    } catch (err) {
      next(err);
    }
  },

  async submitTimeSheet(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { dataNeedToUpdate, newData, name } = req.body;
      const data = await TimesheetService.saveEntries(
        { dataNeedToUpdate, newData, name, userId: req.user!.userId },
        1,
      );
      res.status(200).json({ data, status: "Saved Successfully" });
    } catch (err) {
      next(err);
    }
  },

  async getProfileInfo(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const user = await TimesheetService.getProfile(req.user!.userId);
      res.status(200).json({ data: user, status: "Retrieved Successfully" });
    } catch (err) {
      next(err);
    }
  },

  async saveProfileInfo(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      await TimesheetService.saveProfile(req.user!.userId, req.body);
      res.status(200).json({ status: "Saved Successfully" });
    } catch (err) {
      next(err);
    }
  },
};
