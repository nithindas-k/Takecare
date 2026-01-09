

import React, { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../../components/Button";
import Input from "../../../components/Input";
import authService from "../../../services/authService";

interface FormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

type Errors = Partial<Record<keyof FormData, string>>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[6-9]\d{9}$/;

const DoctorRegister: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  const validate = useCallback((data: FormData): Errors => {
    const e: Errors = {};

    if (!data.name.trim()) {
      e.name = "Name is required.";
    } else if (data.name.trim().length < 2) {
      e.name = "Name must be at least 2 characters.";
    }

    if (!data.email.trim()) {
      e.email = "Email is required.";
    } else if (!EMAIL_REGEX.test(data.email)) {
      e.email = "Enter a valid email.";
    }

    if (!data.phone.trim()) {
      e.phone = "Phone number is required.";
    } else if (!PHONE_REGEX.test(data.phone)) {
      e.phone = "Enter a valid 10-digit phone number.";
    }

    if (!data.password) {
      e.password = "Password is required.";
    } else if (data.password.length < 6) {
      e.password = "Password must be at least 6 characters.";
    }

    if (!data.confirmPassword) {
      e.confirmPassword = "Please confirm password.";
    } else if (data.confirmPassword !== data.password) {
      e.confirmPassword = "Passwords do not match.";
    }

    return e;
  }, []);

  const formErrors = useMemo(() => validate(formData), [formData, validate]);
  const isValid = useMemo(() => Object.keys(formErrors).length === 0, [formErrors]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[name as keyof FormData];
      return next;
    });
    setServerError("");
    setSuccessMessage("");
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const validation = validate(formData);
      setErrors(validation);
      if (Object.keys(validation).length > 0) return;

      try {
        setSubmitting(true);
        setServerError("");
        setSuccessMessage("");

        const response = await authService.doctorRegister({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim(),
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          role: "doctor"
        });

        if (response.success && response.data) {
          setSuccessMessage("Registration successful! Please check your email for OTP.");

          setFormData({
            name: "",
            email: "",
            phone: "",
            password: "",
            confirmPassword: "",
          });
          setErrors({});

          setTimeout(() => {
            navigate("/doctor/otp-verify", {
              state: { email: formData.email.trim().toLowerCase() },
            });
          }, 1500);
        } else {
          setServerError(response.message || "Registration failed. Please try again.");
        }
      } catch (error: any) {
        console.error("Registration error:", error);
        setServerError(error.message || "Registration failed. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
    [formData, validate, navigate]
  );

  const handleGoogleSignIn = useCallback(() => {
    try {
      authService.doctorGoogleLogin();
    } catch (error) {
      console.error("Google sign-in error:", error);
      setServerError("Failed to initiate Google sign-in.");
    }
  }, []);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
        <div className="flex justify-center lg:justify-end">
          <div className="relative w-full max-w-lg px-4">
            <img
              src="/doctor.png"
              alt="Doctor Registration"
              className="w-full h-auto object-contain"
            />
          </div>
        </div>

        <div className="w-full max-w-md mx-auto lg:mx-0">
          <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-10">
            <div className="flex items-start justify-between mb-8">
              <h1 className="text-3xl font-bold text-gray-800">Doctor Register</h1>
              <button
                onClick={() => navigate("/patient/register")}
                className="text-teal-500 hover:text-teal-600 font-medium text-sm whitespace-nowrap ml-4 transition-colors"
              >
                Are you a patient?
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-5" aria-describedby="formErrors">
              {Object.keys(errors).length > 0 && (
                <div id="formErrors" className="text-sm text-red-600 p-3 bg-red-50 rounded-lg border border-red-200">
                  Please fix the highlighted fields.
                </div>
              )}

              {serverError && (
                <div className="text-sm text-red-600 p-3 bg-red-50 rounded-lg border border-red-200">
                  {serverError}
                </div>
              )}

              {successMessage && (
                <div className="text-sm text-green-600 p-3 bg-green-50 rounded-lg border border-green-200">
                  {successMessage}
                </div>
              )}

              {/* Name */}
              <Input
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={errors.name}
                placeholder="Enter your full name"
                disabled={submitting}
              />

              {/* Email */}
              <Input
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                placeholder="Enter your email"
                disabled={submitting}
              />

              {/* Phone */}
              <Input
                label="Phone Number"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                error={errors.phone}
                placeholder="Enter your phone number"
                disabled={submitting}
              />

              {/* Password */}
              <Input
                label="Create Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                placeholder="Create password (min 6 characters)"
                disabled={submitting}
              />

              {/* Confirm Password */}
              <Input
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                placeholder="Confirm your password"
                disabled={submitting}
              />

              {/* Submit Button */}
              <Button
                type="submit"
                loading={submitting}
                disabled={!isValid || submitting}
                className="w-full py-3 mt-6"
              >
                {submitting ? "Signing up..." : "Sign Up"}
              </Button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">or</span>
                </div>
              </div>

              {/* Google Sign In */}
              <Button
                variant="secondary"
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full py-3"
                disabled={submitting}
              >
                <div className="flex items-center justify-center gap-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
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

              {/* Login Link */}
              <div className="text-center mt-6">
                <span className="text-gray-600">Already have an account? </span>
                <button
                  type="button"
                  onClick={() => navigate("/doctor/login")}
                  className="text-teal-500 hover:text-teal-600 font-medium hover:underline transition-colors"
                >
                  Login
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorRegister;
