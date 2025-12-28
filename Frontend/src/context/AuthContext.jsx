import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { buildApiUrl } from "../config/api";

const AuthContext = createContext({
  isAuthenticated: false,
  loading: true,
  user: null,
  scopes: [],
  refreshAuth: () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [scopes, setScopes] = useState([]);

  const fetchMe = useCallback(() => {
    setLoading(true);
    const token = localStorage.getItem("token");
    const apiUrl = buildApiUrl("/api/auth/me");

    const headers = {
      Accept: "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    fetch(apiUrl, {
      headers,
      credentials: "include",
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await response.text();
          throw new Error(
            `Expected JSON but got ${contentType}. Response: ${text.substring(
              0,
              100
            )}`
          );
        }
        return response.json();
      })
      .then((data) => {
        if (data && data.auth && data.decoded) {
          setIsAuthenticated(true);
          const role = data.decoded.role || {};
          const scopesArr = Array.isArray(role.scope)
            ? role.scope
            : role.scope
            ? [role.scope]
            : [];
          setScopes(scopesArr);
          setUser({
            id: data.decoded.id,
            name: data.decoded.name,
            role,
          });
        } else {
          setIsAuthenticated(false);
          setUser(null);
          setScopes([]);
        }
      })
      .catch(() => {
        setIsAuthenticated(false);
        setUser(null);
        setScopes([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const logout = useCallback(async () => {
    try {
      const apiUrl = buildApiUrl("/api/auth/logout");
      await fetch(apiUrl, {
        method: "GET",
        credentials: "include",
      });
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      // Limpar localStorage e estado independentemente do resultado da chamada
      localStorage.removeItem("token");
      setIsAuthenticated(false);
      setUser(null);
      setScopes([]);
      // Redirecionar para a página inicial
      window.location.href = "/";
    }
  }, []);

  const value = {
    isAuthenticated,
    loading,
    user,
    scopes,
    refreshAuth: fetchMe,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => useContext(AuthContext);


