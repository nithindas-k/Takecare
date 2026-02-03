import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setUser } from "./redux/user/userSlice";
import Lenis from 'lenis';

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
import DoctorProfileSettings from "./pages/doctor/DoctorProfileSettings";
import DoctorAppointments from "./pages/doctor/DoctorAppointments";
import DoctorAppointmentDetails from "./pages/doctor/DoctorAppointmentDetails";
import DoctorAppointmentRequests from "./pages/doctor/DoctorAppointmentRequests";
import DoctorSchedule from "./pages/doctor/DoctorSchedule";
import DoctorReviews from "./pages/doctor/DoctorReviews";


// Patient Routes
import PatientLogin from "./pages/user/auth/Login";
import PatientRegister from "./pages/user/auth/Register";
import PatientOTPVerify from "./pages/user/auth/OTPVerify";
import PatientForgotPassword from "./pages/user/auth/ForgotPassword";
import PatientForgotPasswordOTP from "./pages/user/auth/ForgotPasswordOTP";
import PatientResetPassword from "./pages/user/auth/ResetPassword";
import Home from "./pages/user/Home";
import Doctors from "./pages/user/Doctors";
import DoctorProfile from "./pages/user/DoctorProfile";
import BookingPage from "./pages/user/BookingPage";
import PatientDetails from "./pages/user/PatientDetails";
import ConsultationType from "./pages/user/ConsultationType";
import PaymentPage from "./pages/user/PaymentPage";
import BookingSuccess from "./pages/user/BookingSuccess";
import PatientProfileSettings from "./pages/user/PatientProfileSettings";
import PatientChangePassword from "./pages/user/PatientChangePassword";
import Appointments from "./pages/user/Appointments";
import AppointmentDetails from "./pages/user/AppointmentDetails";
import About from "./pages/user/About";
import Contact from "./pages/user/Contact";
import PatientDashboard from "./pages/user/Dashboard";
import FavoriteDoctors from "./pages/user/FavoriteDoctors";

import DoctorChangePassword from "./pages/doctor/DoctorChangePassword";

// Admin Routes
import AdminLogin from "./pages/admin/auth/Login";
import Dashboard from "./pages/admin/Dashboard";
import DoctorRequestPage from "./pages/admin/DoctorRequestPage";
import DoctorRequestDetailPage from "./pages/admin/DoctorRequestDetailPage";
import DoctorsListPage from "./pages/admin/DoctorsListPage";
import DoctorDetailPage from "./pages/admin/DoctorDetailPage";
import PatientsListPage from "./pages/admin/PatientsListPage";
import PatientDetailPage from "./pages/admin/PatientDetailPage";
import AdminAppointmentsListPage from "./pages/admin/AppointmentsListPage";
import AdminAppointmentDetailsPage from "./pages/admin/AdminAppointmentDetailsPage";

import ContactMessages from "./pages/admin/ContactMessages";
import ReviewsPage from "./pages/admin/ReviewsPage";
import AuthCallback from "./pages/AuthCallback";


// Wallet and Earnings
import UserWallet from "./pages/user/Wallet";
import DoctorWallet from "./pages/doctor/Wallet";
import AdminEarnings from "./pages/admin/Earnings";
import Specialties from "./pages/admin/Specialties";

// Consultation Pages
import VideoCallPage from "./pages/consultation/VideoCallPage";
import ChatPage from "./pages/consultation/ChatPage";

// Landing Page
import LandingPage from "./pages/LandingPage";

const NotFound: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-100">
    <div className="text-center">
      <h1 className="text-6xl font-bold text-gray-800">404</h1>
      <p className="text-xl text-gray-600 mt-4">Page Not Found</p>
      <a
        href="/"
        className="mt-6 inline-block px-6 py-3 bg-[#00A1B0] text-white rounded-lg hover:bg-[#008f9c]"
      >
        Go Home
      </a>
    </div>
  </div>
);

import { Toaster } from "./components/ui/sonner";
import userService from "./services/userService";
import AppointmentReminder from "./components/common/AppointmentReminder";
import ScrollToTop from "./components/common/ScrollToTop";


const App: React.FC = () => {
  const dispatch = useDispatch()

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    })

    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    async function userFetch() {
      if (!localStorage.getItem("authToken")) return;
      try {
        const response = await userService.getProfile()
        if (response.success && response.data) {
          dispatch(setUser(response.data))
        }
      } catch (error) {
        console.error("Failed to fetch user profile", error);
      }
    }
    userFetch()

    return () => {
      lenis.destroy()
    }
  }, [dispatch])

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Toaster />

      <AppointmentReminder />
      <Routes>

        {/* Public Landing Page */}
        <Route path="/landing" element={
          <PublicRoute>
            <LandingPage />
          </PublicRoute>
        } />

        <Route path="/" element={<ProtectedRoute role="patient" >
          <Home />
        </ProtectedRoute>} />

        <Route path="/doctors" element={
          <ProtectedRoute role="patient">
            <Doctors />
          </ProtectedRoute>
        } />
        <Route path="/doctors/:id" element={
          <ProtectedRoute role="patient">
            <DoctorProfile />
          </ProtectedRoute>
        } />
        <Route path="/doctor-profile" element={
          <ProtectedRoute role="patient">
            <DoctorProfile />
          </ProtectedRoute>
        } />
        <Route path="/booking/:id" element={
          <ProtectedRoute role="patient">
            <BookingPage />
          </ProtectedRoute>
        } />
        <Route path="/patient-details" element={
          <ProtectedRoute role="patient">
            <PatientDetails />
          </ProtectedRoute>
        } />
        <Route path="/consultation-type" element={
          <ProtectedRoute role="patient">
            <ConsultationType />
          </ProtectedRoute>
        } />
        <Route path="/payment" element={
          <ProtectedRoute role="patient">
            <PaymentPage />
          </ProtectedRoute>
        } />
        <Route path="/booking-success" element={
          <ProtectedRoute role="patient">
            <BookingSuccess />
          </ProtectedRoute>
        } />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />

        <Route path="/doctor">

          <Route
            path="login"
            element={
              <PublicRoute>
                <DoctorLogin />
              </PublicRoute>
            }
          />
          <Route
            path="register"
            element={
              <PublicRoute>
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
          <Route
            path="profile-settings"
            element={
              <ProtectedRoute role="doctor">
                <DoctorProfileSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="change-password"
            element={
              <ProtectedRoute role="doctor">
                <DoctorChangePassword />
              </ProtectedRoute>
            }
          />
          <Route
            path="appointments"
            element={
              <ProtectedRoute role="doctor">
                <DoctorAppointments />
              </ProtectedRoute>
            }
          />
          <Route
            path="appointment-requests"
            element={
              <ProtectedRoute role="doctor">
                <DoctorAppointmentRequests />
              </ProtectedRoute>
            }
          />
          <Route
            path="appointments/:id"
            element={
              <ProtectedRoute role="doctor">
                <DoctorAppointmentDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="schedule"
            element={
              <ProtectedRoute role="doctor">
                <DoctorSchedule />
              </ProtectedRoute>
            }
          />
          <Route
            path="wallet"
            element={
              <ProtectedRoute role="doctor">
                <DoctorWallet />
              </ProtectedRoute>
            }
          />
          <Route
            path="call/:id"
            element={
              <ProtectedRoute role="doctor">
                <VideoCallPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="chat/:id"
            element={
              <ProtectedRoute role="doctor">
                <ChatPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="reviews"
            element={
              <ProtectedRoute role="doctor">
                <DoctorReviews />
              </ProtectedRoute>
            }
          />

        </Route>


        <Route path="/patient">

          <Route
            path="login"
            element={
              <PublicRoute>
                <PatientLogin />
              </PublicRoute>
            }
          />
          <Route
            path="register"
            element={
              <PublicRoute>
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
          <Route
            path="dashboard"
            element={
              <ProtectedRoute role="patient">
                <PatientDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="profile-settings"
            element={
              <ProtectedRoute role="patient">
                <PatientProfileSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="change-password"
            element={
              <ProtectedRoute role="patient">
                <PatientChangePassword />
              </ProtectedRoute>
            }
          />
          <Route
            path="appointments"
            element={
              <ProtectedRoute role="patient">
                <Appointments />
              </ProtectedRoute>
            }
          />
          <Route
            path="appointments/:id"
            element={
              <ProtectedRoute role="patient">
                <AppointmentDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="wallet"
            element={
              <ProtectedRoute role="patient">
                <UserWallet />
              </ProtectedRoute>
            }
          />
          <Route
            path="call/:id"
            element={
              <ProtectedRoute role="patient">
                <VideoCallPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="chat/:id"
            element={
              <ProtectedRoute role="patient">
                <ChatPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="favorites"
            element={
              <ProtectedRoute role="patient">
                <FavoriteDoctors />
              </ProtectedRoute>
            }
          />

        </Route>

        <Route path="/admin">

          <Route
            path="login"
            element={
              <PublicRoute>
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

          <Route
            path="appointments"
            element={
              <ProtectedRoute role="admin">
                <AdminAppointmentsListPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="appointment/:appointmentId"
            element={
              <ProtectedRoute role="admin">
                <AdminAppointmentDetailsPage />
              </ProtectedRoute>
            }

          />

          <Route
            path="earnings"
            element={
              <ProtectedRoute role="admin">
                <AdminEarnings />
              </ProtectedRoute>
            }
          />

          <Route
            path="speciality"
            element={
              <ProtectedRoute role="admin">
                <Specialties />
              </ProtectedRoute>
            }
          />

          <Route
            path="messages"
            element={
              <ProtectedRoute role="admin">
                <ContactMessages />
              </ProtectedRoute>
            }
          />
          <Route
            path="reviews"
            element={
              <ProtectedRoute role="admin">
                <ReviewsPage />
              </ProtectedRoute>
            }
          />



        </Route>


        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;

