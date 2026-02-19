import React, { useCallback, useMemo, useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { FaUserDoctor, FaStethoscope, FaNotesMedical } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import Button from "../../../components/Button";
import Input from "../../../components/Input";
import authService from "../../../services/authService";
import { useDispatch } from "react-redux";
import { setUser } from "../../../redux/user/userSlice";
import { toast } from "sonner";
import LandingNavbar from "../../../components/common/LandingNavbar";

interface FormData {
  email: string;
  password: string;
}

type Errors = Partial<Record<keyof FormData, string>>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
      {/* String */}
      <div
        className="w-[1.5px] bg-gradient-to-b from-gray-300 via-gray-400 to-gray-500"
        style={{ height: `${stringLength}px` }}
      />
      {/* Icon — no box, just the natural icon shape */}
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

/* ─── Keyframe Styles (injected once) ─── */
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

const DoctorLogin: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState<boolean>(false);

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
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const validation = validate(formData);
      setErrors(validation);
      if (Object.keys(validation).length > 0) return;

      try {
        setSubmitting(true);

        const response = await authService.doctorLogin({
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          role: "doctor"
        });

        if (response.success && response.data) {
          const { user } = response.data;

          if (user) {
            dispatch(setUser({
              _id: user.id || user._id,
              name: user.name,
              email: user.email,
              role: user.role,
              profileImage: user.profileImage,
              customId: user.customId,
              phone: user.phone,
            }));
          }

          toast.success("Login successful!");
          navigate("/doctor/dashboard");
        } else {
          toast.error(response.message || "Login failed. Please try again.");
        }
      } catch (e: unknown) {
        const error = e as { message?: string };
        console.error("Login error:", error);
        toast.error(error.message || "Login failed. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
    [formData, validate, navigate, dispatch]
  );

  const handleGoogleSignIn = useCallback(() => {
    try {
      authService.doctorGoogleLogin();
    } catch (error) {
      console.error("Google sign-in error:", error);
      toast.error("Failed to initiate Google sign-in.");
    }
  }, []);

  const handleForgotPassword = useCallback(() => {
    navigate("/doctor/forgot-password");
  }, [navigate]);

  return (
    <>
      <style>{animationStyles}</style>
      <div className="min-h-screen bg-white flex flex-col">
        <LandingNavbar showActions={false} />

        <div className="flex-1 flex pt-4 lg:pt-8 min-h-[calc(100vh-80px)]">
          {/* ─── LEFT PANEL: Hanging Icons ─── */}
          <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-white via-gray-50/50 to-teal-50/30 border-r border-gray-100 flex-col justify-between py-12">
            {/* Subtle background decorative elements */}
            <div
              className="absolute top-[30%] right-[10%] w-64 h-64 rounded-full bg-teal-100/20 blur-3xl -z-10"
              style={{ animation: "floatBg 8s ease-in-out infinite" }}
            />
            <div
              className="absolute bottom-[20%] left-[15%] w-48 h-48 rounded-full bg-cyan-100/20 blur-3xl -z-10"
              style={{ animation: "floatBg 6s ease-in-out 2s infinite" }}
            />

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

            {/* Welcome text moved up */}
            <div
              className="flex flex-col items-center gap-2 px-8 mt-auto text-center"
              style={{ animation: "fadeInUp 0.8s ease-out 0.3s both" }}
            >
              <WaveEmoji />
              <h2 className="text-2xl font-bold text-[#00A1B0] tracking-tight">
                Welcome Back, Doctor
              </h2>
              <p className="text-gray-500 text-xs max-w-xs leading-relaxed">
                Manage your appointments, consult patients, and access medical records — all in one place.
              </p>

              {/* Decorative card */}
              <div
                className="mt-4 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-teal-100/50 p-5 max-w-[240px] w-full border border-gray-100/80"
                style={{ animation: "fadeInUp 0.8s ease-out 0.8s both" }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
                    <FaUserDoctor size={16} color="white" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-gray-700">Doctor Dashboard</p>
                    <p className="text-[9px] text-gray-400">Patients & appointments</p>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <div className="flex-1 h-1 rounded-full bg-teal-400/60" />
                  <div className="flex-1 h-1 rounded-full bg-teal-300/40" />
                  <div className="flex-1 h-1 rounded-full bg-teal-200/30" />
                </div>
              </div>
            </div>
          </div>

          {/* ─── RIGHT PANEL: Login Form ─── */}
          <div
            className="w-full lg:w-1/2 flex items-center justify-center px-4 py-8"
            style={{ animation: "slideInRight 0.6s ease-out 0.2s both" }}
          >
            <div className="w-full max-w-md">
              <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-8 lg:p-10 border border-gray-100">
                <div className="flex items-start justify-between mb-8">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-800">Doctor Login</h1>
                    <p className="text-sm text-gray-400 mt-1">Sign in to your account</p>
                  </div>
                  <button
                    onClick={() => navigate("/patient/login")}
                    className="text-[#00A1B0] hover:text-teal-600 font-medium text-sm whitespace-nowrap ml-4 bg-teal-50 px-3 py-1.5 rounded-full transition-colors hover:bg-teal-100"
                  >
                    Are you a Patient?
                  </button>
                </div>

                <form onSubmit={handleSubmit} noValidate className="space-y-5" aria-describedby="formErrors">
                  {Object.keys(errors).length > 0 && (
                    <div id="formErrors" className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">
                      Please fix the highlighted fields.
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
                        className="text-sm text-[#00A1B0] hover:text-teal-600 font-medium hover:underline"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <Input
                      label=""
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleChange}
                      error={errors.password}
                      placeholder="Enter your password"
                      disabled={submitting}
                      className="pr-10"
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
                  </div>

                  <Button
                    type="submit"
                    loading={submitting}
                    disabled={!isValid || submitting}
                    className="w-full py-3 mt-6"
                  >
                    {submitting ? "Logging in..." : "Login"}
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
                    <span className="text-gray-500">Don't have an account? </span>
                    <button
                      type="button"
                      onClick={() => navigate("/doctor/register")}
                      className="text-[#00A1B0] hover:text-teal-600 font-semibold hover:underline"
                    >
                      Register
                    </button>
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

export default DoctorLogin;
