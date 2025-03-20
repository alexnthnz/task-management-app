import { Request } from 'express';
import { Task, CreateTaskInput, UpdateTaskInput } from './task';

// Base request types
export interface BaseRequest {
  body: any;
  query: any;
  params: any;
}

// Get all tasks request
export interface GetTasksRequest extends BaseRequest {
  query: {
    status?: Task['status'];
  };
}

// Get task by ID request
export interface GetTaskByIdRequest extends BaseRequest {
  params: {
    id: string;
  };
}

// Create task request
export interface CreateTaskRequest extends BaseRequest {
  body: CreateTaskInput;
}

// Update task request
export interface UpdateTaskRequest extends BaseRequest {
  params: {
    id: string;
  };
  body: UpdateTaskInput;
}

// Delete task request
export interface DeleteTaskRequest extends BaseRequest {
  params: {
    id: string;
  };
}

// Express request type helpers
export type ExpressRequest<T extends BaseRequest> = Request<
  T['params'],
  unknown,
  T['body'],
  T['query']
>; 