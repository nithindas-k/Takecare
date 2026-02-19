import React, {
  useCallback,
  useMemo,
  useState,
  useRef,
  useEffect,
} from "react";
import { FaStethoscope, FaHeartPulse, FaCapsules } from "react-icons/fa6";
import Button from "../../../components/Button";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setUser } from "../../../redux/user/userSlice";
import authService from "../../../services/authService";
import LandingNavbar from "../../../components/common/LandingNavbar";

type Errors = {
  otp?: string;
};

const OTP_LENGTH = 6;
const RESEND_OTP_INTERVAL = 60;

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

const PatientOTPVerify: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const email = (location.state as { email?: string })?.email || "";
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [errors, setErrors] = useState<{ otp?: string }>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [timer, setTimer] = useState<number>(RESEND_OTP_INTERVAL);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!email) {
      navigate("/patient/register");
    }
  }, [email, navigate]);

  useEffect(() => {
    if (timer === 0 && timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
      return;
    }
    if (timer > 0 && timerRef.current === null) {
      timerRef.current = window.setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [timer]);

  useEffect(() => {
    setTimer(RESEND_OTP_INTERVAL);
  }, []);

  const validate = useCallback((otpArray: string[]): Errors => {
    const e: Errors = {};
    const otpString = otpArray.join("");
    if (otpString.length !== OTP_LENGTH) {
      e.otp = "Please enter complete OTP.";
    }
    return e;
  }, []);

  const isValid = useMemo(() => Object.keys(validate(otp)).length === 0, [otp, validate]);

  const handleChange = useCallback(
    (index: number, value: string) => {
      if (value && !/^\d$/.test(value)) return;
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      setErrors({});
      setServerError("");
      if (value && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [otp]
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    },
    [otp]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pastedData = e.clipboardData.getData("text/plain").slice(0, OTP_LENGTH);
      if (!/^\d+$/.test(pastedData)) return;
      const newOtp = [...otp];
      pastedData.split("").forEach((char, index) => {
        if (index < OTP_LENGTH) newOtp[index] = char;
      });
      setOtp(newOtp);
      setErrors({});
      const nextIndex = Math.min(pastedData.length, OTP_LENGTH - 1);
      inputRefs.current[nextIndex]?.focus();
    },
    [otp]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const validation = validate(otp);
      setErrors(validation);
      if (Object.keys(validation).length > 0) return;

      try {
        setSubmitting(true);
        setServerError("");
        setSuccessMessage("");

        const otpString = otp.join("");
        const response = await authService.userVerifyOtp({
          email,
          otp: otpString,
          role: "patient",
        });

        if (response.success && response.data) {
          setSuccessMessage("Registration successful! Redirecting...");
          authService.saveToken(response.data.token);
          authService.saveUser(response.data.user);
          dispatch(setUser({
            _id: response.data.user.id,
            name: response.data.user.name,
            email: response.data.user.email,
            role: response.data.user.role as 'patient' | 'doctor' | 'admin',
            phone: response.data.user.phone,
            profileImage: response.data.user.profileImage,
          }));
          setTimeout(() => navigate("/"), 1500);
        } else {
          setServerError(response.message || "Invalid OTP.");
        }
      } catch (e: unknown) {
        setServerError("Verification failed. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
    [email, otp, validate, navigate, dispatch]
  );

  const handleResend = useCallback(async () => {
    try {
      setSubmitting(true);
      setServerError("");
      const response = await authService.userResendOtp(email);
      if (response.success) {
        setSuccessMessage("New OTP sent!");
        setTimer(RESEND_OTP_INTERVAL);
        setOtp(Array(OTP_LENGTH).fill(""));
        inputRefs.current[0]?.focus();
      } else {
        setServerError(response.message || "Failed to resend.");
      }
    } catch {
      setServerError("Failed to resend OTP.");
    } finally {
      setSubmitting(false);
    }
  }, [email]);

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
                Verify Identity
              </h2>
              <p className="text-gray-500 text-sm max-w-xs leading-relaxed">
                We've sent a code to your email. Enter it here to securely access your account.
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
                  <h1 className="text-3xl font-bold text-gray-800">Verify OTP</h1>
                  <p className="text-sm text-gray-400 mt-1">Verification for {email}</p>
                </div>

                {(serverError || errors.otp) && (
                  <div className="text-sm text-red-600 mb-6 p-4 bg-red-50 rounded-xl border border-red-100">
                    {serverError || errors.otp}
                  </div>
                )}
                {successMessage && (
                  <div className="text-sm text-green-600 mb-6 p-4 bg-green-50 rounded-xl border border-green-100">
                    {successMessage}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="flex justify-center gap-2 sm:gap-3">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => { inputRefs.current[index] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={index === 0 ? handlePaste : undefined}
                        className={`w-12 h-12 sm:w-14 sm:h-14 text-center text-xl font-semibold border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00A1B0] transition-all ${digit ? "border-[#00A1B0] bg-teal-50" : "border-gray-200"
                          }`}
                        disabled={submitting}
                      />
                    ))}
                  </div>

                  <Button
                    type="submit"
                    loading={submitting}
                    disabled={!isValid || submitting}
                    className="w-full py-3"
                  >
                    Verify OTP
                  </Button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={timer > 0 || submitting}
                      className={`text-sm font-medium ${timer > 0 ? "text-gray-400" : "text-[#00A1B0] hover:text-teal-600"
                        }`}
                    >
                      {timer > 0 ? `Resend code in ${timer}s` : "Resend code"}
                    </button>
                  </div>
                </form>

                <div className="text-center mt-8 pt-6 border-t border-gray-50">
                  <button
                    onClick={() => navigate("/patient/register")}
                    className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
                  >
                    ← Back to Registration
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PatientOTPVerify;
