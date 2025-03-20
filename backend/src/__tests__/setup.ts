import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const ddbMock = mockClient(DynamoDBDocumentClient);

jest.mock('../config/dynamodb', () => ({
  dynamodb: DynamoDBDocumentClient.prototype,
  TABLE_NAME: 'test-table',
}));

export { ddbMock as mockSend }; 