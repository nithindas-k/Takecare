import React, { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import authService from "../../../services/authService";
import { setUser } from "../../../redux/user/userSlice";
import Input from "../../../components/Input";
import Button from "../../../components/Button";

interface FormData { email: string; password: string; }
type Errors = Partial<Record<keyof FormData, string>>;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState<FormData>({ email: "", password: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const validate = useCallback((data: FormData): Errors => {
    const e: Errors = {};
    if (!data.email.trim()) e.email = "Email is required.";
    else if (!EMAIL_REGEX.test(data.email)) e.email = "Enter a valid email.";
    if (!data.password) e.password = "Password is required.";
    return e;
  }, []);

  const formErrors = useMemo(() => validate(formData), [formData, validate]);
  const isValid = useMemo(() => Object.keys(formErrors).length === 0, [formErrors]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      const next = { ...prev }; delete next[name as keyof FormData]; return next;
    });
    setServerError("");
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validate(formData);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    try {
      setSubmitting(true);
      setServerError("");
      const response = await authService.adminLogin({ ...formData, role: "admin" });
      if (response.success && response.data?.token) {
       
        if (response.data?.user) {
          const user = response.data.user;
         
          dispatch(setUser({
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          }));
        }
        navigate("/admin/dashboard");
      } else {
        setServerError(response.message || "Login failed.");
      }
    } catch {
      setServerError("Login failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [formData, validate, navigate, dispatch]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
        {/* Illustration */}
        <div className="flex justify-center lg:justify-end">
          <div className="relative w-full max-w-sm px-4">
            <img src="/admin profile.png" alt="Admin Illustration" className="w-full h-auto object-contain" />
          </div>
        </div>
        {/* Form */}
        <div className="w-full max-w-md mx-auto lg:mx-0">
          <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-10">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-800">Admin Login</h1>
            </div>
            <form onSubmit={handleSubmit} noValidate className="space-y-5" aria-describedby="formErrors">
              {Object.keys(errors).length > 0 && (
                <div id="formErrors" className="text-sm text-red-600">Please fix the highlighted fields.</div>
              )}
              {serverError && (<div className="text-sm text-red-600">{serverError}</div>)}
              <Input
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                disabled={submitting}
              />
              <Input
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                disabled={submitting}
              />
              <Button type="submit" loading={submitting} disabled={!isValid || submitting} className="w-full py-3 mt-6">
                {submitting ? "Logging in..." : "Login"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
