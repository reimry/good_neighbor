import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { InternalAuthProvider } from './contexts/InternalAuthContext';
import LoginPage from './pages/LoginPage';
import ActivatePage from './pages/ActivatePage';
import RegisterOSBBPage from './pages/RegisterOSBBPage';
import NewsListPage from './pages/NewsListPage';
import VotingsListPage from './pages/VotingsListPage';
import DashboardPage from './pages/DashboardPage';
import AdminDashboard from './pages/AdminDashboard';
import CreateNewsPage from './pages/CreateNewsPage';
import CreateVotingPage from './pages/CreateVotingPage';
import EditVotingPage from './pages/EditVotingPage';
import AdminApartmentsPage from './pages/AdminApartmentsPage';
import AdminRegistrationsPage from './pages/AdminRegistrationsPage';
import ProfilePage from './pages/ProfilePage';
import ServicesPage from './pages/ServicesPage';
import PrivateRoute from './components/PrivateRoute';
import InternalPrivateRoute from './components/InternalPrivateRoute';
import InternalLayout from './components/InternalLayout';
import RoleGuard from './components/RoleGuard';
import InternalLoginPage from './pages/internal/InternalLoginPage';
import InternalDashboardPage from './pages/internal/InternalDashboardPage';
import DatabaseAdminPage from './pages/internal/DatabaseAdminPage';
import RegistrationsPage from './pages/internal/RegistrationsPage';
import AuditLogsPage from './pages/internal/AuditLogsPage';

function App() {
  return (
    <>
      <AuthProvider>
        <InternalAuthProvider>
          <Router>
            <Routes>
              {/* Main Application Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/activate" element={<ActivatePage />} />
              <Route path="/register-osbb" element={<RegisterOSBBPage />} />
              <Route 
                path="/dashboard" 
                element={
                  <PrivateRoute>
                    <DashboardPage />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/news" 
                element={
                  <PrivateRoute>
                    <NewsListPage />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/votings" 
                element={
                  <PrivateRoute>
                    <VotingsListPage />
                  </PrivateRoute>
                } 
              />
              {/* Admin Routes */}
              <Route 
                path="/admin" 
                element={
                  <PrivateRoute>
                    <RoleGuard requiredRole="admin">
                      <AdminDashboard />
                    </RoleGuard>
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/admin/news/create" 
                element={
                  <PrivateRoute>
                    <RoleGuard requiredRole="admin">
                      <CreateNewsPage />
                    </RoleGuard>
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/admin/votings/create" 
                element={
                  <PrivateRoute>
                    <RoleGuard requiredRole="admin">
                      <CreateVotingPage />
                    </RoleGuard>
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/admin/votings/edit/:id" 
                element={
                  <PrivateRoute>
                    <RoleGuard requiredRole="admin">
                      <EditVotingPage />
                    </RoleGuard>
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/admin/apartments" 
                element={
                  <PrivateRoute>
                    <RoleGuard requiredRole="admin">
                      <AdminApartmentsPage />
                    </RoleGuard>
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/admin/registrations" 
                element={
                  <PrivateRoute>
                    <RoleGuard requiredRole="admin">
                      <AdminRegistrationsPage />
                    </RoleGuard>
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <PrivateRoute>
                    <ProfilePage />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/services" 
                element={
                  <PrivateRoute>
                    <ServicesPage />
                  </PrivateRoute>
                } 
              />
              
              {/* Internal Management System Routes */}
              <Route path="/internal/login" element={<InternalLoginPage />} />
              <Route
                path="/internal/dashboard"
                element={
                  <InternalPrivateRoute>
                    <InternalLayout>
                      <InternalDashboardPage />
                    </InternalLayout>
                  </InternalPrivateRoute>
                }
              />
              <Route
                path="/internal/database"
                element={
                  <InternalPrivateRoute>
                    <InternalLayout>
                      <DatabaseAdminPage />
                    </InternalLayout>
                  </InternalPrivateRoute>
                }
              />
              <Route
                path="/internal/registrations"
                element={
                  <InternalPrivateRoute>
                    <InternalLayout>
                      <RegistrationsPage />
                    </InternalLayout>
                  </InternalPrivateRoute>
                }
              />
              <Route
                path="/internal/audit-logs"
                element={
                  <InternalPrivateRoute>
                    <InternalLayout>
                      <AuditLogsPage />
                    </InternalLayout>
                  </InternalPrivateRoute>
                }
              />
              <Route path="/internal" element={<Navigate to="/internal/dashboard" replace />} />
              
              {/* Default */}
              <Route path="/" element={<Navigate to="/dashboard" />} />
            </Routes>
          </Router>
        </InternalAuthProvider>
      </AuthProvider>
    </>
  );
}

export default App;
