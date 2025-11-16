import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/layout/Layout";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import Dashboard from "./components/dashboard/Dashboard";
import MedicationList from "./components/medications/MedicationList";
import SymptomList from "./components/symptoms/SymptomList";
import GoalList from "./components/goals/GoalList";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/medications"
              element={
                <ProtectedRoute>
                  <Layout>
                    <MedicationList />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/symptoms"
              element={
                <ProtectedRoute>
                  <Layout>
                    <SymptomList />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/goals"
              element={
                <ProtectedRoute>
                  <Layout>
                    <GoalList />
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
