import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { type ReactElement } from 'react';
import { isMobile } from 'react-device-detect';
import { LandingPage } from './components/LandingPage';
import { PlayerApp } from './components/PlayerApp';
import { AdminDashboard } from './components/AdminDashboard';
import { Login } from './components/Login';
import { ErrorBoundary } from './components/ErrorBoundary';

const ProtectedRoute = ({ children }: { children: ReactElement }) => {
  const token = localStorage.getItem('adminToken');
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={isMobile ? <Navigate to="/app" replace /> : <LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/app" element={
          <ErrorBoundary>
            <PlayerApp />
          </ErrorBoundary>
        } />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <AdminDashboard />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
