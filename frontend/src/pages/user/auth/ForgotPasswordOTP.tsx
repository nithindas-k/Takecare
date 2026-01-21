import React, { useCallback, useMemo, useState, useEffect, useRef } from "react";
import Button from "../../../components/Button";
import { useLocation, useNavigate } from "react-router-dom";
import authService from "../../../services/authService";
import LandingNavbar from "../../../components/common/LandingNavbar";

const OTP_LENGTH = 6;

const PatientForgotPasswordOTP: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as { email?: string })?.email || "";

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [errors, setErrors] = useState<{ otp?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [timeLeft, setTimeLeft] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);


  useEffect(() => {
    if (timeLeft === 0) return;
    const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timerId);
  }, [timeLeft]);

  const validate = useCallback((otpArray: string[]) => {
    const e: { otp?: string } = {};
    const otpString = otpArray.join("");
    if (otpString.length !== OTP_LENGTH) {
      e.otp = "Please enter complete OTP.";
    }
    return e;
  }, []);

  const formErrors = useMemo(() => validate(otp), [otp, validate]);
  const isValid = useMemo(() => Object.keys(formErrors).length === 0, [formErrors]);

  const handleChange = useCallback(
    (index: number, value: string) => {
      if (value && !/^\d$/.test(value)) return;

      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      setErrors({});

      if (value && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
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

      if (timeLeft === 0) {
        setErrors({ otp: "OTP has expired. Please resend." });
        return;
      }

      try {
        setSubmitting(true);
        setServerError("");
        const otpString = otp.join("");
        const response = await authService.verifyForgotOtp(email, otpString, "user");
        if (response.success) {
          // On success, navigate to reset password page and pass reset token
          navigate("/patient/reset-password", { state: { email, resetToken: response.data.resetToken } });
        } else {
          setServerError(response.message || "OTP verification failed");
        }
      } catch (e: unknown) {
        const err = e as { message?: string };
        setServerError(err.message || "Invalid OTP. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
    [otp, validate, email, navigate, timeLeft]
  );

  const handleResend = useCallback(async () => {
    setTimeLeft(60);
    setOtp(Array(OTP_LENGTH).fill(""));
    setServerError("");
    try {
      const response = await authService.userResendOtp(email);
      if (!response.success) {
        setServerError(response.message || "Failed to resend OTP");
      }
    } catch (e: unknown) {
      const err = e as { message?: string };
      setServerError(err.message || "Failed to resend OTP");
    }
  }, [email]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 pt-24">
      <LandingNavbar showActions={false} />
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        <div className="hidden lg:flex justify-center lg:justify-end">
          <img src="/interfaceUser.png" alt="Patient Illustration" className="w-full max-w-lg object-contain" />
        </div>

        <div className="w-full max-w-md mx-auto lg:mx-0">
          <div className="bg-white rounded-2xl shadow-xl p-10">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Verify OTP</h1>
            <p className="text-gray-600 mb-8">Enter the OTP sent to your email</p>

            {serverError && <div className="mb-4 text-red-600 text-sm">{serverError}</div>}
            {errors.otp && !serverError && <div className="mb-4 text-red-600 text-sm">{errors.otp}</div>}

            <form onSubmit={handleSubmit} noValidate className="space-y-6">
              <div className="flex justify-center gap-3">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onPaste={i === 0 ? handlePaste : undefined}
                    className={`w-14 h-14 text-center text-xl font-semibold border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all ${errors.otp ? "border-red-500" : digit ? "border-primary bg-primary/10" : "border-gray-300"
                      }`}
                    aria-label={`OTP digit ${i + 1}`}
                  />
                ))}
              </div>

              <Button type="submit" loading={submitting} disabled={!isValid || submitting} className="w-full py-3">
                {submitting ? "Verifying..." : "Verify OTP"}
              </Button>
            </form>

            <div className="text-center mt-6 flex justify-center gap-2">
              <span className="text-gray-600">Expires in: </span>
              <span className="text-primary font-semibold">{timeLeft}s</span>
            </div>

            <div className="text-center mt-6">
              <span className="text-gray-600">Didn't receive code? </span>
              <button
                type="button"
                onClick={handleResend}
                className="text-primary hover:text-primary/80 font-medium hover:underline"
                disabled={submitting}
              >
                Resend
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientForgotPasswordOTP;
