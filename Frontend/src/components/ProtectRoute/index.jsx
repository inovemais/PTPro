import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";

const ProtectedRoute = ({ children }) => {
  const { isValidLogin, isFetching, hasLogin } = useAuth();

  useEffect(() => {
    console.log("🔐 ProtectedRoute: Checking authentication...");
    hasLogin();
  }, [hasLogin])

  useEffect(() => {
    console.log("🔐 ProtectedRoute: Auth state changed - isValidLogin:", isValidLogin, "isFetching:", isFetching);
  }, [isValidLogin, isFetching]);

  if(isFetching) {
      console.log("🔐 ProtectedRoute: Still fetching auth status...");
      return <div>Loading</div>
  }

  if (!isValidLogin) {
    console.log("🔐 ProtectedRoute: User not authenticated, redirecting to login...");
    // user is not authenticated
    return <Navigate to="/" replace />;
  }

  console.log("🔐 ProtectedRoute: User authenticated, rendering protected content");
  return children;
};

export default ProtectedRoute;