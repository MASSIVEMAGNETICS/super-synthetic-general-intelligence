import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import workspacesRouter from './routes/workspaces';
import artifactsRouter from './routes/artifacts';
import agentsRouter from './routes/agents';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT ?? 3001;

// Security middleware
app.use(helmet());
app.use(cors());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'aetherforge-backend', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/workspaces', workspacesRouter);
app.use('/api/artifacts', artifactsRouter);
app.use('/api/agents', agentsRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler (must be last)
app.use(errorHandler);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`AetherForge backend running on port ${PORT}`);
  });
}

export default app;
