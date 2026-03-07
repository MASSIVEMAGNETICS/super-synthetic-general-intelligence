import request from 'supertest';
import app from '../src/index';

describe('Workspaces API', () => {
  let workspaceId: string;

  describe('POST /api/workspaces', () => {
    it('should create a new workspace', async () => {
      const res = await request(app)
        .post('/api/workspaces')
        .send({ name: 'Test Workspace', description: 'A test workspace' });

      expect(res.status).toBe(201);
      expect(res.body.workspace).toBeDefined();
      expect(res.body.workspace.name).toBe('Test Workspace');
      expect(res.body.workspace.description).toBe('A test workspace');
      expect(res.body.workspace.id).toBeDefined();
      expect(res.body.workspace.artifacts).toEqual([]);
      expect(res.body.workspace.agents).toEqual([]);
      workspaceId = res.body.workspace.id as string;
    });

    it('should return 400 when name is missing', async () => {
      const res = await request(app)
        .post('/api/workspaces')
        .send({ description: 'No name workspace' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/workspaces', () => {
    it('should return list of workspaces', async () => {
      const res = await request(app).get('/api/workspaces');
      expect(res.status).toBe(200);
      expect(res.body.workspaces).toBeDefined();
      expect(Array.isArray(res.body.workspaces)).toBe(true);
      expect(res.body.count).toBeDefined();
    });
  });

  describe('GET /api/workspaces/:id', () => {
    it('should return workspace by id', async () => {
      const res = await request(app).get(`/api/workspaces/${workspaceId}`);
      expect(res.status).toBe(200);
      expect(res.body.workspace.id).toBe(workspaceId);
    });

    it('should return 404 for non-existent workspace', async () => {
      const res = await request(app).get('/api/workspaces/nonexistent-id');
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/workspaces/:id', () => {
    it('should update workspace', async () => {
      const res = await request(app)
        .put(`/api/workspaces/${workspaceId}`)
        .send({ name: 'Updated Workspace', description: 'Updated description' });

      expect(res.status).toBe(200);
      expect(res.body.workspace.name).toBe('Updated Workspace');
    });

    it('should return 404 for non-existent workspace', async () => {
      const res = await request(app)
        .put('/api/workspaces/nonexistent-id')
        .send({ name: 'Ghost' });

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/workspaces/:id/artifacts', () => {
    it('should return empty artifacts list for new workspace', async () => {
      const res = await request(app).get(`/api/workspaces/${workspaceId}/artifacts`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.artifacts)).toBe(true);
    });
  });

  describe('GET /api/workspaces/:id/agents', () => {
    it('should return empty agents list for new workspace', async () => {
      const res = await request(app).get(`/api/workspaces/${workspaceId}/agents`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.agents)).toBe(true);
    });
  });

  describe('DELETE /api/workspaces/:id', () => {
    it('should delete workspace', async () => {
      const res = await request(app).delete(`/api/workspaces/${workspaceId}`);
      expect(res.status).toBe(200);
      expect(res.body.message).toBeDefined();
    });

    it('should return 404 after deletion', async () => {
      const res = await request(app).get(`/api/workspaces/${workspaceId}`);
      expect(res.status).toBe(404);
    });
  });
});
