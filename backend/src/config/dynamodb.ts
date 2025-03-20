import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const isLocal = process.env.NODE_ENV === 'development';

const client = new DynamoDBClient({
  region: isLocal ? 'local' : (process.env.AWS_REGION || 'ap-southeast-2'),
  endpoint: isLocal ? process.env.DYNAMODB_ENDPOINT : undefined,
  credentials: isLocal ? {
    accessKeyId: 'local',
    secretAccessKey: 'local'
  } : undefined
});

// Configure the DocumentClient with marshalling options
const marshallOptions = {
  removeUndefinedValues: true,
  convertEmptyValues: true
};

export const dynamodb = DynamoDBDocumentClient.from(client, { marshallOptions });
export const TABLE_NAME = process.env.DYNAMODB_TABLE || 'dev-task-management-tasks'; 