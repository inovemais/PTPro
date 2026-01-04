import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { RoleGuard } from './guards/RoleGuard';
import SocketNotifications from './components/SocketNotifications';
import Header from './components/Header';

// Pages
import Login from './pages/Login';
import LoginQR from './pages/LoginQR';
import RegisterPage from './components/RegisterPage';
import AdminUsers from './pages/AdminUsers';
import TrainerClients from './pages/TrainerClients';
import TrainerClientDetail from './pages/TrainerClientDetail';
import TrainerPlans from './pages/TrainerPlans';
import TrainerPlanDetail from './pages/TrainerPlanDetail';
import ClientCalendar from './pages/ClientCalendar';
import ClientDashboard from './pages/ClientDashboard';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import Dashboard from './components/Dashboard';

// Import scopes
import scopes from './data/users/scopes';

// Layout component
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const hideHeader = location.pathname === '/login' || location.pathname === '/login-qr' || location.pathname === '/register';

  return (
    <div>
      {!hideHeader && <Header />}
      <main>{children}</main>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <SocketNotifications />
          <ToastContainer position="top-right" autoClose={3000} />
          <Layout>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/login-qr" element={<LoginQR />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Admin routes */}
              <Route
                path="/admin/trainers"
                element={<Navigate to="/admin/users" replace />}
              />
              <Route
                path="/admin/users"
                element={
                  <RoleGuard allowedRoles={[scopes.Admin]}>
                    <AdminUsers />
                  </RoleGuard>
                }
              />

              {/* Trainer routes */}
              <Route
                path="/trainer/clients"
                element={
                  <RoleGuard allowedRoles={[scopes.Admin, scopes.PersonalTrainer]}>
                    <TrainerClients />
                  </RoleGuard>
                }
              />
              <Route
                path="/trainer/clients/:id"
                element={
                  <RoleGuard allowedRoles={[scopes.Admin, scopes.PersonalTrainer]}>
                    <TrainerClientDetail />
                  </RoleGuard>
                }
              />
              <Route
                path="/trainer/plans"
                element={
                  <RoleGuard allowedRoles={[scopes.Admin, scopes.PersonalTrainer]}>
                    <TrainerPlans />
                  </RoleGuard>
                }
              />
              <Route
                path="/trainer/plans/new"
                element={
                  <RoleGuard allowedRoles={[scopes.Admin, scopes.PersonalTrainer]}>
                    <TrainerPlanDetail />
                  </RoleGuard>
                }
              />
              <Route
                path="/trainer/plans/:planId"
                element={
                  <RoleGuard allowedRoles={[scopes.Admin, scopes.PersonalTrainer]}>
                    <TrainerPlanDetail />
                  </RoleGuard>
                }
              />

              {/* Client routes */}
              <Route
                path="/client/calendar"
                element={
                  <RoleGuard allowedRoles={[scopes.Client]}>
                    <ClientCalendar />
                  </RoleGuard>
                }
              />
              <Route
                path="/client/dashboard"
                element={
                  <RoleGuard allowedRoles={[scopes.Client]}>
                    <ClientDashboard />
                  </RoleGuard>
                }
              />

              {/* Chat - available to all authenticated users */}
              <Route
                path="/chat"
                element={
                  <RoleGuard allowedRoles={[scopes.Admin, scopes.PersonalTrainer, scopes.Client]}>
                    <Chat />
                  </RoleGuard>
                }
              />

              {/* Profile - available to all authenticated users */}
              <Route
                path="/profile"
                element={
                  <RoleGuard allowedRoles={[scopes.Admin, scopes.PersonalTrainer, scopes.Client]}>
                    <Profile />
                  </RoleGuard>
                }
              />

              {/* Dashboard route - redirects based on user role */}
              <Route
                path="/dashboard"
                element={
                  <RoleGuard allowedRoles={[scopes.Admin, scopes.PersonalTrainer, scopes.Client]}>
                    <Dashboard />
                  </RoleGuard>
                }
              />

              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/login" replace />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

