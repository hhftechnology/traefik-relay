import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@chakra-ui/react';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import ServerDetail from './pages/ServerDetail';
import Configuration from './pages/Configuration';
import RedisExplorer from './pages/RedisExplorer';
import NetworkView from './pages/NetworkView';

function App() {
  return (
    <Box minH="100vh" bg="gray.50">
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="servers/:serverName" element={<ServerDetail />} />
          <Route path="configuration" element={<Configuration />} />
          <Route path="redis" element={<RedisExplorer />} />
          <Route path="network" element={<NetworkView />} />
          {/* Redirect any unknown routes to the dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Box>
  );
}

export default App;