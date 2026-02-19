import React, { useCallback, useMemo, useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { FaStethoscope, FaHeartPulse, FaCapsules } from "react-icons/fa6";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import Button from "../../../components/Button";
import Input from "../../../components/Input";
import authService from "../../../services/authService";
import LandingNavbar from "../../../components/common/LandingNavbar";

interface FormData {
  newPassword: string;
  confirmPassword: string;
}

type Errors = Partial<Record<keyof FormData, string>>;

/* ─── Medical Icon Config ─── */
const medicalIcons = [
  { icon: FaStethoscope, color: "#00A1B0", size: 42, label: "Stethoscope" },
  { icon: FaHeartPulse, color: "#00A1B0", size: 38, label: "Heart Monitor" },
  { icon: FaCapsules, color: "#00A1B0", size: 42, label: "Medicine" },
];

const hangingConfig = [
  { stringLength: 70, delay: 0, left: "25%" },
  { stringLength: 100, delay: 0.5, left: "48%" },
  { stringLength: 55, delay: 1, left: "72%" },
];

/* ─── Hanging Icon Component ─── */
const HangingIcon: React.FC<{
  iconData: (typeof medicalIcons)[number];
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

const PatientResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as { email?: string })?.email || "";
  const resetToken = (location.state as { resetToken?: string })?.resetToken || "";

  const [formData, setFormData] = useState<FormData>({
    newPassword: "",
    confirmPassword: "",
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = useCallback((data: FormData): Errors => {
    const e: Errors = {};
    if (!data.newPassword) e.newPassword = "New password is required.";
    else if (!/^(?=.*[A-Z])(?=.*\d).{6,}$/.test(data.newPassword)) {
      e.newPassword = "Password must be at least 6 characters and include one uppercase letter and one number";
    }
    if (!data.confirmPassword) e.confirmPassword = "Please confirm password.";
    else if (data.confirmPassword !== data.newPassword) e.confirmPassword = "Passwords do not match.";
    return e;
  }, []);

  const isValid = useMemo(() => Object.keys(validate(formData)).length === 0, [formData, validate]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => {
      const next = { ...prev };
      delete next[name as keyof FormData];
      return next;
    });
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const validation = validate(formData);
      setErrors(validation);
      if (Object.keys(validation).length > 0) return;

      try {
        setSubmitting(true);
        const response = await authService.resetPassword({
          email,
          resetToken,
          newPassword: formData.newPassword,
          confirmPassword: formData.confirmPassword,
        });

        if (response.success) {
          toast.success("Password reset successful!");
          navigate("/patient/login");
        } else {
          toast.error(response.message || "Failed to reset password.");
        }
      } catch (e: unknown) {
        const err = e as { message?: string };
        toast.error(err.message || "An unexpected error occurred.");
      } finally {
        setSubmitting(false);
      }
    },
    [formData, validate, email, resetToken, navigate]
  );

  return (
    <>
      <style>{animationStyles}</style>
      <div className="min-h-screen bg-white flex flex-col">
        <LandingNavbar showActions={false} />

        <div className="flex-1 flex pt-20">
          {/* ─── LEFT PANEL ─── */}
          <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-white via-gray-50/50 to-teal-50/30 border-r border-gray-100">
            <div
              className="absolute top-[40%] right-[10%] w-64 h-64 rounded-full bg-teal-100/20 blur-3xl"
              style={{ animation: "floatBg 8s ease-in-out infinite" }}
            />
            <div
              className="absolute bottom-[20%] left-[15%] w-48 h-48 rounded-full bg-cyan-100/20 blur-3xl"
              style={{ animation: "floatBg 6s ease-in-out 2s infinite" }}
            />

            <div className="relative w-full h-[340px]">
              {medicalIcons.map((iconData, i) => (
                <HangingIcon
                  key={iconData.label}
                  iconData={iconData}
                  stringLength={hangingConfig[i].stringLength}
                  delay={hangingConfig[i].delay}
                  left={hangingConfig[i].left}
                />
              ))}
            </div>

            <div
              className="absolute bottom-[22%] left-0 right-0 flex flex-col items-center gap-3 px-8 text-center"
              style={{ animation: "fadeInUp 0.8s ease-out 0.3s both" }}
            >
              <WaveEmoji />
              <h2 className="text-3xl font-bold text-[#00A1B0] tracking-tight">
                Secure Password
              </h2>
              <p className="text-gray-500 text-sm max-w-xs leading-relaxed">
                Choose a strong password to protect your personal health information and account security.
              </p>
            </div>
          </div>

          {/* ─── RIGHT PANEL ─── */}
          <div
            className="w-full lg:w-1/2 flex items-center justify-center px-4 py-8"
            style={{ animation: "slideInRight 0.6s ease-out 0.2s both" }}
          >
            <div className="w-full max-w-md">
              <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-8 lg:p-10 border border-gray-100">
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-800">Reset Password</h1>
                  <p className="text-sm text-gray-400 mt-1">Set your new password</p>
                </div>

                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                  <Input
                    label="New Password"
                    name="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={formData.newPassword}
                    onChange={handleChange}
                    error={errors.newPassword}
                    placeholder="Enter new password"
                    disabled={submitting}
                    className="pr-12"
                    icon={
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="text-gray-400 hover:text-[#00A1B0] transition-colors focus:outline-none"
                      >
                        {showNewPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
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
                    placeholder="Confirm new password"
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
                    className="w-full py-3 mt-6"
                  >
                    {submitting ? "Resetting..." : "Reset Password"}
                  </Button>
                </form>

                <div className="text-center mt-8 pt-6 border-t border-gray-50">
                  <span className="text-gray-500 text-sm">Remember your password? </span>
                  <Link
                    to="/patient/login"
                    className="text-[#00A1B0] hover:text-teal-600 font-semibold hover:underline border-none bg-transparent"
                  >
                    Login
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PatientResetPassword;
