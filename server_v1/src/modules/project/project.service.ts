/**
 * @file modules/project/project.service.ts
 * @description Business logic for the Projects module.
 *
 * Access rules:
 *   - Listing: any authenticated user (employees see only their own projects).
 *   - Create / Update / Delete: manager or admin only.
 *   - Add / Remove member: manager or admin only.
 */

import { ApiError } from '@utils/ApiError';
import { buildSort } from '@utils/pagination';
import type { PaginationMeta } from '@utils/ApiResponse';
import * as repo from './project.repository';
import type { ProjectLean } from './project.repository';
import type {
  CreateProjectBody,
  UpdateProjectBody,
  ListProjectsQuery,
  MemberBody,
} from './project.validator';
import { Types } from 'mongoose';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ListProjectsResult {
  projects: ProjectLean[];
  meta:     PaginationMeta;
}

// ─── listProjects ─────────────────────────────────────────────────────────────

export async function listProjects(
  requesterId:   string,
  requesterRole: string,
  query:         ListProjectsQuery,
): Promise<ListProjectsResult> {
  const isPrivileged = requesterRole === 'manager' || requesterRole === 'admin';

  const filter: repo.ListProjectsFilter = {
    status:   query.status,
    clientId: query.clientId ? new Types.ObjectId(query.clientId) : undefined,
    isActive: query.isActive,
    search:   query.search,
    // Employees only see projects they belong to
    memberId: isPrivileged
      ? (query.memberId ? new Types.ObjectId(query.memberId) : undefined)
      : new Types.ObjectId(requesterId),
  };

  const sort = buildSort(query.sortBy, query.order);
  const { projects, total } = await repo.listProjects(query, filter, sort);
  const totalPages = Math.ceil(total / query.limit);

  return {
    projects,
    meta: {
      total,
      page:       query.page,
      limit:      query.limit,
      totalPages,
      hasNext: query.page < totalPages,
      hasPrev: query.page > 1,
    },
  };
}

// ─── getProjectById ───────────────────────────────────────────────────────────

export async function getProjectById(
  id:            string,
  requesterId:   string,
  requesterRole: string,
): Promise<ProjectLean> {
  const project = await repo.findById(id);
  if (!project) throw ApiError.notFound('Project');

  const isPrivileged = requesterRole === 'manager' || requesterRole === 'admin';
  const isMember     = project.members.some((m) => String(m) === requesterId);

  if (!isPrivileged && !isMember) {
    throw ApiError.forbidden('You are not a member of this project');
  }

  return project;
}

// ─── createProject ────────────────────────────────────────────────────────────

export async function createProject(
  body:          CreateProjectBody,
  requesterRole: string,
): Promise<ProjectLean> {
  if (requesterRole !== 'manager' && requesterRole !== 'admin') {
    throw ApiError.forbidden('Only managers or admins can create projects');
  }

  const existing = await repo.findByCode(body.code);
  if (existing) {
    throw ApiError.conflict(`Project code '${body.code}' is already in use`);
  }

  return repo.createProject(body);
}

// ─── updateProject ────────────────────────────────────────────────────────────

export async function updateProject(
  id:            string,
  body:          UpdateProjectBody,
  requesterRole: string,
): Promise<ProjectLean> {
  if (requesterRole !== 'manager' && requesterRole !== 'admin') {
    throw ApiError.forbidden('Only managers or admins can update projects');
  }

  const project = await repo.findById(id);
  if (!project) throw ApiError.notFound('Project');

  const updated = await repo.updateProject(id, body);
  if (!updated) throw ApiError.notFound('Project');

  return updated;
}

// ─── deleteProject ────────────────────────────────────────────────────────────

export async function deleteProject(
  id:            string,
  requesterRole: string,
): Promise<void> {
  if (requesterRole !== 'admin') {
    throw ApiError.forbidden('Only admins can delete projects');
  }

  const project = await repo.findById(id);
  if (!project) throw ApiError.notFound('Project');

  await repo.removeProject(id);
}

// ─── addMember ────────────────────────────────────────────────────────────────

export async function addMember(
  projectId:     string,
  body:          MemberBody,
  requesterRole: string,
): Promise<ProjectLean> {
  if (requesterRole !== 'manager' && requesterRole !== 'admin') {
    throw ApiError.forbidden('Only managers or admins can manage project members');
  }

  const project = await repo.findById(projectId);
  if (!project) throw ApiError.notFound('Project');

  const alreadyMember = project.members.some((m) => String(m) === body.userId);
  if (alreadyMember) {
    throw ApiError.conflict('User is already a member of this project');
  }

  const updated = await repo.addMember(projectId, body.userId);
  if (!updated) throw ApiError.notFound('Project');

  return updated;
}

// ─── removeMember ─────────────────────────────────────────────────────────────

export async function removeMember(
  projectId:     string,
  body:          MemberBody,
  requesterRole: string,
): Promise<ProjectLean> {
  if (requesterRole !== 'manager' && requesterRole !== 'admin') {
    throw ApiError.forbidden('Only managers or admins can manage project members');
  }

  const project = await repo.findById(projectId);
  if (!project) throw ApiError.notFound('Project');

  const updated = await repo.removeMember(projectId, body.userId);
  if (!updated) throw ApiError.notFound('Project');

  return updated;
}
