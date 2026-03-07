import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { agentManager } from '../services/agentManager';
import { storageService } from '../services/storageService';
import { safetyService } from '../services/safetyService';
import { createError } from '../middleware/errorHandler';
import { Agent } from '../models/types';

const router = Router();

// GET /api/agents - list all agents
router.get('/', (_req: Request, res: Response) => {
  const agents = storageService.getAllAgents();
  res.json({ agents, count: agents.length });
});

// POST /api/agents/constitution/check - check constitution
// NOTE: This route MUST be registered before /:id to avoid route conflicts
router.post('/constitution/check', (req: Request, res: Response, next: NextFunction) => {
  const agent = req.body as Agent;
  if (!agent || !agent.constitution) {
    return next(createError('Agent data with constitution is required', 400));
  }
  const result = safetyService.checkConstitution(agent);
  return res.json({ result });
});

// POST /api/agents - create agent
router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('workspaceId').notEmpty().withMessage('workspaceId is required'),
  ],
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createError(errors.array()[0].msg as string, 400));
    }

    const { workspaceId, ...agentData } = req.body as { workspaceId: string } & Partial<Agent>;
    const agent = agentManager.createAgent(workspaceId, agentData);
    return res.status(201).json({ agent });
  }
);

// GET /api/agents/:id - get agent
router.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  const agent = storageService.getAgent(req.params.id);
  if (!agent) return next(createError('Agent not found', 404));
  return res.json({ agent });
});

// PUT /api/agents/:id - update agent with safety check
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  const original = storageService.getAgent(req.params.id);
  if (!original) return next(createError('Agent not found', 404));

  const updates = req.body as Partial<Agent>;

  // Run safety check on proposed mutation
  const safetyResult = safetyService.checkAgentMutation(original, updates);
  if (!safetyResult.passed) {
    return res.status(422).json({
      error: 'Safety check failed',
      violations: safetyResult.violations,
      warnings: safetyResult.warnings,
    });
  }

  const updatedAgent = agentManager.updateAgent(req.params.id, updates);
  if (!updatedAgent) return next(createError('Agent not found', 404));

  return res.json({
    agent: updatedAgent,
    safetyWarnings: safetyResult.warnings,
  });
});

// DELETE /api/agents/:id - delete agent
router.delete('/:id', (req: Request, res: Response, next: NextFunction) => {
  const agent = storageService.getAgent(req.params.id);
  if (!agent) return next(createError('Agent not found', 404));

  storageService.deleteAgent(req.params.id);

  // Remove from workspace
  const workspace = storageService.getWorkspace(agent.workspaceId);
  if (workspace) {
    workspace.agents = workspace.agents.filter(id => id !== req.params.id);
    workspace.updatedAt = new Date().toISOString();
    storageService.saveWorkspace(workspace);
  }

  return res.json({ message: 'Agent deleted successfully' });
});

// POST /api/agents/:id/fork - fork agent
router.post('/:id/fork', (req: Request, res: Response, next: NextFunction) => {
  const { changelog = 'Forked agent' } = req.body as { changelog?: string };
  const forkedAgent = agentManager.forkAgent(req.params.id, changelog);
  if (!forkedAgent) return next(createError('Agent not found', 404));
  return res.status(201).json({ agent: forkedAgent });
});

// POST /api/agents/:id/deploy - deploy agent
router.post(
  '/:id/deploy',
  [body('target').notEmpty().withMessage('Deployment target is required')],
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createError(errors.array()[0].msg as string, 400));
    }

    try {
      const { target } = req.body as { target: string };
      const deployedAgent = agentManager.deployAgent(req.params.id, target);
      if (!deployedAgent) return next(createError('Agent not found', 404));
      return res.json({ agent: deployedAgent, message: `Agent deployed to ${target}` });
    } catch (err) {
      return next(err);
    }
  }
);

// GET /api/agents/:id/versions - get version history
router.get('/:id/versions', (req: Request, res: Response, next: NextFunction) => {
  const versions = agentManager.getVersionHistory(req.params.id);
  if (!versions) return next(createError('Agent not found', 404));
  return res.json({ versions });
});

export default router;
