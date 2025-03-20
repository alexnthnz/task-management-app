export const TASK_STATUS = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
} as const;

export type TaskStatus = (typeof TASK_STATUS)[keyof typeof TASK_STATUS];

export const API_ENDPOINTS = {
  TASKS: '/api/tasks',
  HEALTH: '/health',
} as const;

export const ERROR_MESSAGES = {
  TASK_NOT_FOUND: 'Task not found',
  INVALID_STATUS: 'Invalid task status',
  SERVER_ERROR: 'Internal server error',
  VALIDATION_ERROR: 'Validation error',
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;
