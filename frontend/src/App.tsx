// src/App.tsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "./routes/ProtectedRoute";
import PublicRoute from "./routes/PublicRoute";

// Doctor Routes
import DoctorRegister from "./pages/doctor/auth/Register";
import DoctorLogin from "./pages/doctor/auth/Login";
import OTPVerify from "./pages/doctor/auth/Otp-verify";
import DoctorVerification from "./pages/doctor/auth/Verification";
import ForgotPassword from "./pages/doctor/auth/ForgotPassword";
import ForgotPasswordOTP from "./pages/doctor/auth/ForgotPasswordOTP";
import ResetPassword from "./pages/doctor/auth/ResetPassword";
import DoctorDashboard from "./pages/doctor/Dashboard";

// Patient Routes
import PatientLogin from "./pages/user/auth/Login";
import PatientRegister from "./pages/user/auth/Register";
import PatientOTPVerify from "./pages/user/auth/OTPVerify";
import PatientForgotPassword from "./pages/user/auth/ForgotPassword";
import PatientForgotPasswordOTP from "./pages/user/auth/ForgotPasswordOTP";
import PatientResetPassword from "./pages/user/auth/ResetPassword";
import Home from "./pages/user/Home"; // patient home (protected)

// Admin Routes
import AdminLogin from "./pages/admin/auth/Login";
import Dashboard from "./pages/admin/Dashboard";
import DoctorRequestPage from "./pages/admin/DoctorRequestPage";
import DoctorRequestDetailPage from "./pages/admin/DoctorRequestDetailPage";
import DoctorsListPage from "./pages/admin/DoctorsListPage";
import DoctorDetailPage from "./pages/admin/DoctorDetailPage";
import PatientsListPage from "./pages/admin/PatientsListPage";
import PatientDetailPage from "./pages/admin/PatientDetailPage";

const NotFound: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-100">
    <div className="text-center">
      <h1 className="text-6xl font-bold text-gray-800">404</h1>
      <p className="text-xl text-gray-600 mt-4">Page Not Found</p>
      <a
        href="/"
        className="mt-6 inline-block px-6 py-3 bg-teal-500 text-white rounded-lg hover:bg-teal-600"
      >
        Go Home
      </a>
    </div>
  </div>
);

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
      
        <Route path="/" element={<ProtectedRoute role="patient" >
          <Home />
        </ProtectedRoute>} />

 
        <Route path="/doctor">

          <Route
            path="login"
            element={
              <PublicRoute role="doctor">
                <DoctorLogin />
              </PublicRoute>
            }
          />
          <Route
            path="register"
            element={
              <PublicRoute role="doctor">
                <DoctorRegister />
              </PublicRoute>
            }
          />

          <Route path="otp-verify" element={<OTPVerify />} />
          <Route path="verification" element={<DoctorVerification />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="forgot-password-otp" element={<ForgotPasswordOTP />} />
          <Route path="reset-password" element={<ResetPassword />} />

    
          <Route
            path="dashboard"
            element={
              <ProtectedRoute role="doctor">
                <DoctorDashboard />
              </ProtectedRoute>
            }
          />
        </Route>

      
        <Route path="/patient">

          <Route
            path="login"
            element={
              <PublicRoute role="patient">
                <PatientLogin />
              </PublicRoute>
            }
          />
          <Route
            path="register"
            element={
              <PublicRoute role="patient">
                <PatientRegister />
              </PublicRoute>
            }
          />


          <Route path="verify-otp" element={<PatientOTPVerify />} />
          <Route path="forgot-password" element={<PatientForgotPassword />} />
          <Route
            path="forgot-password-otp"
            element={<PatientForgotPasswordOTP />}
          />
          <Route path="reset-password" element={<PatientResetPassword />} />

      
          <Route
            path="home"
            element={
              <ProtectedRoute role="patient">
                <Home />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="/admin">

          <Route
            path="login"
            element={
              <PublicRoute role="admin">
                <AdminLogin />
              </PublicRoute>
            }
          />

          <Route
            path="dashboard"
            element={
              <ProtectedRoute role="admin">
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="doctor-request"
            element={
              <ProtectedRoute role="admin">
                <DoctorRequestPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="doctor-requests/:doctorId"
            element={
              <ProtectedRoute role="admin">
                <DoctorRequestDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="doctors"
            element={
              <ProtectedRoute role="admin">
                <DoctorsListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="doctors/:doctorId"
            element={
              <ProtectedRoute role="admin">
                <DoctorDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="patients"
            element={
              <ProtectedRoute role="admin">
                <PatientsListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="patients/:patientId"
            element={
              <ProtectedRoute role="admin">
                <PatientDetailPage />
              </ProtectedRoute>
            }
          />
        </Route>


        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
