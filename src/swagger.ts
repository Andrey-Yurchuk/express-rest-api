import swaggerJSDoc from 'swagger-jsdoc';

const port = process.env.PORT ?? '3000';
const localServerUrl = `http://localhost:${port}`;

const errorResponse = {
  description: 'Error response',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorResponse' },
    },
  },
};

const tokenPairResponse = {
  description: 'Access and refresh token pair',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/TokenPair' },
    },
  },
};

const fileMetadataResponse = {
  description: 'File metadata',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/FileMetadata' },
    },
  },
};

const messageResponse = {
  description: 'Message response',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/MessageResponse' },
    },
  },
};

const definition: swaggerJSDoc.OAS3Definition = {
  openapi: '3.0.0',
  info: {
    title: 'Express REST API',
    version: '0.1.0',
    description:
      'REST API for the ERP.AERO Node.js test task. Provides authentication, session management and file CRUD endpoints under the /api prefix.',
  },
  servers: [{ url: localServerUrl, description: 'localhost' }],
  tags: [
    { name: 'Health', description: 'Service health checks' },
    { name: 'Auth', description: 'Authentication and session management' },
    { name: 'Files', description: 'File upload, download, update and delete' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      AuthCredentials: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'User login: email or phone number',
            example: 'user@example.com',
          },
          password: {
            type: 'string',
            format: 'password',
            example: 'password123',
          },
        },
        required: ['id', 'password'],
      },
      TokenPair: {
        type: 'object',
        properties: {
          accessToken: { type: 'string' },
          refreshToken: { type: 'string' },
        },
        required: ['accessToken', 'refreshToken'],
      },
      RefreshTokenRequest: {
        type: 'object',
        properties: {
          refreshToken: { type: 'string' },
        },
        required: ['refreshToken'],
      },
      InfoResponse: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'user@example.com',
          },
        },
        required: ['id'],
      },
      MessageResponse: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Logged out' },
        },
        required: ['message'],
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Unauthorized' },
        },
        required: ['message'],
      },
      FileMetadata: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'cmpicdtvr0001mf206rnns2d7' },
          originalName: { type: 'string', example: 'package.json' },
          extension: { type: 'string', example: '.json' },
          mimeType: { type: 'string', example: 'application/json' },
          size: { type: 'integer', example: 2035 },
          storedName: {
            type: 'string',
            example: '7cc621a5-262d-41c9-9c82-ebc6c7eb9600.json',
          },
          uploadedAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
        required: [
          'id',
          'originalName',
          'extension',
          'mimeType',
          'size',
          'storedName',
          'uploadedAt',
          'updatedAt',
        ],
      },
      FileListResponse: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: { $ref: '#/components/schemas/FileMetadata' },
          },
          page: { type: 'integer', example: 1 },
          listSize: { type: 'integer', example: 10 },
        },
        required: ['items', 'page', 'listSize'],
      },
      FileUploadRequest: {
        type: 'object',
        properties: {
          file: {
            type: 'string',
            format: 'binary',
            description: 'Binary file payload',
          },
        },
        required: ['file'],
      },
    },
  },
  paths: {
    '/api/health': {
      get: {
        tags: ['Health'],
        summary: 'Service health check',
        responses: {
          '200': {
            description: 'Service is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                  },
                  required: ['status'],
                },
              },
            },
          },
        },
      },
    },
    '/api/signup': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AuthCredentials' },
            },
          },
        },
        responses: {
          '201': tokenPairResponse,
          '400': errorResponse,
          '409': errorResponse,
          '500': errorResponse,
        },
      },
    },
    '/api/signin': {
      post: {
        tags: ['Auth'],
        summary: 'Sign in with id and password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AuthCredentials' },
            },
          },
        },
        responses: {
          '200': tokenPairResponse,
          '400': errorResponse,
          '401': errorResponse,
          '500': errorResponse,
        },
      },
    },
    '/api/signin/new_token': {
      post: {
        tags: ['Auth'],
        summary: 'Rotate refresh token and get a new pair',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RefreshTokenRequest' },
            },
          },
        },
        responses: {
          '200': tokenPairResponse,
          '400': errorResponse,
          '401': errorResponse,
          '500': errorResponse,
        },
      },
    },
    '/api/info': {
      get: {
        tags: ['Auth'],
        summary: 'Get the current user id',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Current user id',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/InfoResponse' },
              },
            },
          },
          '401': errorResponse,
          '500': errorResponse,
        },
      },
    },
    '/api/logout': {
      get: {
        tags: ['Auth'],
        summary: 'Log out the current session',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': messageResponse,
          '401': errorResponse,
          '500': errorResponse,
        },
      },
    },
    '/api/file/upload': {
      post: {
        tags: ['Files'],
        summary: 'Upload a new file',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: { $ref: '#/components/schemas/FileUploadRequest' },
            },
          },
        },
        responses: {
          '201': fileMetadataResponse,
          '400': errorResponse,
          '401': errorResponse,
          '500': errorResponse,
        },
      },
    },
    '/api/file/list': {
      get: {
        tags: ['Files'],
        summary: 'List uploaded files with pagination',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'list_size',
            in: 'query',
            required: false,
            schema: { type: 'integer', minimum: 1, default: 10 },
            description: 'Page size, default 10',
          },
          {
            name: 'page',
            in: 'query',
            required: false,
            schema: { type: 'integer', minimum: 1, default: 1 },
            description: 'Page number, default 1',
          },
        ],
        responses: {
          '200': {
            description: 'Paginated list of files',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/FileListResponse' },
              },
            },
          },
          '400': errorResponse,
          '401': errorResponse,
          '500': errorResponse,
        },
      },
    },
    '/api/file/{id}': {
      get: {
        tags: ['Files'],
        summary: 'Get file metadata by id',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': fileMetadataResponse,
          '401': errorResponse,
          '404': errorResponse,
          '500': errorResponse,
        },
      },
    },
    '/api/file/download/{id}': {
      get: {
        tags: ['Files'],
        summary: 'Download a file by id',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Binary file stream with Content-Disposition: attachment',
            headers: {
              'Content-Disposition': {
                description: 'attachment; filename="ORIGINAL_NAME"',
                schema: { type: 'string' },
              },
            },
            content: {
              'application/octet-stream': {
                schema: { type: 'string', format: 'binary' },
              },
            },
          },
          '401': errorResponse,
          '404': errorResponse,
          '500': errorResponse,
        },
      },
    },
    '/api/file/update/{id}': {
      put: {
        tags: ['Files'],
        summary: 'Replace a stored file and update metadata',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: { $ref: '#/components/schemas/FileUploadRequest' },
            },
          },
        },
        responses: {
          '200': fileMetadataResponse,
          '400': errorResponse,
          '401': errorResponse,
          '404': errorResponse,
          '500': errorResponse,
        },
      },
    },
    '/api/file/delete/{id}': {
      delete: {
        tags: ['Files'],
        summary: 'Delete a file by id',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': messageResponse,
          '401': errorResponse,
          '404': errorResponse,
          '500': errorResponse,
        },
      },
    },
  },
};

export const swaggerSpec = swaggerJSDoc({ definition, apis: [] });
