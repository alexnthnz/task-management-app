import {
  ScanCommand,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import { dynamodb, TABLE_NAME } from '../config/dynamodb';
import { Task, CreateTaskInput, UpdateTaskInput } from '../types/task';
import { NotFoundError } from '../utils/errors';
import { v4 as uuidv4 } from 'uuid';

export class TaskService {
  async getAllTasks(status?: string): Promise<Task[]> {
    const params: any = {
      TableName: TABLE_NAME,
    };

    if (status) {
      params.FilterExpression = '#status = :status';
      params.ExpressionAttributeNames = { '#status': 'status' };
      params.ExpressionAttributeValues = { ':status': status };
    }

    const allItems: Task[] = [];
    let lastEvaluatedKey: Record<string, any> | undefined;

    do {
      const command = new ScanCommand({
        ...params,
        ExclusiveStartKey: lastEvaluatedKey,
      });

      const result = await dynamodb.send(command);
      if (result.Items) {
        allItems.push(...(result.Items as Task[]));
      }
      lastEvaluatedKey = result.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    return allItems;
  }

  async getTaskById(id: string): Promise<Task> {
    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: { id },
    });

    const result = await dynamodb.send(command);
    if (!result.Item) {
      throw new NotFoundError('Task not found');
    }
    return result.Item as Task;
  }

  async createTask(input: CreateTaskInput): Promise<Task> {
    const task: Task = {
      id: uuidv4(),
      title: input.title,
      description: input.description || '',
      status: input.status || 'TODO',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: task,
    });

    await dynamodb.send(command);
    return task;
  }

  async updateTask(id: string, input: UpdateTaskInput): Promise<Task> {
    const command = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { id },
      UpdateExpression:
        'set #title = :title, #description = :description, #status = :status, #updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#title': 'title',
        '#description': 'description',
        '#status': 'status',
        '#updatedAt': 'updatedAt',
      },
      ExpressionAttributeValues: {
        ':title': input.title,
        ':description': input.description || '',
        ':status': input.status || 'TODO',
        ':updatedAt': new Date().toISOString(),
      },
      ReturnValues: 'ALL_NEW',
    });

    const result = await dynamodb.send(command);
    if (!result.Attributes) {
      throw new NotFoundError('Task not found');
    }
    return result.Attributes as Task;
  }

  async deleteTask(id: string): Promise<void> {
    const command = new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { id },
    });

    await dynamodb.send(command);
  }
}
