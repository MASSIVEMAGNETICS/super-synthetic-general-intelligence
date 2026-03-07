import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { workspaceManager } from '../services/workspaceManager';
import { storageService } from '../services/storageService';
import { createError } from '../middleware/errorHandler';

const router = Router();

// GET /api/workspaces - list all
router.get('/', (_req: Request, res: Response) => {
  const workspaces = workspaceManager.getAllWorkspaces();
  res.json({ workspaces, count: workspaces.length });
});

// POST /api/workspaces - create
router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('description').optional().isString(),
  ],
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createError(errors.array()[0].msg as string, 400));
    }
    const { name, description = '' } = req.body as { name: string; description?: string };
    const workspace = workspaceManager.createWorkspace(name, description);
    return res.status(201).json({ workspace });
  }
);

// GET /api/workspaces/:id - get by id
router.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  const workspace = workspaceManager.getWorkspace(req.params.id);
  if (!workspace) return next(createError('Workspace not found', 404));
  return res.json({ workspace });
});

// PUT /api/workspaces/:id - update
router.put('/:id', (req: Request, res: Response, next: NextFunction) => {
  const { name, description } = req.body as { name?: string; description?: string };
  const workspace = workspaceManager.updateWorkspace(req.params.id, { name, description });
  if (!workspace) return next(createError('Workspace not found', 404));
  return res.json({ workspace });
});

// DELETE /api/workspaces/:id - delete
router.delete('/:id', (req: Request, res: Response, next: NextFunction) => {
  const deleted = workspaceManager.deleteWorkspace(req.params.id);
  if (!deleted) return next(createError('Workspace not found', 404));
  return res.json({ message: 'Workspace deleted successfully' });
});

// GET /api/workspaces/:id/artifacts - get workspace artifacts
router.get('/:id/artifacts', (req: Request, res: Response, next: NextFunction) => {
  const workspace = workspaceManager.getWorkspace(req.params.id);
  if (!workspace) return next(createError('Workspace not found', 404));
  const artifacts = storageService.getArtifactsByWorkspace(req.params.id);
  return res.json({ artifacts, count: artifacts.length });
});

// GET /api/workspaces/:id/agents - get workspace agents
router.get('/:id/agents', (req: Request, res: Response, next: NextFunction) => {
  const workspace = workspaceManager.getWorkspace(req.params.id);
  if (!workspace) return next(createError('Workspace not found', 404));
  const agents = storageService.getAgentsByWorkspace(req.params.id);
  return res.json({ agents, count: agents.length });
});

export default router;
