import swaggerUi from 'swagger-ui-express';

const tag = (name: string, description: string) => ({ name, description });

const errorSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean', example: false },
    message: { type: 'string', example: 'Session expired. Please log in again.' },
    errors: {
      type: 'object',
      additionalProperties: { type: 'array', items: { type: 'string' } },
      nullable: true,
    },
  },
};

const successEnvelope = (description: string, schemaRef: string) => ({
  description,
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string' },
          data: { $ref: schemaRef },
        },
      },
    },
  },
});

const errorResponse = (description: string) => ({
  description,
  content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
});

const jsonBody = (schema: Record<string, unknown>) => ({
  required: true,
  content: { 'application/json': { schema } },
});

const params = (...items: [string, Record<string, unknown>][]) => ({
  parameters: items.map(([name, spec]) => ({
    name,
    in: 'path',
    required: true,
    schema: spec,
  })),
});

export const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Bariisaa TV API',
    version: '1.0.0',
    description:
      'REST API for the Bariisaa TV audio-book / e-book / video platform. ' +
      'All endpoints below (except health and auth) require a Bearer access token. ' +
      'Envelope: success responses return { success, message, data, meta? }; ' +
      'errors return { success: false, message, errors? }.',
    contact: { name: 'Bariisaa TV team' },
  },
  servers: [
    { url: 'https://api.bariisaa.com', description: 'Production' },
    { url: 'http://localhost:3000', description: 'Local development' },
  ],
  tags: [
    tag('Health', 'Service health checks'),
    tag('Auth', 'Signup, login, OTP, token refresh, password reset'),
    tag('Users', 'Admin user management and role assignment'),
    tag('Roles & Permissions', 'RBAC roles, permission matrix'),
    tag('Audit', 'Admin action audit trail'),
    tag('Content', 'Books, categories'),
    tag('Media', 'File and video upload / playback'),
    tag('Settings', 'Application settings'),
    tag('Payments', 'Payment webhooks'),
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Access token from /api/v1/auth/login or /api/v1/auth/refresh-token',
      },
    },
    schemas: {
      Error: errorSchema,
      Health: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'ok' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string', nullable: true },
          phone: { type: 'string', nullable: true },
          name: { type: 'string', nullable: true },
          avatarUrl: { type: 'string', nullable: true },
          status: { type: 'string', enum: ['ACTIVE', 'SUSPENDED', 'BLOCKED', 'DELETED'] },
          emailVerified: { type: 'boolean' },
          phoneVerified: { type: 'boolean' },
          roles: {
            type: 'array',
            items: { type: 'string' },
            description: 'Role names, e.g. ["super_admin"]',
          },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Role: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string', example: 'editor' },
          description: { type: 'string', nullable: true },
        },
      },
      TokenPair: {
        type: 'object',
        properties: {
          user: { $ref: '#/components/schemas/User' },
          accessToken: { type: 'string' },
          refreshToken: { type: 'string' },
        },
      },
      Book: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          slug: { type: 'string' },
          status: { type: 'string', enum: ['draft', 'published', 'archived'] },
          isPremium: { type: 'boolean' },
          accessTier: { type: 'string', enum: ['FREE', 'PAID'], nullable: true },
          rating: { type: 'number' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      AuditLog: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          action: { type: 'string', example: 'update_status' },
          entity: { type: 'string', example: 'user' },
          entityId: { type: 'string', nullable: true },
          userId: { type: 'string', nullable: true },
          metadata: { type: 'object', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      PaginatedUsers: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          data: { type: 'array', items: { $ref: '#/components/schemas/User' } },
          meta: {
            type: 'object',
            properties: {
              page: { type: 'integer' },
              limit: { type: 'integer' },
              total: { type: 'integer' },
              totalPages: { type: 'integer' },
            },
          },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        security: [],
        responses: {
          200: {
            description: 'Service is healthy',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Health' } } },
          },
        },
      },
    },
    '/api/v1/auth/signup/guest': {
      post: {
        tags: ['Auth'],
        summary: 'Guest signup',
        security: [],
        requestBody: jsonBody({
          type: 'object',
          properties: { name: { type: 'string', minLength: 2 } },
          required: ['name'],
        }),
        responses: {
          201: successEnvelope('Guest account created with tokens', '#/components/schemas/TokenPair'),
          422: errorResponse('Validation failed'),
        },
      },
    },
    '/api/v1/auth/signup/email': {
      post: {
        tags: ['Auth'],
        summary: 'Email signup',
        security: [],
        requestBody: jsonBody({
          type: 'object',
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 },
            name: { type: 'string', minLength: 2 },
          },
          required: ['email', 'password', 'name'],
        }),
        responses: {
          201: successEnvelope('Account created with tokens', '#/components/schemas/TokenPair'),
          409: errorResponse('Email already registered'),
        },
      },
    },
    '/api/v1/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login with email or phone',
        security: [],
        requestBody: jsonBody({
          type: 'object',
          properties: {
            email: { type: 'string', description: 'Email or phone number' },
            password: { type: 'string' },
          },
          required: ['email', 'password'],
        }),
        responses: {
          200: successEnvelope('Logged in', '#/components/schemas/TokenPair'),
          401: errorResponse('Invalid credentials'),
          423: errorResponse('Account locked (rate limited)'),
        },
      },
    },
    '/api/v1/auth/login/otp': {
      post: {
        tags: ['Auth'],
        summary: 'Login with SMS OTP',
        security: [],
        requestBody: jsonBody({
          type: 'object',
          properties: { phone: { type: 'string' }, otp: { type: 'string' } },
          required: ['phone', 'otp'],
        }),
        responses: {
          200: successEnvelope('Logged in', '#/components/schemas/TokenPair'),
          401: errorResponse('Invalid or expired OTP'),
        },
      },
    },
    '/api/v1/auth/refresh-token': {
      post: {
        tags: ['Auth'],
        summary: 'Rotate refresh token and get a new access token',
        security: [],
        requestBody: jsonBody({
          type: 'object',
          properties: { refreshToken: { type: 'string' } },
          required: ['refreshToken'],
        }),
        responses: {
          200: successEnvelope('New token pair', '#/components/schemas/TokenPair'),
          401: errorResponse('Invalid or reused refresh token'),
        },
      },
    },
    '/api/v1/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Revoke a refresh token',
        security: [],
        requestBody: jsonBody({
          type: 'object',
          properties: { refreshToken: { type: 'string' } },
          required: ['refreshToken'],
        }),
        responses: { 200: { description: 'Logged out' } },
      },
    },
    '/api/v1/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Request a password reset code',
        security: [],
        requestBody: jsonBody({
          type: 'object',
          properties: { email: { type: 'string', format: 'email' } },
          required: ['email'],
        }),
        responses: { 200: { description: 'Reset code sent (if the account exists)' } },
      },
    },
    '/api/v1/auth/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Reset password with a code',
        security: [],
        requestBody: jsonBody({
          type: 'object',
          properties: {
            email: { type: 'string', format: 'email' },
            code: { type: 'string' },
            newPassword: { type: 'string', minLength: 8 },
          },
          required: ['email', 'code', 'newPassword'],
        }),
        responses: { 200: { description: 'Password updated' } },
      },
    },
    '/api/v1/users': {
      get: {
        tags: ['Users'],
        summary: 'List users (admin)',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          {
            name: 'status',
            in: 'query',
            schema: { type: 'string', enum: ['ACTIVE', 'SUSPENDED', 'BLOCKED', 'DELETED'] },
          },
        ],
        responses: {
          200: {
            description: 'Paginated users',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedUsers' } } },
          },
          403: errorResponse('Missing users:read permission'),
        },
      },
    },
    '/api/v1/users/bulk-status': {
      post: {
        tags: ['Users'],
        summary: 'Update status of many users',
        requestBody: jsonBody({
          type: 'object',
          properties: {
            ids: { type: 'array', items: { type: 'string' } },
            status: { type: 'string', enum: ['ACTIVE', 'SUSPENDED', 'BLOCKED', 'DELETED'] },
          },
          required: ['ids', 'status'],
        }),
        responses: { 200: { description: 'Users updated' } },
      },
    },
    '/api/v1/users/bulk-delete': {
      post: {
        tags: ['Users'],
        summary: 'Delete many users',
        requestBody: jsonBody({
          type: 'object',
          properties: { ids: { type: 'array', items: { type: 'string' } } },
          required: ['ids'],
        }),
        responses: { 200: { description: 'Users deleted' } },
      },
    },
    '/api/v1/users/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Get user detail (includes roles)',
        ...params(['id', { type: 'string' }]),
        responses: {
          200: successEnvelope('User retrieved', '#/components/schemas/User'),
          404: errorResponse('User not found'),
        },
      },
      delete: {
        tags: ['Users'],
        summary: 'Delete a user',
        ...params(['id', { type: 'string' }]),
        responses: { 200: { description: 'User deleted' }, 400: errorResponse('Cannot delete your own account') },
      },
    },
    '/api/v1/users/{id}/status': {
      patch: {
        tags: ['Users'],
        summary: 'Update a user status',
        ...params(['id', { type: 'string' }]),
        requestBody: jsonBody({
          type: 'object',
          properties: { status: { type: 'string', enum: ['ACTIVE', 'SUSPENDED', 'BLOCKED', 'DELETED'] } },
          required: ['status'],
        }),
        responses: { 200: { description: 'Status updated' } },
      },
    },
    '/api/v1/users/{id}/roles': {
      put: {
        tags: ['Users'],
        summary: 'Replace a user roles (admin role assignment)',
        description:
          'Replaces the full role set. Only a super_admin may remove the super_admin role, and never from yourself.',
        ...params(['id', { type: 'string' }]),
        requestBody: jsonBody({
          type: 'object',
          properties: { roleIds: { type: 'array', items: { type: 'string' } } },
          required: ['roleIds'],
        }),
        responses: {
          200: successEnvelope('User roles updated', '#/components/schemas/User'),
          403: errorResponse('Not allowed to remove super_admin'),
        },
      },
    },
    '/api/v1/users/{id}/reset-password': {
      post: {
        tags: ['Users'],
        summary: 'Admin password reset (returns a temporary password)',
        ...params(['id', { type: 'string' }]),
        requestBody: jsonBody({
          type: 'object',
          properties: { newPassword: { type: 'string', minLength: 8 } },
        }),
        responses: { 200: { description: 'Returns { tempPassword } and revokes active sessions' } },
      },
    },
    '/api/v1/roles': {
      get: {
        tags: ['Roles & Permissions'],
        summary: 'List roles',
        responses: { 200: { description: 'Roles list' } },
      },
      post: {
        tags: ['Roles & Permissions'],
        summary: 'Create a role',
        requestBody: jsonBody({
          type: 'object',
          properties: { name: { type: 'string' }, description: { type: 'string' } },
          required: ['name'],
        }),
        responses: { 201: successEnvelope('Role created', '#/components/schemas/Role') },
      },
    },
    '/api/v1/permissions/matrix': {
      get: {
        tags: ['Roles & Permissions'],
        summary: 'Permission matrix (all permissions grouped by resource)',
        responses: { 200: { description: 'Permission matrix' } },
      },
    },
    '/api/v1/permissions/matrix/{roleId}': {
      put: {
        tags: ['Roles & Permissions'],
        summary: 'Replace the permissions granted to a role',
        ...params(['roleId', { type: 'string' }]),
        requestBody: jsonBody({
          type: 'object',
          properties: { permissionIds: { type: 'array', items: { type: 'string' } } },
          required: ['permissionIds'],
        }),
        responses: { 200: { description: 'Permissions updated (audited)' } },
      },
    },
    '/api/v1/audit-logs': {
      get: {
        tags: ['Audit'],
        summary: 'List admin audit logs',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
        ],
        responses: {
          200: {
            description: 'Paginated audit logs',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/AuditLog' } } } },
          },
        },
      },
    },
    '/api/v1/books': {
      get: {
        tags: ['Content'],
        summary: 'List books (public, optional auth for entitlements)',
        security: [],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Paginated books' } },
      },
      post: {
        tags: ['Content'],
        summary: 'Create a book (multipart: cover, thumbnail, audio, pdf)',
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  cover: { type: 'string', format: 'binary' },
                  audio: { type: 'string', format: 'binary' },
                },
              },
            },
          },
        },
        responses: { 201: successEnvelope('Book created', '#/components/schemas/Book') },
      },
    },
    '/api/v1/books/{id}': {
      get: {
        tags: ['Content'],
        summary: 'Get book detail',
        security: [],
        ...params(['id', { type: 'string' }]),
        responses: { 200: successEnvelope('Book retrieved', '#/components/schemas/Book') },
      },
      put: { tags: ['Content'], summary: 'Update a book', ...params(['id', { type: 'string' }]), responses: { 200: { description: 'Book updated' } } },
      delete: { tags: ['Content'], summary: 'Delete a book', ...params(['id', { type: 'string' }]), responses: { 200: { description: 'Book deleted' } } },
    },
    '/api/v1/categories': {
      get: { tags: ['Content'], summary: 'List categories', security: [], responses: { 200: { description: 'Categories' } } },
    },
    '/api/v1/media/files': {
      post: {
        tags: ['Media'],
        summary: 'Upload a file (image/audio/pdf, max 20 MB)',
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: { file: { type: 'string', format: 'binary' }, folderId: { type: 'string' } },
                required: ['file'],
              },
            },
          },
        },
        responses: { 201: { description: 'File record created with a stored URL' } },
      },
      get: { tags: ['Media'], summary: 'List media files', responses: { 200: { description: 'Files list' } } },
    },
    '/api/v1/media/videos/upload-url': {
      post: {
        tags: ['Media'],
        summary: 'Request a presigned R2 upload URL for a video',
        requestBody: jsonBody({
          type: 'object',
          properties: {
            title: { type: 'string' },
            contentType: { type: 'string' },
            size: { type: 'integer' },
          },
          required: ['contentType', 'size'],
        }),
        responses: { 201: { description: 'Presigned PUT URL + video id' } },
      },
    },
    '/api/v1/media/videos/{id}/complete': {
      post: {
        tags: ['Media'],
        summary: 'Mark a video upload complete (registers duration/thumbnail)',
        ...params(['id', { type: 'string' }]),
        responses: { 200: { description: 'Video registered' } },
      },
    },
    '/api/v1/media/videos/{id}/play': {
      get: {
        tags: ['Media'],
        summary: 'Get a playback URL (PUBLIC anonymous, PREMIUM requires subscription)',
        security: [],
        ...params(['id', { type: 'string' }]),
        responses: { 200: { description: 'Signed playback URL' }, 403: errorResponse('Subscription required') },
      },
    },
    '/api/v1/settings': {
      get: { tags: ['Settings'], summary: 'Get all application settings', responses: { 200: { description: 'Settings map' } } },
      put: { tags: ['Settings'], summary: 'Update many settings', responses: { 200: { description: 'Settings updated' } } },
    },
    '/api/v1/settings/{key}': {
      put: {
        tags: ['Settings'],
        summary: 'Update one setting',
        ...params(['key', { type: 'string' }]),
        requestBody: jsonBody({ type: 'object', properties: { value: {} }, required: ['value'] }),
        responses: { 200: { description: 'Setting updated' } },
      },
    },
    '/api/v1/payments/webhooks/stripe': {
      post: {
        tags: ['Payments'],
        summary: 'Stripe webhook (signature-verified, raw body)',
        security: [],
        responses: { 200: { description: 'Webhook processed' }, 400: errorResponse('Invalid signature') },
      },
    },
  },
};

export const docsPath = '/api/v1/docs';

export const swaggerUiServe = swaggerUi.serve;
export const swaggerUiOptions = {
  customSiteTitle: 'Bariisaa TV API Docs',
  explorer: false,
  swaggerOptions: { persistAuthorization: true },
};
export const swaggerUiSetup = swaggerUi.setup(openapiSpec, swaggerUiOptions);

// Runnable: `npm run swagger` prints the spec JSON to stdout.
if (require.main === module) {
  process.stdout.write(JSON.stringify(openapiSpec, null, 2));
}
