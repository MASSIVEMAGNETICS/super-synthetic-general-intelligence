# AetherForge

> **From raw intent to finished outputs and evolving digital workers.**

AetherForge is an execution-first AI platform that transforms natural language intent into production-ready files and deploys persistent, self-evolving autonomous agents — all from a single browser-based workspace.

## What It Does

- **Autonomous Creation** — Describe a goal in plain language; receive finished, downloadable documents, slide decks, reports, and code archives.
- **Project Workspaces** — All generated assets are organized in versioned project workspaces, not transient chat threads.
- **Agent Forge** — Create, edit, version, fork, and deploy a new class of persistent adaptive agents ("Aetherlings") with configurable personality, memory, tools, and constitutional guardrails.
- **Deployment Console** — Deploy agents to cloud, browser, desktop, or enterprise targets; monitor runtime state and logs with kill-switch controls.
- **Safety & Governance** — Constitutional AI rules, alignment scoring, mutation gating, and audit trails prevent unsafe agent evolution.

## Architecture

```
aetherforge/
├── backend/          Node.js + Express + TypeScript API
│   ├── src/
│   │   ├── routes/   REST endpoints (artifacts, agents, workspaces)
│   │   ├── services/ Orchestrator, ArtifactBuilder, AgentManager, SafetyService
│   │   └── models/   TypeScript interfaces
│   └── tests/        43 Jest + Supertest tests
└── frontend/         React 18 + TypeScript + Vite + Tailwind CSS
    └── src/
        ├── pages/    Dashboard, Create, Workspaces, AgentForge, Deploy
        ├── components/ Layout, shared UI components
        └── api/      Typed Axios client
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Install Dependencies

```bash
# Backend
cd backend && npm install

# Frontend
cd frontend && npm install
```

### Run in Development

```bash
# Terminal 1 — backend API (port 3001)
cd backend && npm run dev

# Terminal 2 — frontend dev server (port 3000, proxied to backend)
cd frontend && npm run dev
```

Open http://localhost:3000 in your browser.

### Run Tests

```bash
cd backend && npm test
```

### Build for Production

```bash
cd backend && npm run build
cd frontend && npm run build
```

## API Reference

### Workspaces

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/workspaces` | List all workspaces |
| POST | `/api/workspaces` | Create workspace |
| GET | `/api/workspaces/:id` | Get workspace |
| PUT | `/api/workspaces/:id` | Update workspace |
| DELETE | `/api/workspaces/:id` | Delete workspace |
| GET | `/api/workspaces/:id/artifacts` | List workspace artifacts |
| GET | `/api/workspaces/:id/agents` | List workspace agents |

### Artifacts

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/artifacts/generate` | Generate artifact from intent |
| GET | `/api/artifacts/:id` | Get artifact |
| PUT | `/api/artifacts/:id` | Update artifact |
| DELETE | `/api/artifacts/:id` | Delete artifact |
| GET | `/api/artifacts/:id/download` | Download artifact file |
| GET | `/api/artifacts/:id/versions` | Get version history |

### Agents

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/agents` | List all agents |
| POST | `/api/agents` | Create agent from prompt |
| GET | `/api/agents/:id` | Get agent |
| PUT | `/api/agents/:id` | Update agent (with safety check) |
| DELETE | `/api/agents/:id` | Delete agent |
| POST | `/api/agents/:id/fork` | Fork agent version |
| POST | `/api/agents/:id/deploy` | Deploy agent |
| GET | `/api/agents/:id/versions` | Get version history |
| POST | `/api/agents/constitution/check` | Validate constitution rules |

## MVP Feature Coverage

| Feature | Status |
|---------|--------|
| Text → finished document | ✅ |
| Text → finished slide deck | ✅ |
| Text → finished report with sources | ✅ |
| Basic code generation & export | ✅ |
| Project workspaces | ✅ |
| Agent creation from prompt | ✅ |
| Visual agent editor with trait sliders | ✅ |
| Agent version history | ✅ |
| Agent deployment (cloud/browser/desktop) | ✅ |
| Constitutional rules v1 | ✅ |
| Artifact downloads | ✅ |
| Safety mutation gating | ✅ |
| Alignment score tracking | ✅ |
| Fork/merge agents | ✅ |

## Security

- HTTP security headers via `helmet`
- Input validation via `express-validator` on all endpoints
- Constitutional safety checks block agent mutations that exceed allowed thresholds
- Sandboxed artifact generation (no external code execution)
- Alignment drift monitoring via score tracking
