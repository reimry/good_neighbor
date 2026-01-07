import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import ActivatePage from './pages/ActivatePage';
import RegisterOSBBPage from './pages/RegisterOSBBPage';
import NewsListPage from './pages/NewsListPage';
import VotingsListPage from './pages/VotingsListPage';
import DashboardPage from './pages/DashboardPage';
import AdminDashboard from './pages/AdminDashboard';
import CreateNewsPage from './pages/CreateNewsPage';
import CreateVotingPage from './pages/CreateVotingPage';
import AdminApartmentsPage from './pages/AdminApartmentsPage';
import AdminRegistrationsPage from './pages/AdminRegistrationsPage';
import ProfilePage from './pages/ProfilePage';
import ServicesPage from './pages/ServicesPage';
import PrivateRoute from './components/PrivateRoute';
import RoleGuard from './components/RoleGuard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
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
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
