import { describe, it, expect, beforeEach } from '@jest/globals';
import { TaskService } from '../../services/taskService';
import { mockSend } from '../setup';
import { NotFoundError } from '../../utils/errors';
import { ScanCommand, GetCommand, PutCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED';

describe('TaskService', () => {
  let taskService: TaskService;

  beforeEach(() => {
    mockSend.reset();
    taskService = new TaskService();
  });

  describe('getAllTasks', () => {
    it('should return all tasks', async () => {
      const mockTasks = Array.from({ length: 20 }, (_, i) => ({
        id: `${i + 1}`,
        title: `Task ${i + 1}`,
        status: 'TODO',
        description: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      mockSend.on(ScanCommand).resolves({ Items: mockTasks });

      const result = await taskService.getAllTasks();

      expect(result).toHaveLength(20);
      expect(result[0]).toMatchObject({
        id: '1',
        title: 'Task 1',
        status: 'TODO',
      });
    });

    it('should filter tasks by status', async () => {
      const mockTasks = Array.from({ length: 5 }, (_, i) => ({
        id: `${i + 1}`,
        title: `Task ${i + 1}`,
        status: 'IN_PROGRESS',
        description: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      mockSend.on(ScanCommand).resolves({ Items: mockTasks });

      const result = await taskService.getAllTasks('IN_PROGRESS');

      expect(result).toHaveLength(5);
      expect(result[0]).toMatchObject({
        id: '1',
        title: 'Task 1',
        status: 'IN_PROGRESS',
      });
    });

    it('should handle empty results', async () => {
      mockSend.on(ScanCommand).resolves({ Items: [] });

      const result = await taskService.getAllTasks();

      expect(result).toHaveLength(0);
    });

    it('should handle pagination with LastEvaluatedKey', async () => {
      const firstBatch = Array.from({ length: 10 }, (_, i) => ({
        id: `${i + 1}`,
        title: `Task ${i + 1}`,
        status: 'TODO',
        description: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      const secondBatch = Array.from({ length: 10 }, (_, i) => ({
        id: `${i + 11}`,
        title: `Task ${i + 11}`,
        status: 'TODO',
        description: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      mockSend
        .on(ScanCommand)
        .resolvesOnce({ Items: firstBatch, LastEvaluatedKey: { id: '10' } })
        .resolvesOnce({ Items: secondBatch });

      const result = await taskService.getAllTasks();

      expect(result).toHaveLength(20);
      expect(result[0]).toMatchObject({
        id: '1',
        title: 'Task 1',
      });
      expect(result[19]).toMatchObject({
        id: '20',
        title: 'Task 20',
      });
    });
  });

  describe('getTaskById', () => {
    it('should return a task by ID', async () => {
      const mockTask = {
        id: '1',
        title: 'Test Task',
        status: 'TODO',
        description: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockSend.on(GetCommand).resolves({ Item: mockTask });

      const result = await taskService.getTaskById('1');

      expect(result).toMatchObject({
        id: '1',
        title: 'Test Task',
        status: 'TODO',
      });
    });

    it('should throw NotFoundError for non-existent task', async () => {
      mockSend.on(GetCommand).resolves({ Item: undefined });

      await expect(taskService.getTaskById('1')).rejects.toThrow(NotFoundError);
    });
  });

  describe('createTask', () => {
    it('should create a new task', async () => {
      const input = {
        title: 'New Task',
        description: 'Test Description',
        status: 'TODO' as TaskStatus,
      };

      mockSend.on(PutCommand).resolves({});

      const result = await taskService.createTask(input);

      expect(result).toMatchObject({
        id: expect.any(String),
        title: input.title,
        description: input.description,
        status: input.status,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('should create a task with default values', async () => {
      const input = {
        title: 'New Task',
      };

      mockSend.on(PutCommand).resolves({});

      const result = await taskService.createTask(input);

      expect(result).toMatchObject({
        id: expect.any(String),
        title: input.title,
        description: '',
        status: 'TODO',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });
  });

  describe('updateTask', () => {
    it('should update an existing task', async () => {
      const input = {
        title: 'Updated Task',
        description: 'Updated Description',
        status: 'IN_PROGRESS' as TaskStatus,
      };

      const mockTask = {
        id: '1',
        title: input.title,
        status: input.status,
        description: input.description,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: new Date().toISOString(),
      };

      mockSend.on(UpdateCommand).resolves({ Attributes: mockTask });

      const result = await taskService.updateTask('1', input);

      expect(result).toMatchObject({
        id: '1',
        title: input.title,
        description: input.description,
        status: input.status,
      });
    });

    it('should throw NotFoundError when updating non-existent task', async () => {
      const input = {
        title: 'Updated Task',
        description: 'Updated Description',
        status: 'IN_PROGRESS' as TaskStatus,
      };

      mockSend.on(UpdateCommand).resolves({ Attributes: undefined });

      await expect(taskService.updateTask('1', input)).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteTask', () => {
    it('should delete a task', async () => {
      mockSend.on(DeleteCommand).resolves({});

      await expect(taskService.deleteTask('1')).resolves.not.toThrow();
    });
  });
}); 