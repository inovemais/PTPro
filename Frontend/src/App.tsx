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
import AdminTrainers from './pages/AdminTrainers';
import AdminRequests from './pages/AdminRequests';
import TrainerClients from './pages/TrainerClients';
import TrainerClientDetail from './pages/TrainerClientDetail';
import TrainerPlans from './pages/TrainerPlans';
import ClientCalendar from './pages/ClientCalendar';
import ClientCompliance from './pages/ClientCompliance';
import ClientDashboard from './pages/ClientDashboard';
import Chat from './pages/Chat';

// Import scopes
import scopes from './data/users/scopes';

// Layout component
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const hideHeader = location.pathname === '/login' || location.pathname === '/login-qr';

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
        <BrowserRouter>
          <SocketNotifications />
          <ToastContainer position="top-right" autoClose={3000} />
          <Layout>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/login-qr" element={<LoginQR />} />

              {/* Admin routes */}
              <Route
                path="/admin/trainers"
                element={
                  <RoleGuard allowedRoles={[scopes.Admin]}>
                    <AdminTrainers />
                  </RoleGuard>
                }
              />
              <Route
                path="/admin/requests"
                element={
                  <RoleGuard allowedRoles={[scopes.Admin]}>
                    <AdminRequests />
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
                path="/trainer/plans/:clientId"
                element={
                  <RoleGuard allowedRoles={[scopes.Admin, scopes.PersonalTrainer]}>
                    <TrainerPlans />
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
                path="/client/compliance"
                element={
                  <RoleGuard allowedRoles={[scopes.Client]}>
                    <ClientCompliance />
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

