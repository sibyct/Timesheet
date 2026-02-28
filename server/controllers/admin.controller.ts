import { Response, NextFunction } from "express";
import { AdminService } from "../services/admin.service";
import { ClientService } from "../services/client.service";
import { AuthRequest } from "../types/index";

export const AdminController = {
  async getUserInfo(
    _req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const users = await AdminService.getUsers();
      res.status(200).json({ data: users, status: "Retrieved Successfully" });
    } catch (err) {
      next(err);
    }
  },

  async getUserId(
    _req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { lastUser, projects } = await AdminService.getRegisterFormData();
      res.status(200).json({ data: [lastUser], projects });
    } catch (err) {
      next(err);
    }
  },

  async register(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { password } = await AdminService.registerUser(req.body);
      res.status(200).json({ data: req.body, status: "saved", tempPassword: password });
    } catch (err) {
      next(err);
    }
  },

  async deleteUser(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const users = await AdminService.deleteUser(req.params.userId);
      res.status(200).json({ data: users, status: "Retrieved Successfully" });
    } catch (err) {
      next(err);
    }
  },

  async updateUserDetails(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const users = await AdminService.updateUser(req.body);
      res.status(200).json({ data: users, status: "saved" });
    } catch (err) {
      next(err);
    }
  },

  async getProjectList(
    _req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const clients = await ClientService.getClients();
      res.status(200).json({ data: clients, status: "Retrieved" });
    } catch (err) {
      next(err);
    }
  },

  async saveProjectList(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { newClients, updatedList } = req.body;
      const clients = await ClientService.saveClients(newClients, updatedList);
      res.status(200).json({ data: clients, status: "saved" });
    } catch (err) {
      next(err);
    }
  },

  async deleteProjectList(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      await ClientService.deleteClient(req.params.id);
      res.status(200).json({ status: "deleted" });
    } catch (err) {
      next(err);
    }
  },

  async getProjectListAndUserList(
    _req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await ClientService.getClientsAndUsers();
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  async getSearchDetails(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const results = await AdminService.search(req.body);
      res.status(200).json({ data: results });
    } catch (err) {
      next(err);
    }
  },

  async saveAdminData(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { dataToUpdate, searchCriteria } = req.body;
      const results = await AdminService.saveAdminData(
        dataToUpdate,
        searchCriteria,
      );
      res.status(200).json({ data: results });
    } catch (err) {
      next(err);
    }
  },

  async exportToExcel(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const csv = await AdminService.exportCSV(req.body);
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=timesheet.csv",
      );
      res.setHeader("Content-Type", "text/csv");
      res.send(csv);
    } catch (err) {
      next(err);
    }
  },

  async resetPassword(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { password } = await AdminService.resetPassword(req.params.username);
      res.status(200).json({ message: "Password reset successful", tempPassword: password });
    } catch (err) {
      next(err);
    }
  },
};
