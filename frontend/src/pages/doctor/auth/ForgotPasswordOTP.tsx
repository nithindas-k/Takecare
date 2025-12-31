import React, { useCallback, useMemo, useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Button from "../../../components/Button";
import authService from "../../../services/authService";

const OTP_LENGTH = 6;
const RESEND_TIMER = 60;
const ForgotPasswordOTP: React.FC = () => {
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [errors, setErrors] = useState<{ otp?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [serverMessage, setServerMessage] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || "";

  useEffect(() => {
    let interval: any;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer(t => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

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
        if (index < OTP_LENGTH) {
          newOtp[index] = char;
        }
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
        setServerMessage("");
        const otpString = otp.join("");
        const response = await authService.verifyForgotOtp(email, otpString, "doctor");
        if (response.success && response.data?.resetToken) {
          navigate("/doctor/reset-password", { state: { email, resetToken: response.data.resetToken } });
        } else {
          setErrors({ otp: response.message || "Invalid OTP. Please try again." });
        }
      } catch (err: any) {
        setErrors({ otp: err.message || "Invalid OTP. Please try again." });
      } finally {
        setSubmitting(false);
      }
    },
    [otp, validate, email, navigate]
  );

  const handleResend = useCallback(async () => {
    if (resendTimer > 0 || !email) return;
    try {
      setSubmitting(true);
      setServerMessage("");
      const response = await authService.resendOtp(email, "doctor");
      if (response.success) {
        setServerMessage("A new OTP has been sent to your email.");
        setResendTimer(RESEND_TIMER);
      } else {
        setErrors({ otp: response.message || "Could not resend OTP." });
      }
    } catch (err: any) {
      setErrors({ otp: err.message || "Could not resend OTP." });
    } finally {
      setSubmitting(false);
    }
  }, [email, resendTimer]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
        {/* Illustration */}
        <div className="flex justify-center lg:justify-end">
          <div className="relative w-full max-w-lg px-4">
            <img src="doctor.png" alt="Doctors Illustration" className="w-full h-auto object-contain" />
          </div>
        </div>

        {/* Form */}
        <div className="w-full max-w-md mx-auto lg:mx-0">
          <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-10">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Verify OTP</h1>
            <p className="text-gray-600 text-sm mb-4">Enter the OTP sent to your email</p>

            {serverMessage && <div className="text-sm text-green-600 p-3 bg-green-50 rounded-lg mb-4">{serverMessage}</div>}

            <form onSubmit={handleSubmit} noValidate className="space-y-6" aria-describedby="formErrors">
              {errors.otp && <div id="formErrors" className="text-sm text-red-600 mb-4">{errors.otp}</div>}

              <div className="flex justify-center gap-2 sm:gap-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={el => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleChange(index, e.target.value)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    className={`w-12 h-12 sm:w-14 sm:h-14 text-center text-xl font-semibold border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all ${errors.otp ? "border-red-500" : digit ? "border-teal-500 bg-teal-50" : "border-gray-300"
                      }`}
                    aria-label={`OTP digit ${index + 1}`}
                  />
                ))}
              </div>

              <Button type="submit" loading={submitting} disabled={!isValid || submitting} className="w-full py-3 mt-8">
                {submitting ? "Verifying..." : "Verify OTP"}
              </Button>
            </form>

            <div className="text-center mt-6">
              <span className="text-gray-600">Didn't receive code?</span>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendTimer > 0 || submitting}
                className="text-teal-500 hover:text-teal-600 font-medium hover:underline ml-1"
              >
                {resendTimer > 0 ? `Resend in 0:${resendTimer < 10 ? `0${resendTimer}` : resendTimer}` : "Resend"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordOTP;
