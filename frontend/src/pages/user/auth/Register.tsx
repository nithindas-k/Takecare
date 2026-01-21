import React, { useState, useEffect } from "react";
import Button from "../../../components/Button";
import Input from "../../../components/Input";
import { Link, useNavigate } from "react-router-dom";
import authService from "../../../services/authService";
import type { RegisterRequest } from "../../../types";
import LandingNavbar from "../../../components/common/LandingNavbar";

// Extend RegisterRequest for form (same fields)


interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
}

interface TouchedFields {
  name: boolean;
  email: boolean;
  phone: boolean;
  password: boolean;
  confirmPassword: boolean;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9]{10}$/;

const PatientRegister: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<RegisterRequest>({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "patient"
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<TouchedFields>({
    name: false,
    email: false,
    phone: false,
    password: false,
    confirmPassword: false,
  });

  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    const newErrors: FormErrors = {};

    if (touched.name) {
      if (!formData.name.trim()) {
        newErrors.name = "Name is required";
      } else if (formData.name.trim().length < 2) {
        newErrors.name = "Name must be at least 2 characters";
      }
    }

    if (touched.email) {
      if (!formData.email.trim()) {
        newErrors.email = "Email is required";
      } else if (!EMAIL_REGEX.test(formData.email)) {
        newErrors.email = "Enter a valid email address";
      }
    }

    if (touched.phone) {
      if (!formData.phone.trim()) {
        newErrors.phone = "Phone number is required";
      } else if (!PHONE_REGEX.test(formData.phone)) {
        newErrors.phone = "Enter a valid 10-digit phone number";
      }
    }

    if (touched.password) {
      if (!formData.password) {
        newErrors.password = "Password is required";
      } else if (formData.password.length < 6) {
        newErrors.password = "Password must be at least 6 characters";
      }
    }

    if (touched.confirmPassword) {
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password";
      } else if (formData.confirmPassword !== formData.password) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    setErrors(newErrors);
  }, [formData, touched]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setServerError("");
    setSuccessMessage("");
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const validateAll = (): boolean => {
    setTouched({
      name: true,
      email: true,
      phone: true,
      password: true,
      confirmPassword: true,
    });

    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!EMAIL_REGEX.test(formData.email)) {
      newErrors.email = "Enter a valid email address";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!PHONE_REGEX.test(formData.phone)) {
      newErrors.phone = "Enter a valid 10-digit phone number";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateAll()) {
      return;
    }

    try {
      setSubmitting(true);
      setServerError("");
      setSuccessMessage("");

      const userEmail = formData.email;

      const response = await authService.userRegister(formData);

      if (response.success) {
        setSuccessMessage("Registration successful! Please check your email for OTP.");

        setFormData({
          name: "",
          email: "",
          phone: "",
          password: "",
          confirmPassword: "",
        });
        setTouched({
          name: false,
          email: false,
          phone: false,
          password: false,
          confirmPassword: false,
        });
        setErrors({});

        setTimeout(() => {
          navigate("/patient/verify-otp", {
            state: { email: userEmail },
          });
        }, 2000);
      } else {
        setServerError(response.message || "Registration failed");
      }
    } catch (e: unknown) {
      const err = e as { message?: string };
      console.error("Registration error:", err);
      setServerError(err.message || "An error occurred. Please try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = () => {
    authService.userGoogleLogin();
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 pt-24">
      <LandingNavbar showActions={false} />
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
        {/* Illustration */}
        <div className="hidden lg:flex justify-center lg:justify-end">
          <div className="relative w-full max-w-lg px-4">
            <img
              src="/interfaceUser.png"
              alt="Patient Illustration"
              className="w-full h-auto object-contain"
            />
          </div>
        </div>

        {/* Form */}
        <div className="w-full max-w-md mx-auto lg:mx-0">
          <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-10">
            <div className="flex items-start justify-between mb-8">
              <h1 className="text-3xl font-bold text-gray-800">Patient Register</h1>
              <Link
                to="/doctor/register"
                className="text-teal-500 hover:text-teal-600 font-medium text-sm whitespace-nowrap ml-4"
              >
                Are you a Doctor?
              </Link>
            </div>

            {/* Success Message */}
            {successMessage && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg">
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-sm font-medium">{successMessage}</p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {serverError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-sm font-medium">{serverError}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <Input
                label="Name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.name ? errors.name : undefined}
                placeholder="Enter your full name"
                disabled={submitting}
                autoComplete="name"
              />

              <Input
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.email ? errors.email : undefined}
                placeholder="Enter your email"
                disabled={submitting}
                autoComplete="email"
              />

              <Input
                label="Phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.phone ? errors.phone : undefined}
                placeholder="Enter 10-digit phone number"
                disabled={submitting}
                autoComplete="tel"
              />

              <Input
                label="Create Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.password ? errors.password : undefined}
                placeholder="Minimum 6 characters"
                disabled={submitting}
                autoComplete="new-password"
              />

              <Input
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.confirmPassword ? errors.confirmPassword : undefined}
                placeholder="Re-enter your password"
                disabled={submitting}
                autoComplete="new-password"
              />

              <Button
                type="submit"
                variant="primary"
                loading={submitting}
                disabled={submitting || Object.keys(errors).length > 0}
                className="w-full py-3 mt-6"
              >
                Sign Up
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">or</span>
                </div>
              </div>

              <Button
                variant="secondary"
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full py-3"
                disabled={submitting}
              >
                <div className="flex items-center justify-center gap-3">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span>Sign in With Google</span>
                </div>
              </Button>

              <div className="text-center mt-6">
                <span className="text-gray-600">Already have an account? </span>
                <Link
                  to="/patient/login"
                  className="text-teal-500 hover:text-teal-600 font-medium hover:underline"
                >
                  Login
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientRegister;
