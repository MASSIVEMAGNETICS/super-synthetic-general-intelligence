import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import CreatePage from './pages/CreatePage';
import WorkspacesPage from './pages/WorkspacesPage';
import WorkspaceDetailPage from './pages/WorkspaceDetailPage';
import AgentForgePage from './pages/AgentForgePage';
import AgentEditorPage from './pages/AgentEditorPage';
import DeploymentPage from './pages/DeploymentPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="create" element={<CreatePage />} />
          <Route path="workspaces" element={<WorkspacesPage />} />
          <Route path="workspaces/:id" element={<WorkspaceDetailPage />} />
          <Route path="forge" element={<AgentForgePage />} />
          <Route path="forge/:id" element={<AgentEditorPage />} />
          <Route path="deploy" element={<DeploymentPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
