import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Task Management API',
      version: '1.0.0',
      description: 'API documentation for the Task Management application',
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
    ],
    components: {
      schemas: {
        TaskList: { 
          type: 'array',
          description: 'Array of tasks',
          items: {
            $ref: '#/components/schemas/Task',
          },
        },
        Task: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique identifier of the task',
            },
            title: {
              type: 'string',
              description: 'Title of the task',
              maxLength: 100,
            },
            description: {
              type: 'string',
              description: 'Description of the task',
              maxLength: 500,
            },
            status: {
              type: 'string',
              enum: ['TODO', 'IN_PROGRESS', 'COMPLETED'],
              description: 'Current status of the task',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp of the task',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp of the task',
            },
          },
          required: ['id', 'title', 'status', 'createdAt', 'updatedAt'],
        },
        CreateTaskInput: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Title of the task',
              maxLength: 100,
            },
            description: {
              type: 'string',
              description: 'Description of the task',
              maxLength: 500,
            },
            status: {
              type: 'string',
              enum: ['TODO', 'IN_PROGRESS', 'COMPLETED'],
              description: 'Initial status of the task',
              default: 'TODO',
            },
          },
          required: ['title'],
        },
        UpdateTaskInput: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Title of the task',
              maxLength: 100,
            },
            description: {
              type: 'string',
              description: 'Description of the task',
              maxLength: 500,
            },
            status: {
              type: 'string',
              enum: ['TODO', 'IN_PROGRESS', 'COMPLETED'],
              description: 'New status of the task',
            },
          },
          required: ['title'],
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'], // Path to the API routes
};

export const swaggerSpec = swaggerJsdoc(options); 