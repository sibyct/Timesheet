/**
 * @file swagger.ts
 * @description OpenAPI 3.0 specification and swagger-ui-express setup.
 *
 * The spec is built programmatically (not from a YAML file) so it stays
 * in sync with the TypeScript types and avoids drift.
 *
 * Usage in app.ts:
 *   import { swaggerRouter } from '@config/swagger';
 *   app.use('/api-docs', swaggerRouter);
 */

import type { Application } from 'express';
import swaggerUi from 'swagger-ui-express';
import { env } from './env';

// ─── Reusable Schema Components ───────────────────────────────────────────────

const components = {
  securitySchemes: {
    BearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Access token obtained from POST /api/v1/auth/login',
    },
  },

  schemas: {
    // ── Envelopes ─────────────────────────────────────────────────────────────
    SuccessResponse: {
      type: 'object',
      required: ['success', 'message', 'data'],
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Operation successful' },
        data: { description: 'Response payload — varies per endpoint' },
      },
    },
    ErrorResponse: {
      type: 'object',
      required: ['success', 'message'],
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Validation error' },
        errors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              field: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    PaginationMeta: {
      type: 'object',
      properties: {
        total:      { type: 'integer', example: 100 },
        page:       { type: 'integer', example: 1 },
        totalPages: { type: 'integer', example: 10 },
        limit:      { type: 'integer', example: 10 },
      },
    },

    // ── Auth ─────────────────────────────────────────────────────────────────
    LoginRequest: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email:    { type: 'string', format: 'email', example: 'admin@company.com' },
        password: { type: 'string', minLength: 8, example: 'P@ssword1' },
      },
    },
    LoginResponse: {
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
        user: {
          type: 'object',
          properties: {
            id:         { type: 'string' },
            name:       { type: 'string' },
            email:      { type: 'string' },
            role:       { type: 'string', enum: ['employee', 'manager', 'admin'] },
            department: { type: 'string' },
          },
        },
      },
    },

    // ── User ─────────────────────────────────────────────────────────────────
    User: {
      type: 'object',
      properties: {
        id:          { type: 'string' },
        name:        { type: 'string' },
        email:       { type: 'string' },
        role:        { type: 'string', enum: ['employee', 'manager', 'admin'] },
        department:  { type: 'string' },
        hourlyRate:  { type: 'number' },
        managerId:   { type: 'string', nullable: true },
        createdAt:   { type: 'string', format: 'date-time' },
        updatedAt:   { type: 'string', format: 'date-time' },
      },
    },

    // ── Timesheet ─────────────────────────────────────────────────────────────
    TimeEntry: {
      type: 'object',
      properties: {
        id:          { type: 'string' },
        projectId:   { type: 'string' },
        taskId:      { type: 'string' },
        date:        { type: 'string', format: 'date', example: '2024-04-01' },
        hours:       { type: 'number', minimum: 0.25, maximum: 24 },
        isBillable:  { type: 'boolean' },
        notes:       { type: 'string' },
        status:      { type: 'string', enum: ['draft', 'submitted', 'approved', 'rejected'] },
      },
    },
    Timesheet: {
      type: 'object',
      properties: {
        id:          { type: 'string' },
        userId:      { type: 'string' },
        periodStart: { type: 'string', format: 'date' },
        periodEnd:   { type: 'string', format: 'date' },
        totalHours:  { type: 'number' },
        status:      { type: 'string', enum: ['draft', 'submitted', 'approved', 'rejected'] },
        entries:     { type: 'array', items: { $ref: '#/components/schemas/TimeEntry' } },
        submittedAt: { type: 'string', format: 'date-time', nullable: true },
        createdAt:   { type: 'string', format: 'date-time' },
        updatedAt:   { type: 'string', format: 'date-time' },
      },
    },

    // ── Project ───────────────────────────────────────────────────────────────
    Project: {
      type: 'object',
      properties: {
        id:       { type: 'string' },
        name:     { type: 'string' },
        code:     { type: 'string' },
        clientId: { type: 'string' },
        budget:   { type: 'number' },
        status:   { type: 'string', enum: ['active', 'on_hold', 'completed', 'archived'] },
        members:  { type: 'array', items: { type: 'string' } },
      },
    },
  },

  responses: {
    Unauthorized: {
      description: '401 — Missing or invalid access token',
      content: {
        'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
      },
    },
    Forbidden: {
      description: '403 — Insufficient role',
      content: {
        'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
      },
    },
    NotFound: {
      description: '404 — Resource not found',
      content: {
        'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
      },
    },
    ValidationError: {
      description: '422 — Zod validation failed',
      content: {
        'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
      },
    },
    ServerError: {
      description: '500 — Internal server error',
      content: {
        'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
      },
    },
  },
};

// ─── OpenAPI Document ─────────────────────────────────────────────────────────

const swaggerDocument: object = {
  openapi: '3.0.3',
  info: {
    title: 'Timesheet Management API',
    version: '1.0.0',
    description: `
Enterprise IT Timesheet Management System.

**Auth:** All endpoints except \`/auth/login\` and \`/auth/refresh-token\` require
a Bearer access token in the \`Authorization\` header.

**Roles:** \`employee\` | \`manager\` | \`admin\`
    `.trim(),
    contact: {
      name: 'Platform Engineering',
      email: 'platform@company.com',
    },
    license: {
      name: 'UNLICENSED',
    },
  },

  servers: [
    {
      url: `http://localhost:${env.PORT}${env.API_PREFIX}/${env.API_VERSION}`,
      description: 'Local development',
    },
    {
      url: `https://staging-api.company.com${env.API_PREFIX}/${env.API_VERSION}`,
      description: 'Staging',
    },
    {
      url: `https://api.company.com${env.API_PREFIX}/${env.API_VERSION}`,
      description: 'Production',
    },
  ],

  security: [{ BearerAuth: [] }],

  tags: [
    { name: 'Auth',      description: 'Authentication & token management' },
    { name: 'Users',     description: 'User CRUD + profile' },
    { name: 'Timesheet', description: 'Time entry and timesheet lifecycle' },
    { name: 'Approval',  description: 'Manager approval queue' },
    { name: 'Projects',  description: 'Project & member management' },
    { name: 'Reports',   description: 'Utilization & billing reports' },
    { name: 'Health',    description: 'Operational health check' },
  ],

  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Liveness / readiness check',
        security: [],
        responses: {
          200: {
            description: 'Service is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status:   { type: 'string', example: 'ok' },
                    uptime:   { type: 'number', example: 123.45 },
                    db:       { type: 'string', example: 'connected' },
                    redis:    { type: 'string', example: 'ok' },
                    version:  { type: 'string', example: '1.0.0' },
                  },
                },
              },
            },
          },
          503: { description: 'Service unavailable' },
        },
      },
    },

    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Authenticate and receive tokens',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } },
          },
        },
        responses: {
          200: {
            description: 'Login successful',
            headers: {
              'Set-Cookie': {
                description: 'httpOnly refresh token cookie',
                schema: { type: 'string' },
              },
            },
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    {
                      properties: {
                        data: { $ref: '#/components/schemas/LoginResponse' },
                      },
                    },
                  ],
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          422: { $ref: '#/components/responses/ValidationError' },
        },
      },
    },

    '/auth/refresh-token': {
      post: {
        tags: ['Auth'],
        summary: 'Silent token refresh using httpOnly cookie',
        security: [],
        responses: {
          200: { description: 'New access token issued' },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },

    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Invalidate refresh token and clear cookie',
        responses: {
          200: { description: 'Logged out successfully' },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },

    '/users': {
      get: {
        tags: ['Users'],
        summary: 'List all users (admin only)',
        parameters: [
          { name: 'page',   in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit',  in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'role',   in: 'query', schema: { type: 'string', enum: ['employee', 'manager', 'admin'] } },
        ],
        responses: {
          200: { description: 'Paginated user list' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
      post: {
        tags: ['Users'],
        summary: 'Create a user (admin only)',
        responses: {
          201: { description: 'User created' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          422: { $ref: '#/components/responses/ValidationError' },
        },
      },
    },

    '/users/me': {
      get: {
        tags: ['Users'],
        summary: 'Get own profile',
        responses: {
          200: {
            description: 'Current user profile',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    { properties: { data: { $ref: '#/components/schemas/User' } } },
                  ],
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },

    '/timesheets': {
      get: {
        tags: ['Timesheet'],
        summary: 'List timesheets for the authenticated user',
        responses: { 200: { description: 'Timesheet list' }, 401: { $ref: '#/components/responses/Unauthorized' } },
      },
      post: {
        tags: ['Timesheet'],
        summary: 'Create a draft timesheet',
        responses: { 201: { description: 'Timesheet created' }, 401: { $ref: '#/components/responses/Unauthorized' } },
      },
    },

    '/timesheets/{id}/submit': {
      post: {
        tags: ['Timesheet'],
        summary: 'Submit a draft timesheet for approval',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Timesheet submitted' },
          400: { description: 'Already submitted or no entries' },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    '/timesheets/{id}/recall': {
      post: {
        tags: ['Timesheet'],
        summary: 'Recall a submitted timesheet back to draft',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Timesheet recalled' },
          400: { description: 'Cannot recall — not in submitted state' },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    '/approvals/queue': {
      get: {
        tags: ['Approval'],
        summary: 'Get pending timesheets awaiting approval (manager+)',
        responses: { 200: { description: 'Approval queue' }, 401: { $ref: '#/components/responses/Unauthorized' } },
      },
    },

    '/approvals/{id}/approve': {
      post: {
        tags: ['Approval'],
        summary: 'Approve a timesheet',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Approved' }, 401: { $ref: '#/components/responses/Unauthorized' } },
      },
    },

    '/approvals/{id}/reject': {
      post: {
        tags: ['Approval'],
        summary: 'Reject a timesheet with a comment',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Rejected' }, 401: { $ref: '#/components/responses/Unauthorized' } },
      },
    },

    '/approvals/bulk-approve': {
      post: {
        tags: ['Approval'],
        summary: 'Bulk-approve multiple timesheets',
        responses: { 200: { description: 'Bulk approval result' }, 401: { $ref: '#/components/responses/Unauthorized' } },
      },
    },

    '/projects': {
      get: {
        tags: ['Projects'],
        summary: 'List all projects',
        responses: { 200: { description: 'Project list' }, 401: { $ref: '#/components/responses/Unauthorized' } },
      },
      post: {
        tags: ['Projects'],
        summary: 'Create a project (admin only)',
        responses: { 201: { description: 'Project created' }, 401: { $ref: '#/components/responses/Unauthorized' } },
      },
    },

    '/reports/utilization': {
      get: {
        tags: ['Reports'],
        summary: 'Employee utilization report (manager+)',
        parameters: [
          { name: 'from', in: 'query', required: true, schema: { type: 'string', format: 'date' } },
          { name: 'to',   in: 'query', required: true, schema: { type: 'string', format: 'date' } },
        ],
        responses: { 200: { description: 'Utilization data' }, 401: { $ref: '#/components/responses/Unauthorized' } },
      },
    },

    '/reports/billing': {
      get: {
        tags: ['Reports'],
        summary: 'Billing summary by project (manager+)',
        responses: { 200: { description: 'Billing data' }, 401: { $ref: '#/components/responses/Unauthorized' } },
      },
    },

    '/reports/export': {
      get: {
        tags: ['Reports'],
        summary: 'Export report as CSV',
        parameters: [
          { name: 'type', in: 'query', required: true, schema: { type: 'string', enum: ['utilization', 'billing'] } },
          { name: 'from', in: 'query', required: true, schema: { type: 'string', format: 'date' } },
          { name: 'to',   in: 'query', required: true, schema: { type: 'string', format: 'date' } },
        ],
        responses: {
          200: {
            description: 'CSV file download',
            content: { 'text/csv': { schema: { type: 'string' } } },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
  },

  components,
};

// ─── Swagger UI Options ───────────────────────────────────────────────────────

const swaggerUiOptions: swaggerUi.SwaggerUiOptions = {
  explorer: true,
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: true,
  },
  customCss: `
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info .title { color: #1565C0; }
  `,
  customSiteTitle: 'Timesheet API Docs',
};

// ─── Mount Function ───────────────────────────────────────────────────────────

/**
 * Mounts the Swagger UI and the raw spec JSON endpoint onto the Express app.
 *
 * @param app - Express application instance
 */
export function mountSwagger(app: Application): void {
  // Serve the UI
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument, swaggerUiOptions),
  );

  // Serve the raw OpenAPI JSON (useful for codegen tools)
  app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.json(swaggerDocument);
  });
}
