import React, { useCallback, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../../components/Button";
import Input from "../../../components/Input";
import authService from "../../../services/authService";

interface FormData {
  email: string;
}
type Errors = Partial<Record<keyof FormData, string>>;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PatientForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({ email: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const validate = useCallback((data: FormData) => {
    const e: Errors = {};
    if (!data.email.trim()) e.email = "Email is required.";
    else if (!EMAIL_REGEX.test(data.email)) e.email = "Enter a valid email.";
    return e;
  }, []);

  const formErrors = useMemo(() => validate(formData), [formData, validate]);
  const isValid = useMemo(() => Object.keys(formErrors).length === 0, [formErrors]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => {
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
        const response = await authService.forgotPassword(formData.email, "user");
        if (response.success) {
          navigate("/patient/forgot-password-otp", { state: { email: formData.email } });
        } else {
          setServerError(response.message || "Failed to send OTP. Please try again.");
        }
      } catch (e: unknown) {
        const err = e as { message?: string };
        setServerError(err.message || "An unexpected error occurred.");
      } finally {
        setSubmitting(false);
      }
    },
    [formData, navigate, validate]
  );

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        <div className="flex justify-center lg:justify-end">
          <img src="/interfaceUser.png" alt="Patient Illustration" className="w-full max-w-lg object-contain" />
        </div>

        <div className="w-full max-w-md mx-auto lg:mx-0">
          <div className="bg-white rounded-2xl shadow-xl p-10">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Forgot Password</h1>
            <p className="text-gray-600 mb-8">Enter your email to receive OTP</p>

            {serverError && <div className="mb-4 text-red-600 text-sm">{serverError}</div>}
            {!serverError && Object.keys(errors).length > 0 && <div className="mb-4 text-red-600 text-sm">Please fix the highlighted fields.</div>}

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <Input
                label="Email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                placeholder="Enter your email"
              />
              <Button type="submit" loading={submitting} disabled={!isValid || submitting} className="w-full py-3 mt-6">
                {submitting ? "Sending..." : "Send OTP"}
              </Button>
            </form>

            <div className="text-center mt-6">
              <span className="text-gray-600">Remember your password? </span>
              <Link to="/patient/login" className="text-primary hover:text-primary/80 font-medium hover:underline">Login</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientForgotPassword;
