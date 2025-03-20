import awsServerlessExpress from 'aws-serverless-express';
import app from './index';

// Create server
const server = awsServerlessExpress.createServer(app);

// Lambda handler
export const handler = (event: any, context: any) => {
  awsServerlessExpress.proxy(server, event, context);
};