import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext.jsx";

import Login from "./pages/Login.jsx";
import Home from "./pages/Home.jsx";
import MyTrails from "./pages/MyTrails.jsx";
import Scan from "./pages/Scan.jsx";
import Leaderboard from "./pages/Leaderboard.jsx";
import Rewards from "./pages/Rewards.jsx";
import Social from "./pages/Social.jsx";

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  console.log("Current user:", user);
  return user ? children : <Navigate to="/login" replace />;
}


export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Default route → go to login first */}
      <Route path="/" element={<Navigate to="/login" />} />

      {/* Protected Routes */}
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

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}
