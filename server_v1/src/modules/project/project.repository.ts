/**
 * @file modules/project/project.repository.ts
 * @description Data-access layer for the Project collection.
 */

import { Types } from 'mongoose';
import { Project } from '@models/index';
import type { IProject, ProjectDocument } from '@models/index';
import type { SortObject } from '@utils/pagination';
import type {
  CreateProjectBody,
  UpdateProjectBody,
  ListProjectsQuery,
} from './project.validator';

export type ProjectLean = IProject & { _id: Types.ObjectId };

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function findById(id: string): Promise<ProjectLean | null> {
  return Project.findById(id).lean();
}

export async function findDocumentById(id: string): Promise<ProjectDocument | null> {
  return Project.findById(id);
}

export async function findByCode(code: string): Promise<ProjectLean | null> {
  return Project.findOne({ code: code.toUpperCase() }).lean();
}

// ─── List ─────────────────────────────────────────────────────────────────────

export interface ListProjectsFilter {
  status?:   IProject['status'];
  clientId?: Types.ObjectId;
  memberId?: Types.ObjectId;
  isActive?: boolean;
  search?:   string;
}

export interface ListProjectsResult {
  projects: ProjectLean[];
  total:    number;
}

export async function listProjects(
  query:  ListProjectsQuery,
  filter: ListProjectsFilter,
  sort:   SortObject,
): Promise<ListProjectsResult> {
  const q: Record<string, unknown> = {};

  if (filter.status)   q['status']   = filter.status;
  if (filter.isActive !== undefined) q['isActive'] = filter.isActive;
  if (filter.clientId) q['clientId'] = filter.clientId;
  if (filter.memberId) q['members']  = filter.memberId;

  if (filter.search) {
    const regex = new RegExp(filter.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    q['$or'] = [{ name: regex }, { code: regex }, { description: regex }];
  }

  const skip = (query.page - 1) * query.limit;
  const [projects, total] = await Promise.all([
    Project.find(q).sort(sort).skip(skip).limit(query.limit).lean(),
    Project.countDocuments(q),
  ]);

  return { projects, total };
}

// ─── Write ────────────────────────────────────────────────────────────────────

export async function createProject(body: CreateProjectBody): Promise<ProjectLean> {
  const doc = await Project.create({
    ...body,
    startDate: body.startDate ? new Date(body.startDate) : null,
    endDate:   body.endDate   ? new Date(body.endDate)   : null,
    members:   body.members?.map((id) => new Types.ObjectId(id)) ?? [],
  });
  return doc.toObject();
}

export async function updateProject(
  id:   string,
  data: UpdateProjectBody,
): Promise<ProjectLean | null> {
  const patch: Record<string, unknown> = { ...data };
  if (data.startDate !== undefined) patch['startDate'] = data.startDate ? new Date(data.startDate) : null;
  if (data.endDate   !== undefined) patch['endDate']   = data.endDate   ? new Date(data.endDate)   : null;

  return Project.findByIdAndUpdate(
    id,
    { $set: patch },
    { new: true, runValidators: true },
  ).lean();
}

export async function removeProject(id: string): Promise<void> {
  await Project.findByIdAndDelete(id);
}

// ─── Member ops ───────────────────────────────────────────────────────────────

export async function addMember(
  projectId: string,
  userId:    string,
): Promise<ProjectLean | null> {
  return Project.findByIdAndUpdate(
    projectId,
    { $addToSet: { members: new Types.ObjectId(userId) } },
    { new: true },
  ).lean();
}

export async function removeMember(
  projectId: string,
  userId:    string,
): Promise<ProjectLean | null> {
  return Project.findByIdAndUpdate(
    projectId,
    { $pull: { members: new Types.ObjectId(userId) } },
    { new: true },
  ).lean();
}

export async function getProjectsForUser(userId: string): Promise<ProjectLean[]> {
  return Project.find({
    members:  new Types.ObjectId(userId),
    isActive: true,
  }).lean();
}
