import request from 'supertest';
import app from '../src/index';

describe('Agents API', () => {
  let agentId: string;
  let workspaceId: string;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/workspaces')
      .send({ name: 'Agent Test Workspace', description: 'For agent tests' });
    workspaceId = res.body.workspace.id as string;
  });

  describe('POST /api/agents', () => {
    it('should create a new agent', async () => {
      const res = await request(app)
        .post('/api/agents')
        .send({
          name: 'Research Agent',
          workspaceId,
          description: 'An agent for research tasks',
          personality: 'Analytical, thorough, and precise',
        });

      expect(res.status).toBe(201);
      expect(res.body.agent).toBeDefined();
      expect(res.body.agent.name).toBe('Research Agent');
      expect(res.body.agent.workspaceId).toBe(workspaceId);
      expect(res.body.agent.status).toBe('draft');
      expect(res.body.agent.constitution).toBeDefined();
      expect(res.body.agent.constitution.length).toBeGreaterThan(0);
      expect(res.body.agent.alignmentScore).toBeDefined();
      agentId = res.body.agent.id as string;
    });

    it('should return 400 when name is missing', async () => {
      const res = await request(app)
        .post('/api/agents')
        .send({ workspaceId, description: 'No name' });

      expect(res.status).toBe(400);
    });

    it('should return 400 when workspaceId is missing', async () => {
      const res = await request(app)
        .post('/api/agents')
        .send({ name: 'Nameless Agent' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/agents', () => {
    it('should list all agents', async () => {
      const res = await request(app).get('/api/agents');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.agents)).toBe(true);
      expect(res.body.count).toBeDefined();
    });
  });

  describe('GET /api/agents/:id', () => {
    it('should get agent by id', async () => {
      const res = await request(app).get(`/api/agents/${agentId}`);
      expect(res.status).toBe(200);
      expect(res.body.agent.id).toBe(agentId);
    });

    it('should return 404 for non-existent agent', async () => {
      const res = await request(app).get('/api/agents/nonexistent-id');
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/agents/:id', () => {
    it('should update agent description', async () => {
      const res = await request(app)
        .put(`/api/agents/${agentId}`)
        .send({ description: 'Updated agent description' });

      expect(res.status).toBe(200);
      expect(res.body.agent.description).toBe('Updated agent description');
      expect(res.body.agent.version).toBeGreaterThan(1);
    });

    it('should block drastic trait change (>50 points)', async () => {
      // First get current traits
      const getRes = await request(app).get(`/api/agents/${agentId}`);
      const currentTraits = getRes.body.agent.traits as Record<string, number>;

      // Try to change a trait by more than 50 points
      const trait = Object.keys(currentTraits)[0];
      const currentValue = currentTraits[trait];
      const newValue = currentValue <= 50 ? currentValue + 60 : currentValue - 60;

      const res = await request(app)
        .put(`/api/agents/${agentId}`)
        .send({ traits: { ...currentTraits, [trait]: newValue } });

      expect(res.status).toBe(422);
      expect(res.body.violations).toBeDefined();
      expect(res.body.violations.length).toBeGreaterThan(0);
    });

    it('should return 404 for non-existent agent', async () => {
      const res = await request(app)
        .put('/api/agents/nonexistent-id')
        .send({ description: 'Ghost update' });

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/agents/:id/fork', () => {
    it('should fork an agent', async () => {
      const res = await request(app)
        .post(`/api/agents/${agentId}/fork`)
        .send({ changelog: 'Forked for specialized research' });

      expect(res.status).toBe(201);
      expect(res.body.agent).toBeDefined();
      expect(res.body.agent.parentId).toBe(agentId);
      expect(res.body.agent.name).toContain('Fork');
      expect(res.body.agent.status).toBe('draft');
    });

    it('should return 404 for non-existent agent fork', async () => {
      const res = await request(app)
        .post('/api/agents/nonexistent-id/fork')
        .send({ changelog: 'Ghost fork' });

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/agents/:id/deploy', () => {
    it('should deploy an agent', async () => {
      const res = await request(app)
        .post(`/api/agents/${agentId}/deploy`)
        .send({ target: 'production' });

      expect(res.status).toBe(200);
      expect(res.body.agent.status).toBe('deployed');
      expect(res.body.agent.deploymentTarget).toBe('production');
    });

    it('should return 400 when target is missing', async () => {
      const res = await request(app)
        .post(`/api/agents/${agentId}/deploy`)
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/agents/:id/versions', () => {
    it('should get version history', async () => {
      const res = await request(app).get(`/api/agents/${agentId}/versions`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.versions)).toBe(true);
      expect(res.body.versions.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/agents/constitution/check', () => {
    it('should check constitution for an agent', async () => {
      const agentRes = await request(app).get(`/api/agents/${agentId}`);
      const agent = agentRes.body.agent as object;

      const res = await request(app)
        .post('/api/agents/constitution/check')
        .send(agent);

      expect(res.status).toBe(200);
      expect(res.body.result).toBeDefined();
      expect(res.body.result.passed).toBeDefined();
    });

    it('should return 400 when agent data is missing', async () => {
      const res = await request(app)
        .post('/api/agents/constitution/check')
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/agents/:id', () => {
    it('should delete agent', async () => {
      const res = await request(app).delete(`/api/agents/${agentId}`);
      expect(res.status).toBe(200);
    });

    it('should return 404 after deletion', async () => {
      const res = await request(app).get(`/api/agents/${agentId}`);
      expect(res.status).toBe(404);
    });
  });
});
