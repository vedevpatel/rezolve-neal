// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import Sidebar from './components/common/layout/Sidebar';
import AgentBuilder from './features/agent-builder/pages/AgentBuilder';
import AgentBuilderLandingPage from './features/agent-builder/pages/AgentBuilderLandingPage';
import AgentCanvasPage from './features/agent-builder/pages/AgentCanvasPage';
import WorkflowsPage from './features/workflows/pages/WorkflowsPage';
import WorkflowEditor from './features/workflows/pages/WorkflowEditor'; 

// Main layout component
const AppLayout = () => (
  <div className="app-layout">
    <Sidebar />
    <main className="main-content">
      <Outlet /> {/* Child routes will render here */}
    </main>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<AgentBuilderLandingPage />} />
          <Route path="agent-builder" element={<AgentBuilderLandingPage />} />
          <Route path="agent-builder/create" element={<AgentBuilder />} />
          <Route path="agent-builder/canvas/template/:id" element={<AgentCanvasPage />} />
          <Route path="agent-builder/canvas/agent/:id" element={<AgentCanvasPage />} />
          <Route path="workflows" element={<WorkflowsPage />} />
          <Route path="workflows/editor/:id" element={<WorkflowEditor />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;