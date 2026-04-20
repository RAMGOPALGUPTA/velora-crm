import { Navigate, Route, Routes } from "react-router-dom";
import AppErrorBoundary from "./AppErrorBoundary";
import ProtectedRoute from "./ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="app-shell">
      <Routes>
        <Route
          path="/"
          element={
            isAuthenticated
              ? <Navigate to="/dashboard" replace />
              : (
                <AppErrorBoundary>
                  <AuthPage />
                </AppErrorBoundary>
              )
          }
        />
        <Route
          path="/dashboard"
          element={
            <AppErrorBoundary>
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            </AppErrorBoundary>
          }
        />
        <Route
          path="*"
          element={<Navigate to={isAuthenticated ? "/dashboard" : "/"} replace />}
        />
      </Routes>
    </div>
  );
}

export default App;
