import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import taskRoutes from './routes/taskRoutes';
import { dynamodb } from './config/dynamodb';
import { DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api/tasks', taskRoutes);

// Health check endpoint
app.get('/health', async (_req: Request, res: Response) => {
  try {
    await dynamodb.send(new DescribeTableCommand({ TableName: process.env.DYNAMODB_TABLE }));
    res.json({ status: 'ok', dynamodb: 'connected', environment: process.env.NODE_ENV });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      dynamodb: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Error handling
app.use(errorHandler);

// Start server
app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
  logger.info(`API Documentation available at http://localhost:${port}/api-docs`);
});

export default app;
