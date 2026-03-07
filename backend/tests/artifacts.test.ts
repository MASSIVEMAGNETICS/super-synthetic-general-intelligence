import request from 'supertest';
import app from '../src/index';

describe('Artifacts API', () => {
  let artifactId: string;
  let workspaceId: string;

  beforeAll(async () => {
    // Create a workspace to use in tests
    const res = await request(app)
      .post('/api/workspaces')
      .send({ name: 'Artifact Test Workspace', description: 'For artifact tests' });
    workspaceId = res.body.workspace.id as string;
  });

  describe('POST /api/artifacts/generate', () => {
    it('should generate a document artifact', async () => {
      const res = await request(app)
        .post('/api/artifacts/generate')
        .send({
          intent: 'Create a comprehensive guide to machine learning',
          outputType: 'document',
          workspaceId,
        });

      expect(res.status).toBe(201);
      expect(res.body.artifact).toBeDefined();
      expect(res.body.artifact.type).toBe('document');
      expect(res.body.artifact.content).toBeTruthy();
      expect(res.body.result).toBeDefined();
      expect(res.body.result.status).toBe('complete');
      expect(res.body.result.steps).toHaveLength(8);
      artifactId = res.body.artifact.id as string;
    });

    it('should generate a slides artifact', async () => {
      const res = await request(app)
        .post('/api/artifacts/generate')
        .send({
          intent: 'Create a presentation about cloud computing',
          outputType: 'slides',
          workspaceId,
        });

      expect(res.status).toBe(201);
      expect(res.body.artifact.type).toBe('slides');
      // Slides content should be valid JSON
      expect(() => JSON.parse(res.body.artifact.content as string)).not.toThrow();
    });

    it('should generate a report artifact', async () => {
      const res = await request(app)
        .post('/api/artifacts/generate')
        .send({
          intent: 'Generate a market analysis report for the SaaS industry',
          outputType: 'report',
          workspaceId,
        });

      expect(res.status).toBe(201);
      expect(res.body.artifact.type).toBe('report');
    });

    it('should generate a code artifact', async () => {
      const res = await request(app)
        .post('/api/artifacts/generate')
        .send({
          intent: 'Create a REST API client',
          outputType: 'code',
          workspaceId,
        });

      expect(res.status).toBe(201);
      expect(res.body.artifact.type).toBe('code');
    });

    it('should generate a spreadsheet artifact', async () => {
      const res = await request(app)
        .post('/api/artifacts/generate')
        .send({
          intent: 'Create a budget spreadsheet',
          outputType: 'spreadsheet',
          workspaceId,
        });

      expect(res.status).toBe(201);
      expect(res.body.artifact.type).toBe('spreadsheet');
    });

    it('should auto-infer type when not specified', async () => {
      const res = await request(app)
        .post('/api/artifacts/generate')
        .send({
          intent: 'Write a business proposal document',
          workspaceId,
        });

      expect(res.status).toBe(201);
      expect(res.body.artifact).toBeDefined();
    });

    it('should return 400 when intent is missing', async () => {
      const res = await request(app)
        .post('/api/artifacts/generate')
        .send({ outputType: 'document' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/artifacts/:id', () => {
    it('should get artifact by id', async () => {
      const res = await request(app).get(`/api/artifacts/${artifactId}`);
      expect(res.status).toBe(200);
      expect(res.body.artifact.id).toBe(artifactId);
    });

    it('should return 404 for non-existent artifact', async () => {
      const res = await request(app).get('/api/artifacts/nonexistent-id');
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/artifacts/:id', () => {
    it('should update artifact content', async () => {
      const res = await request(app)
        .put(`/api/artifacts/${artifactId}`)
        .send({ content: '# Updated Content\n\nThis content was updated.' });

      expect(res.status).toBe(200);
      expect(res.body.artifact.content).toBe('# Updated Content\n\nThis content was updated.');
      expect(res.body.artifact.version).toBeGreaterThan(1);
    });
  });

  describe('GET /api/artifacts/:id/download', () => {
    it('should download artifact as file', async () => {
      const res = await request(app).get(`/api/artifacts/${artifactId}/download`);
      expect(res.status).toBe(200);
      expect(res.headers['content-disposition']).toContain('attachment');
    });
  });

  describe('GET /api/artifacts/:id/versions', () => {
    it('should get version history', async () => {
      const res = await request(app).get(`/api/artifacts/${artifactId}/versions`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.versions)).toBe(true);
      expect(res.body.currentVersion).toBeDefined();
    });
  });

  describe('DELETE /api/artifacts/:id', () => {
    it('should delete artifact', async () => {
      const res = await request(app).delete(`/api/artifacts/${artifactId}`);
      expect(res.status).toBe(200);
    });

    it('should return 404 after deletion', async () => {
      const res = await request(app).get(`/api/artifacts/${artifactId}`);
      expect(res.status).toBe(404);
    });
  });
});
