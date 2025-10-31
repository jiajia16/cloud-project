import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext.jsx";

import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Home from "./pages/Home.jsx";
import MyTrails from "./pages/MyTrails.jsx";
import TrailDetail from "./pages/TrailDetail.jsx";
import Scan from "./pages/Scan.jsx";
import Leaderboard from "./pages/Leaderboard.jsx";
import Rewards from "./pages/Rewards.jsx";
import Social from "./pages/Social.jsx";

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function PublicOnlyRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/home" replace /> : children;
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        }
      />
      <Route path="/signup" element={<Signup />} />

      <Route path="/" element={<Navigate to="/home" replace />} />

      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mytrails"
        element={
          <ProtectedRoute>
            <MyTrails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mytrails/:trailId"
        element={
          <ProtectedRoute>
            <TrailDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/scan"
        element={
          <ProtectedRoute>
            <Scan />
          </ProtectedRoute>
        }
      />
      <Route
        path="/leaderboard"
        element={
          <ProtectedRoute>
            <Leaderboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/rewards"
        element={
          <ProtectedRoute>
            <Rewards />
          </ProtectedRoute>
        }
      />
      <Route
        path="/social"
        element={
          <ProtectedRoute>
            <Social />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}
