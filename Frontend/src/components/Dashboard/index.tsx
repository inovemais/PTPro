import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { buildApiUrl } from "../../config/api";

const Dashboard = () => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers: HeadersInit = { Accept: "application/json" };
        
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(buildApiUrl("/api/auth/me"), {
          headers,
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          if (data.auth && data.decoded && data.decoded.role) {
            const scopes = Array.isArray(data.decoded.role.scope)
              ? data.decoded.role.scope
              : data.decoded.role.scope
              ? [data.decoded.role.scope]
              : [];
            
            // Determinar o role principal
            if (scopes.includes("admin")) {
              setUserRole("admin");
            } else if (scopes.includes("PersonalTrainer")) {
              setUserRole("trainer");
            } else if (scopes.includes("client")) {
              setUserRole("client");
            } else {
              setUserRole("user");
            }
          }
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, []);

  if (loading) {
    return <div>Carregando...</div>;
  }

  // Redirecionar baseado no role
  if (userRole === "admin") {
    return <Navigate to="/admin" replace />;
  } else if (userRole === "trainer") {
    return <Navigate to="/trainer" replace />;
  } else {
    return <Navigate to="/user" replace />;
  }
};

export default Dashboard;

