import React, { useCallback, useMemo, useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { FaUserDoctor, FaStethoscope, FaNotesMedical } from "react-icons/fa6";
import { useNavigate, Link } from "react-router-dom";
import Button from "../../../components/Button";
import Input from "../../../components/Input";
import authService from "../../../services/authService";
import LandingNavbar from "../../../components/common/LandingNavbar";

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

/* ─── Doctor Icon Config ─── */
const doctorIcons = [
  { icon: FaUserDoctor, color: "#00A1B0", size: 42, label: "Doctor" },
  { icon: FaStethoscope, color: "#00A1B0", size: 38, label: "Stethoscope" },
  { icon: FaNotesMedical, color: "#00A1B0", size: 42, label: "Medical Notes" },
];

const hangingConfig = [
  { stringLength: 70, delay: 0, left: "25%" },
  { stringLength: 100, delay: 0.5, left: "48%" },
  { stringLength: 55, delay: 1, left: "72%" },
];

/* ─── Hanging Icon Component ─── */
const HangingIcon: React.FC<{
  iconData: (typeof doctorIcons)[number];
  stringLength: number;
  delay: number;
  left: string;
}> = ({ iconData, stringLength, delay, left }) => {
  const IconComp = iconData.icon;
  return (
    <div
      className="absolute top-0 flex flex-col items-center"
      style={{
        left,
        animation: `swingIcon 3s ease-in-out ${delay}s infinite alternate`,
        transformOrigin: "top center",
      }}
    >
      <div
        className="w-[1.5px] bg-gradient-to-b from-gray-300 via-gray-400 to-gray-500"
        style={{ height: `${stringLength}px` }}
      />
      <div
        className="hover:scale-125 transition-transform duration-300 cursor-pointer"
        style={{
          animation: `iconBounce 2s ease-in-out ${delay + 0.5}s infinite alternate`,
        }}
        title={iconData.label}
      >
        <IconComp size={iconData.size} color={iconData.color} />
      </div>
    </div>
  );
};

/* ─── Wave Emoji ─── */
const WaveEmoji = () => (
  <span
    className="inline-block text-4xl"
    style={{ animation: "waveHand 2.5s ease-in-out infinite" }}
    role="img"
    aria-label="wave"
  >
    👋
  </span>
);

const animationStyles = `
  @keyframes swingIcon {
    0% { transform: rotate(-4deg); }
    50% { transform: rotate(2deg); }
    100% { transform: rotate(-4deg); }
  }
  @keyframes iconBounce {
    0% { transform: translateY(0); }
    100% { transform: translateY(4px); }
  }
  @keyframes waveHand {
    0%   { transform: rotate(0deg); }
    10%  { transform: rotate(14deg); }
    20%  { transform: rotate(-8deg); }
    30%  { transform: rotate(14deg); }
    40%  { transform: rotate(-4deg); }
    50%  { transform: rotate(10deg); }
    60%  { transform: rotate(0deg); }
    100% { transform: rotate(0deg); }
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(30px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideInRight {
    from { opacity: 0; transform: translateX(40px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes floatBg {
    0%   { transform: translateY(0) rotate(0deg); }
    50%  { transform: translateY(-20px) rotate(3deg); }
    100% { transform: translateY(0) rotate(0deg); }
  }
`;

const DoctorRegister: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  const validate = useCallback((data: FormData): Errors => {
    const e: Errors = {};
    if (!data.name.trim()) e.name = "Name is required.";
    else if (data.name.trim().length < 2) e.name = "Name must be at least 2 characters.";

    if (!data.email.trim()) e.email = "Email is required.";
    else if (!EMAIL_REGEX.test(data.email)) e.email = "Enter a valid email.";

    if (!data.phone.trim()) e.phone = "Phone number is required.";
    else if (!PHONE_REGEX.test(data.phone)) e.phone = "Enter a valid 10-digit phone number.";

    if (!data.password) e.password = "Password is required.";
    else if (data.password.length < 6) e.password = "Password must be at least 6 characters.";

    if (!data.confirmPassword) e.confirmPassword = "Please confirm password.";
    else if (data.confirmPassword !== data.password) e.confirmPassword = "Passwords do not match.";

    return e;
  }, []);

  const isValid = useMemo(() => {
    const validation = validate(formData);
    return Object.keys(validation).length === 0;
  }, [formData, validate]);

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
          setSuccessMessage("Registration successful! Redirecting to OTP...");
          setTimeout(() => {
            navigate("/doctor/otp-verify", {
              state: { email: formData.email.trim().toLowerCase() },
            });
          }, 1500);
        } else {
          setServerError(response.message || "Registration failed. Please try again.");
        }
      } catch (e: unknown) {
        const error = e as { message?: string };
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
      setServerError("Failed to initiate Google sign-in.");
    }
  }, []);

  return (
    <>
      <style>{animationStyles}</style>
      <div className="min-h-screen bg-white flex flex-col">
        <LandingNavbar showActions={false} />

        <div className="flex-1 flex pt-4 lg:pt-8 min-h-[calc(100vh-80px)]">
          {/* ─── LEFT PANEL ─── */}
          <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-white via-gray-50/50 to-teal-50/30 border-r border-gray-100 flex-col justify-between py-12">
            {/* Hanging Icons Container */}
            <div className="relative w-full h-[220px]">
              {doctorIcons.map((iconData, i) => (
                <HangingIcon
                  key={iconData.label}
                  iconData={iconData}
                  stringLength={hangingConfig[i].stringLength * 0.8}
                  delay={hangingConfig[i].delay}
                  left={hangingConfig[i].left}
                />
              ))}
            </div>

            {/* Background elements */}
            <div
              className="absolute top-[30%] right-[10%] w-64 h-64 rounded-full bg-teal-100/20 blur-3xl -z-10"
              style={{ animation: "floatBg 8s ease-in-out infinite" }}
            />
            <div
              className="absolute bottom-[20%] left-[15%] w-48 h-48 rounded-full bg-cyan-100/20 blur-3xl -z-10"
              style={{ animation: "floatBg 6s ease-in-out 2s infinite" }}
            />

            {/* Welcome text moved up */}
            <div
              className="flex flex-col items-center gap-2 px-8 mt-auto text-center"
              style={{ animation: "fadeInUp 0.8s ease-out 0.3s both" }}
            >
              <WaveEmoji />
              <h2 className="text-2xl font-bold text-[#00A1B0] tracking-tight">
                Join TakeCare Doctors
              </h2>
              <p className="text-gray-500 text-xs max-w-xs leading-relaxed">
                Connect with patients worldwide and manage your practice with our advanced healthcare platform.
              </p>

              {/* Practitioner Card: Centered position */}
              <div
                className="mt-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-teal-100/50 p-5 max-w-[240px] w-full border border-gray-100/80 text-left"
                style={{ animation: "fadeInUp 0.8s ease-out 0.8s both" }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-gray-700">Practitioner Board</p>
                    <p className="text-[9px] text-gray-400">Manage your schedule</p>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <div className="flex-1 h-1 rounded-full bg-[#00A1B0]/60" />
                  <div className="flex-1 h-1 rounded-full bg-[#00A1B0]/40" />
                  <div className="flex-1 h-1 rounded-full bg-[#00A1B0]/20" />
                </div>
              </div>
            </div>
          </div>

          {/* ─── RIGHT PANEL ─── */}
          <div
            className="w-full lg:w-1/2 flex items-center justify-center px-4 py-6 overflow-y-auto"
            style={{ animation: "slideInRight 0.6s ease-out 0.2s both" }}
          >
            <div className="w-full max-w-md my-auto">
              <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-6 lg:p-8 border border-gray-100">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-800 font-manrope">Register</h1>
                    <p className="text-xs text-gray-400 mt-0.5">Healthcare Professional</p>
                  </div>
                  <Link
                    to="/patient/register"
                    className="text-[#00A1B0] hover:text-teal-600 font-medium text-[11px] whitespace-nowrap ml-4 bg-teal-50 px-3 py-1.5 rounded-full transition-colors hover:bg-teal-100"
                  >
                    Are you a Patient?
                  </Link>
                </div>

                {serverError && (
                  <div className="text-xs text-red-600 mb-4 p-3 bg-red-50 rounded-xl border border-red-100">
                    {serverError}
                  </div>
                )}
                {successMessage && (
                  <div className="text-xs text-green-600 mb-4 p-3 bg-green-50 rounded-xl border border-green-100">
                    {successMessage}
                  </div>
                )}

                <form onSubmit={handleSubmit} noValidate className="space-y-3">
                  <Input
                    label="Full Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    error={errors.name}
                    placeholder="Dr. Sanjay Kumar"
                    disabled={submitting}
                    className="py-2.5 text-sm"
                  />

                  <Input
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    error={errors.email}
                    placeholder="doctor@health.com"
                    disabled={submitting}
                  />

                  <Input
                    label="Phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    error={errors.phone}
                    placeholder="10-digit number"
                    disabled={submitting}
                  />

                  <Input
                    label="Password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    error={errors.password}
                    placeholder="Min 6 characters"
                    disabled={submitting}
                    className="pr-12"
                    icon={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-gray-400 hover:text-[#00A1B0] transition-colors focus:outline-none"
                      >
                        {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                      </button>
                    }
                  />

                  <Input
                    label="Confirm Password"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    error={errors.confirmPassword}
                    placeholder="Re-enter password"
                    disabled={submitting}
                    className="pr-12"
                    icon={
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="text-gray-400 hover:text-[#00A1B0] transition-colors focus:outline-none"
                      >
                        {showConfirmPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                      </button>
                    }
                  />

                  <Button
                    type="submit"
                    loading={submitting}
                    disabled={!isValid || submitting}
                    className="w-full py-3 mt-4"
                  >
                    Create Professional Account
                  </Button>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white text-gray-400">or</span>
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
                      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      <span>Join with Google</span>
                    </div>
                  </Button>

                  <div className="text-center mt-6">
                    <span className="text-gray-500">Already have an account? </span>
                    <Link
                      to="/doctor/login"
                      className="text-[#00A1B0] hover:text-teal-600 font-semibold hover:underline"
                    >
                      Login
                    </Link>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DoctorRegister;
