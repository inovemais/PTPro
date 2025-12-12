import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";

const ProtectedRoute = ({ children }) => {
  const { isValidLogin, isFetching, hasLogin } = useAuth();

  useEffect(() => {
    hasLogin();
  }, [hasLogin])

  if(isFetching) {
      return <div>Loading</div>
  }

  if (!isValidLogin) {
    // user is not authenticated
    return <Navigate to="/" />;
  }

  return children;
};

export default ProtectedRoute;