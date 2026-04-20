/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import { authApi, AUTH_EXPIRED_EVENT, AUTH_STORAGE_KEY } from "../api/client";

const AuthContext = createContext(null);

const readStoredAuth = () => {
  try {
    const savedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
    return savedAuth ? JSON.parse(savedAuth) : null;
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
};

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(readStoredAuth);

  useEffect(() => {
    if (auth) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [auth]);

  useEffect(() => {
    const handleAuthExpired = () => {
      setAuth(null);
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);

    return () => {
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    };
  }, []);

  const login = async (values) => {
    const response = await authApi.login(values);
    setAuth(response);
    return response;
  };

  const register = async (values) => {
    const response = await authApi.register(values);
    setAuth(response);
    return response;
  };

  const logout = () => {
    setAuth(null);
  };

  return (
    <AuthContext.Provider
      value={{
        auth,
        user: auth?.user ?? null,
        token: auth?.token ?? null,
        isAuthenticated: Boolean(auth?.token),
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
