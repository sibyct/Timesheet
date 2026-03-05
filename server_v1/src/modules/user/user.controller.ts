/**
 * @file modules/user/user.controller.ts
 * @description HTTP adapter for the Users module.
 *
 * Controllers are thin:
 *   - Extract validated request data
 *   - Delegate to service
 *   - Format the response with ApiResponse helpers
 *
 * All handlers are wrapped with catchAsync in the router — no try/catch here.
 *
 * Routes served:
 *   GET    /users              → list
 *   POST   /users              → create
 *   GET    /users/me           → getMe
 *   PATCH  /users/me           → updateMe
 *   POST   /users/me/change-password → changePassword
 *   GET    /users/:id          → getOne
 *   PATCH  /users/:id          → update
 *   DELETE /users/:id          → remove
 */

import type { Request, Response } from "express";
import { ApiResponse } from "@utils/ApiResponse";
import * as service from "./user.service";
import type {
  CreateUserBody,
  UpdateUserBody,
  UpdateMeBody,
  ChangePasswordBody,
  ListUsersQuery,
} from "./user.validator";

// ─── list ─────────────────────────────────────────────────────────────────────

/** GET /users — paginated user list (admin only) */
export async function list(req: Request, res: Response): Promise<void> {
  const query = req.query as unknown as ListUsersQuery;
  const rawSort =
    typeof req.query["sort"] === "string" ? req.query["sort"] : undefined;

  const { users, meta } = await service.listUsers(query, rawSort);

  ApiResponse.paginated(res, users, meta, "Users retrieved successfully");
}

// ─── create ───────────────────────────────────────────────────────────────────

/** POST /users — create a new user (admin only) */
export async function create(req: Request, res: Response): Promise<void> {
  const body = req.body as CreateUserBody;
  const user = await service.createUser(body);

  ApiResponse.created(res, user, "User created successfully");
}

// ─── getMe ────────────────────────────────────────────────────────────────────

/** GET /users/me — return the authenticated user's own profile */
export async function getMe(req: Request, res: Response): Promise<void> {
  // req.user is guaranteed by authenticate() middleware
  const user = await service.getUserById(req.user!.id);

  ApiResponse.ok(res, user, "Profile retrieved successfully");
}

// ─── updateMe ─────────────────────────────────────────────────────────────────

/** PATCH /users/me — update own firstName / lastName */
export async function updateMe(req: Request, res: Response): Promise<void> {
  const body = req.body as UpdateMeBody;
  const user = await service.updateMe(req.user!.id, body);

  ApiResponse.ok(res, user, "Profile updated successfully");
}

// ─── changePassword ───────────────────────────────────────────────────────────

/** POST /users/me/change-password */
export async function changePassword(
  req: Request,
  res: Response,
): Promise<void> {
  const body = req.body as ChangePasswordBody;
  await service.changePassword(req.user!.id, body);

  ApiResponse.ok(
    res,
    null,
    "Password changed successfully. Please log in again.",
  );
}

// ─── getOne ───────────────────────────────────────────────────────────────────

/** GET /users/:id — retrieve any user by id (admin, or owner via route guard) */
export async function getOne(req: Request, res: Response): Promise<void> {
  const user = await service.getUserById(req.params["id"]!);

  ApiResponse.ok(res, user, "User retrieved successfully");
}

// ─── update ───────────────────────────────────────────────────────────────────

/** PATCH /users/:id — admin update (all fields) */
export async function update(req: Request, res: Response): Promise<void> {
  const body = req.body as UpdateUserBody;
  const user = await service.updateUser(req.params["id"]!, body);

  ApiResponse.ok(res, user, "User updated successfully");
}

// ─── remove ───────────────────────────────────────────────────────────────────

/** DELETE /users/:id — soft delete (admin only) */
export async function remove(req: Request, res: Response): Promise<void> {
  await service.deleteUser(req.params["id"]!);

  ApiResponse.noContent(res);
}
