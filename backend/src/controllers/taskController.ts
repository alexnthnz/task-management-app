import { Response } from 'express';
import { logger } from '../utils/logger';
import { NotFoundError } from '../utils/errors';
import {
  ExpressRequest,
  GetTasksRequest,
  GetTaskByIdRequest,
  CreateTaskRequest,
  UpdateTaskRequest,
  DeleteTaskRequest
} from '../types/api';
import { TaskService } from '../services/taskService';

const taskService = new TaskService();

// Get all tasks
export const getTasks = async (req: ExpressRequest<GetTasksRequest>, res: Response): Promise<void> => {
  try {
    const query = req.query || {};
    const tasks = await taskService.getAllTasks(query.status);
    res.json(tasks);
  } catch (error) {
    logger.error('Error getting tasks:', error);
    res.status(500).json({ error: 'Failed to get tasks' });
  }
};

// Get task by ID
export const getTaskById = async (req: ExpressRequest<GetTaskByIdRequest>, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const task = await taskService.getTaskById(id);
    res.json(task);
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
    } else {
      logger.error('Error getting task:', error);
      res.status(500).json({ error: 'Failed to get task' });
    }
  }
};

// Create task
export const createTask = async (req: ExpressRequest<CreateTaskRequest>, res: Response): Promise<void> => {
  try {
    const input = req.body;
    const task = await taskService.createTask(input);
    res.status(201).json(task);
  } catch (error) {
    logger.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
};

// Update task
export const updateTask = async (req: ExpressRequest<UpdateTaskRequest>, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const input = req.body;
    const task = await taskService.updateTask(id, input);
    res.json(task);
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
    } else {
      logger.error('Error updating task:', error);
      res.status(500).json({ error: 'Failed to update task' });
    }
  }
};

// Delete task
export const deleteTask = async (req: ExpressRequest<DeleteTaskRequest>, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await taskService.deleteTask(id);
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
}; 