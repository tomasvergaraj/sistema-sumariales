import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/context/authStore';
import { NotificationProvider } from '@/context/NotificationContext';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ProcesosPage } from '@/pages/ProcesosPage';
import { NuevoProcesoPage } from '@/pages/NuevoProcesoPage';
import { ProcesoDetallePage } from '@/pages/ProcesoDetallePage';
import { ProcesoEditarPage } from '@/pages/ProcesoEditarPage';

function App() {
  const { initAuth, loading } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-200"></div>
      </div>
    );
  }

  return (
    <NotificationProvider>
      <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/procesos"
          element={
            <ProtectedRoute>
              <ProcesosPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/procesos/nuevo"
          element={
            <ProtectedRoute requiredRole="admin">
              <NuevoProcesoPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/procesos/:id"
          element={
            <ProtectedRoute>
              <ProcesoDetallePage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/procesos/:id/editar"
          element={
            <ProtectedRoute requiredRole="admin">
              <ProcesoEditarPage />
            </ProtectedRoute>
          }
        />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    </NotificationProvider>
  );
}

export default App;
