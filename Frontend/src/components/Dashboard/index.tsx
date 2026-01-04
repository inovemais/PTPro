import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import scopes from "../../data/users/scopes";

const Dashboard = () => {
  const { scopes: userScopes, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  // Ensure userScopes is an array
  const scopesArray = Array.isArray(userScopes) ? userScopes : [];

  // Redirect based on user role/scope - check in priority order
  if (scopesArray.includes(scopes.Admin)) {
    return <Navigate to="/admin/users" replace />;
  }
  
  if (scopesArray.includes(scopes.PersonalTrainer)) {
    return <Navigate to="/trainer/clients" replace />;
  }
  
  if (scopesArray.includes(scopes.Client)) {
    return <Navigate to="/client/dashboard" replace />;
  }

  // Fallback to login if no valid scope
  return <Navigate to="/login" replace />;
};

export default Dashboard;

