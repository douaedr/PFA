import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import BookPage from "./pages/BookPage";
import PatientPage from "./pages/PatientPage";
import DoctorPage from "./pages/DoctorPage";

function ProtectedRoute({ children, roles }) {
    const { user, isLoggedIn } = useAuth();
    if (!isLoggedIn) return <Navigate to="/book" />;
    if (roles && !roles.includes(user?.role)) return <Navigate to="/book" />;
    return children;
}

function HomeRedirect() {
    const { user, isLoggedIn } = useAuth();
    if (isLoggedIn && user?.role === "Doctor") return <Navigate to="/doctor" />;
    return <BookPage />;
}

function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/book" />} />
            <Route path="/book" element={<HomeRedirect />} />
            <Route path="/patient" element={
                <ProtectedRoute roles={["Patient"]}><PatientPage /></ProtectedRoute>
            } />
            <Route path="/doctor" element={
                <ProtectedRoute roles={["Doctor"]}><DoctorPage /></ProtectedRoute>
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
