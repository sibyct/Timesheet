/**
 * @file modules/project/project.controller.ts
 * @description HTTP adapters for the Projects module.
 *
 *   GET    /projects             → list
 *   POST   /projects             → create
 *   GET    /projects/:id         → getById
 *   PATCH  /projects/:id         → update
 *   DELETE /projects/:id         → remove
 *   POST   /projects/:id/members → addMember
 *   DELETE /projects/:id/members → removeMember
 */

import type { Request, Response } from 'express';
import { ApiResponse } from '@utils/ApiResponse';
import * as service from './project.service';
import type {
  CreateProjectBody,
  UpdateProjectBody,
  ListProjectsQuery,
  ProjectParams,
  MemberBody,
} from './project.validator';

export async function list(req: Request, res: Response): Promise<void> {
  const query = req.query as unknown as ListProjectsQuery;
  const result = await service.listProjects(req.user!.id, req.user!.role, query);
  ApiResponse.paginated(res, result.projects, result.meta);
}

export async function getById(req: Request, res: Response): Promise<void> {
  const { id } = req.params as ProjectParams;
  const project = await service.getProjectById(id, req.user!.id, req.user!.role);
  ApiResponse.ok(res, project);
}

export async function create(req: Request, res: Response): Promise<void> {
  const body = req.body as CreateProjectBody;
  const project = await service.createProject(body, req.user!.role);
  ApiResponse.created(res, project, 'Project created');
}

export async function update(req: Request, res: Response): Promise<void> {
  const { id } = req.params as ProjectParams;
  const body = req.body as UpdateProjectBody;
  const project = await service.updateProject(id, body, req.user!.role);
  ApiResponse.ok(res, project, 'Project updated');
}

export async function remove(req: Request, res: Response): Promise<void> {
  const { id } = req.params as ProjectParams;
  await service.deleteProject(id, req.user!.role);
  ApiResponse.noContent(res);
}

export async function addMember(req: Request, res: Response): Promise<void> {
  const { id } = req.params as ProjectParams;
  const body = req.body as MemberBody;
  const project = await service.addMember(id, body, req.user!.role);
  ApiResponse.ok(res, project, 'Member added');
}

export async function removeMember(req: Request, res: Response): Promise<void> {
  const { id } = req.params as ProjectParams;
  const body = req.body as MemberBody;
  const project = await service.removeMember(id, body, req.user!.role);
  ApiResponse.ok(res, project, 'Member removed');
}
