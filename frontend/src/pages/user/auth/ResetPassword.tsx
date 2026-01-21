import React, { useCallback, useMemo, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Button from "../../../components/Button";
import Input from "../../../components/Input";
import authService from "../../../services/authService";
import LandingNavbar from "../../../components/common/LandingNavbar";

interface FormData {
  newPassword: string;
  confirmPassword: string;
}

type Errors = Partial<Record<keyof FormData, string>>;

const PatientResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as { email?: string })?.email || "";
  const resetToken = (location.state as { resetToken?: string })?.resetToken || "";

  const [formData, setFormData] = useState<FormData>({
    newPassword: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const validate = useCallback((data: FormData): Errors => {
    const e: Errors = {};
    if (!data.newPassword) e.newPassword = "New password is required.";
    else if (data.newPassword.length < 6) e.newPassword = "Password must be at least 6 characters.";
    if (!data.confirmPassword) e.confirmPassword = "Please confirm password.";
    else if (data.confirmPassword !== data.newPassword) e.confirmPassword = "Passwords do not match.";
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
        const response = await authService.resetPassword({
          email,
          resetToken,
          newPassword: formData.newPassword,
          confirmPassword: formData.confirmPassword,
        });

        if (response.success) {
          navigate("/patient/login");
        } else {
          setServerError(response.message || "Failed to reset password.");
        }
      } catch (e: unknown) {
        const err = e as { message?: string };
        setServerError(err.message || "An unexpected error occurred.");
      } finally {
        setSubmitting(false);
      }
    },
    [formData, validate, email, resetToken, navigate]
  );

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 pt-24">
      <LandingNavbar showActions={false} />
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        <div className="hidden lg:flex justify-center lg:justify-end">
          <img src="/interfaceUser.png" alt="Patient Illustration" className="w-full max-w-lg object-contain" />
        </div>

        <div className="w-full max-w-md mx-auto lg:mx-0">
          <div className="bg-white rounded-2xl shadow-xl p-10">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Reset Password</h1>
            <p className="text-gray-600 mb-8">Enter your new password</p>

            {serverError && <div className="mb-4 text-red-600 text-sm">{serverError}</div>}
            {Object.keys(errors).length > 0 && !serverError && (
              <div className="mb-4 text-red-600 text-sm">Please fix the highlighted fields.</div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <Input
                label="New Password"
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                error={errors.newPassword}
                placeholder="Enter new password"
              />
              <Input
                label="Confirm Password"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                placeholder="Confirm new password"
              />
              <Button type="submit" loading={submitting} disabled={!isValid || submitting} className="w-full py-3 mt-6">
                {submitting ? "Resetting..." : "Reset Password"}
              </Button>
            </form>

            <div className="text-center mt-6">
              <span className="text-gray-600">Remember your password? </span>
              <Link to="/patient/login" className="text-primary hover:text-primary/80 font-medium hover:underline">
                Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientResetPassword;
