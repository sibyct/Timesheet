/**
 * @file models/index.ts
 * @description Barrel export for all Mongoose models and their TypeScript types.
 *
 * Import models from here:
 *   import { User, Project, Timesheet } from '@models/index';
 */

// ── Models ────────────────────────────────────────────────────────────────────
export { User }             from './user.model';
export { Department }       from './department.model';
export { Client }           from './client.model';
export { Project }          from './project.model';
export { Task }             from './task.model';
export { TimeEntry }        from './timeEntry.model';
export { Timesheet }        from './timesheet.model';
export { ApprovalHistory }  from './approvalHistory.model';

// ── Interfaces ────────────────────────────────────────────────────────────────
export type { IUser, IUserMethods, IUserVirtuals, UserDocument, UserModel, UserRole }
  from './user.model';

export type { IDepartment, IDepartmentVirtuals, DepartmentDocument, DepartmentModel }
  from './department.model';

export type { IClient, IClientVirtuals, ClientDocument, ClientModel }
  from './client.model';

export type { IProject, IProjectVirtuals, ProjectDocument, ProjectModel, ProjectStatus }
  from './project.model';

export type { ITask, ITaskVirtuals, TaskDocument, TaskModel }
  from './task.model';

export type { ITimeEntry, ITimeEntryVirtuals, TimeEntryDocument, TimeEntryModel, EntryStatus }
  from './timeEntry.model';

export type { ITimesheet, ITimesheetVirtuals, ITimesheetEntry, TimesheetDocument, TimesheetModel, TimesheetStatus }
  from './timesheet.model';

export type { IApprovalHistory, IApprovalHistoryVirtuals, ApprovalHistoryDocument, ApprovalHistoryModel, ApprovalAction }
  from './approvalHistory.model';

// ── Constants ─────────────────────────────────────────────────────────────────
export { USER_ROLES }         from './user.model';
export { PROJECT_STATUSES }   from './project.model';
export { ENTRY_STATUSES }     from './timeEntry.model';
export { TIMESHEET_STATUSES } from './timesheet.model';
export { APPROVAL_ACTIONS }   from './approvalHistory.model';
