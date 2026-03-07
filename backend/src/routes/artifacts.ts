import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { orchestrator } from '../services/orchestrator';
import { storageService } from '../services/storageService';
import { createError } from '../middleware/errorHandler';
import { OrchestrationRequest } from '../models/types';

const router = Router();

// POST /api/artifacts/generate - generate artifact from intent
router.post(
  '/generate',
  [
    body('intent').notEmpty().withMessage('Intent is required'),
    body('outputType').optional().isIn(['document', 'slides', 'report', 'code', 'spreadsheet']),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createError(errors.array()[0].msg as string, 400));
    }

    try {
      const orchestrationReq: OrchestrationRequest = {
        intent: req.body.intent as string,
        workspaceId: req.body.workspaceId as string | undefined,
        outputType: req.body.outputType as OrchestrationRequest['outputType'],
        context: req.body.context as Record<string, unknown> | undefined,
      };

      const { result, artifact } = await orchestrator.orchestrate(orchestrationReq);
      return res.status(201).json({ result, artifact });
    } catch (err) {
      return next(err);
    }
  }
);

// GET /api/artifacts/:id - get artifact
router.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  const artifact = storageService.getArtifact(req.params.id);
  if (!artifact) return next(createError('Artifact not found', 404));
  return res.json({ artifact });
});

// PUT /api/artifacts/:id - update artifact
router.put('/:id', (req: Request, res: Response, next: NextFunction) => {
  const artifact = storageService.getArtifact(req.params.id);
  if (!artifact) return next(createError('Artifact not found', 404));

  const now = new Date().toISOString();
  const newContent = (req.body.content as string | undefined) ?? artifact.content;

  // Save version snapshot
  const versionEntry = { version: artifact.version, content: artifact.content, createdAt: now };

  const updatedArtifact = {
    ...artifact,
    ...(req.body as object),
    id: artifact.id, // Prevent ID change
    workspaceId: artifact.workspaceId,
    content: newContent,
    version: artifact.version + 1,
    versions: [...artifact.versions, versionEntry],
    updatedAt: now,
  };

  storageService.saveArtifact(updatedArtifact);
  return res.json({ artifact: updatedArtifact });
});

// DELETE /api/artifacts/:id - delete artifact
router.delete('/:id', (req: Request, res: Response, next: NextFunction) => {
  const artifact = storageService.getArtifact(req.params.id);
  if (!artifact) return next(createError('Artifact not found', 404));

  storageService.deleteArtifact(req.params.id);

  // Remove from workspace
  const workspace = storageService.getWorkspace(artifact.workspaceId);
  if (workspace) {
    workspace.artifacts = workspace.artifacts.filter(id => id !== req.params.id);
    workspace.updatedAt = new Date().toISOString();
    storageService.saveWorkspace(workspace);
  }

  return res.json({ message: 'Artifact deleted successfully' });
});

// GET /api/artifacts/:id/download - download artifact as file
router.get('/:id/download', (req: Request, res: Response, next: NextFunction) => {
  const artifact = storageService.getArtifact(req.params.id);
  if (!artifact) return next(createError('Artifact not found', 404));

  const extensionMap: Record<string, string> = {
    document: 'md',
    slides: 'json',
    report: 'md',
    code: 'md',
    spreadsheet: 'csv',
    image: 'png',
  };

  const contentTypeMap: Record<string, string> = {
    document: 'text/markdown',
    slides: 'application/json',
    report: 'text/markdown',
    code: 'text/markdown',
    spreadsheet: 'text/csv',
    image: 'image/png',
  };

  const ext = extensionMap[artifact.type] ?? 'txt';
  const contentType = contentTypeMap[artifact.type] ?? 'text/plain';
  const filename = `${artifact.name.replace(/[^a-zA-Z0-9-_]/g, '_')}.${ext}`;

  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', contentType);
  return res.send(artifact.content);
});

// GET /api/artifacts/:id/versions - get version history
router.get('/:id/versions', (req: Request, res: Response, next: NextFunction) => {
  const artifact = storageService.getArtifact(req.params.id);
  if (!artifact) return next(createError('Artifact not found', 404));
  return res.json({ versions: artifact.versions, currentVersion: artifact.version });
});

export default router;
