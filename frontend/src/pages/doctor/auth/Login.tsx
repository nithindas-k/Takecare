import React, { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../../components/Button";
import Input from "../../../components/Input";
import authService from "../../../services/authService";

interface FormData {
  email: string;
  password: string;
}

type Errors = Partial<Record<keyof FormData, string>>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DoctorLogin: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string>("");

  const validate = useCallback((data: FormData): Errors => {
    const e: Errors = {};
    if (!data.email.trim()) {
      e.email = "Email is required.";
    } else if (!EMAIL_REGEX.test(data.email)) {
      e.email = "Enter a valid email.";
    }
    if (!data.password) {
      e.password = "Password is required.";
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

        // Call backend login API
        const response = await authService.doctorLogin({
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          role :"doctor"
        });

        if (response.success && response.data.token) {
          localStorage.setItem("authToken", response.data.token);
          
          if (response.data) {
            localStorage.setItem("doctor", JSON.stringify(response.data));
          }

          navigate("/doctor/dashboard");
        } else {
          setServerError(response.message || "Login failed. Please try again.");
        }
      } catch (error: any) {
        console.error("Login error:", error);
        setServerError(error.message || "Login failed. Please try again.");
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

  const handleForgotPassword = useCallback(() => {
    navigate("/doctor/forgot-password");
  }, [navigate]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
        {/* Illustration */}
        <div className="flex justify-center lg:justify-end">
          <div className="relative w-full max-w-lg px-4">
            <img 
              src="/doctor.png" 
              alt="Doctors Illustration" 
              className="w-full h-auto object-contain" 
            />
          </div>
        </div>

        {/* Form */}
        <div className="w-full max-w-md mx-auto lg:mx-0">
          <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-10">
            <div className="flex items-start justify-between mb-8">
              <h1 className="text-3xl font-bold text-gray-800">Doctor Login</h1>
              <button
                onClick={() => navigate("/user/login")}
                className="text-teal-500 hover:text-teal-600 font-medium text-sm whitespace-nowrap ml-4 transition-colors"
              >
                Are you a patient?
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-5" aria-describedby="formErrors">
              {/* Form-level errors */}
              {Object.keys(errors).length > 0 && (
                <div id="formErrors" className="text-sm text-red-600 p-3 bg-red-50 rounded-lg border border-red-200">
                  Please fix the highlighted fields.
                </div>
              )}

              {/* Server error */}
              {serverError && (
                <div className="text-sm text-red-600 p-3 bg-red-50 rounded-lg border border-red-200">
                  {serverError}
                </div>
              )}

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

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-sm text-teal-500 hover:text-teal-600 font-medium hover:underline transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
                <Input
                  label=""
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  error={errors.password}
                  placeholder="Enter your password"
                  disabled={submitting}
                />
              </div>

              <Button 
                type="submit" 
                loading={submitting} 
                disabled={!isValid || submitting} 
                className="w-full py-3 mt-6"
              >
                {submitting ? "Logging in..." : "Login"}
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

              <Button
                variant="secondary"
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full py-3 flex items-center justify-center gap-3"
                disabled={submitting}
              >
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
                Sign in With Google
              </Button>

              <div className="text-center mt-6">
                <span className="text-gray-600">Don't have an account? </span>
                <button
                  type="button"
                  onClick={() => navigate("/doctor/register")}
                  className="text-teal-500 hover:text-teal-600 font-medium hover:underline transition-colors"
                >
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorLogin;
