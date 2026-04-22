import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import BookPage from "./pages/BookPage";
import PatientPage from "./pages/PatientPage";
import DoctorPage from "./pages/DoctorPage";
import SecretaryPage from "./pages/SecretaryPage";

function ProtectedRoute({ children, roles }) {
  const { user, isLoggedIn } = useAuth();
  if (!isLoggedIn) return <Navigate to="/login" />;
  if (roles && !roles.includes(user?.role)) return <Navigate to="/login" />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/book" />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/book" element={<BookPage />} />
      <Route path="/patient" element={
        <ProtectedRoute roles={["Patient"]}><PatientPage /></ProtectedRoute>
      } />
      <Route path="/doctor" element={
        <ProtectedRoute roles={["Doctor"]}><DoctorPage /></ProtectedRoute>
      } />
      <Route path="/secretary" element={
        <ProtectedRoute roles={["Secretary"]}><SecretaryPage /></ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/book" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
