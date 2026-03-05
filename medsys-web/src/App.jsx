import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LandingPage from './pages/LandingPage'
import PersonnelLoginPage from './pages/PersonnelLoginPage'
import PatientPortalPage from './pages/PatientPortalPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import { PatientDashboard, PersonnelDashboard, AdminDashboard } from './pages/Dashboards'

function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/" replace />
  if (allowedRoles && !allowedRoles.includes(user?.role)) return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login/personnel" element={<PersonnelLoginPage />} />
      <Route path="/patient" element={<PatientPortalPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route path="/patient/dashboard" element={
        <ProtectedRoute allowedRoles={['PATIENT']}>
          <PatientDashboard />
        </ProtectedRoute>
      } />
      <Route path="/personnel/dashboard" element={
        <ProtectedRoute allowedRoles={['MEDECIN', 'PERSONNEL']}>
          <PersonnelDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['ADMIN']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
