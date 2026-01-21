
import React, { useCallback, useMemo, useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Button from "../../../components/Button";
import authService from "../../../services/authService";
import LandingNavbar from "../../../components/common/LandingNavbar";
import { useDispatch } from "react-redux";
import { setUser } from "../../../redux/user/userSlice";

const OTP_LENGTH = 6;
const RESEND_OTP_INTERVAL = 60; // seconds

const DoctorOTPVerify: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const email = (location.state as { email?: string })?.email || "";
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [errors, setErrors] = useState<{ otp?: string }>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [serverMessage, setServerMessage] = useState<string>("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [timer, setTimer] = useState<number>(RESEND_OTP_INTERVAL);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!email) {
      navigate("/doctor/register");
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
      setServerMessage("");
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
      setServerMessage("");
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
        const response = await authService.doctorVerifyOtp({ email, otp: otpString, role: "doctor" });

        console.log("Doctor OTP response:", response);

        if (response?.success && response?.data?.token && response?.data?.user) {
          authService.saveToken(response.data.token);
          authService.saveUser(response.data.user);

          dispatch(setUser({
            _id: response.data.user._id,
            name: response.data.user.name,
            email: response.data.user.email,
            role: response.data.user.role as 'patient' | 'doctor' | 'admin',
            phone: response.data.user.phone,
            profileImage: response.data.user.profileImage,
          }));

          setServerMessage("Verification successful. Redirecting...");
          setOtp(Array(OTP_LENGTH).fill(""));
          setErrors({});
          setTimeout(() => navigate("/doctor/verification"), 800);
        } else {
          const errorMsg = response?.message || "Invalid OTP. Please try again.";
          setErrors({ otp: errorMsg });
          setOtp(Array(OTP_LENGTH).fill(""));
          inputRefs.current[0]?.focus();
        }
      } catch (e: unknown) {
        const err = e as { message?: string };
        console.error("Doctor OTP error:", err);
        const errorMsg = err?.message || "Verification failed. Please try again.";
        setErrors({ otp: errorMsg });
        setOtp(Array(OTP_LENGTH).fill(""));
        inputRefs.current[0]?.focus();
      } finally {
        setSubmitting(false);
      }
    },
    [otp, validate, email, navigate, dispatch]
  );

  const handleResend = useCallback(async () => {
    if (timer > 0 || !email) return;
    try {
      setSubmitting(true);
      setServerMessage("");
      const response = await authService.doctorResendOtp(email);
      if (response?.success) {
        setServerMessage("A new OTP has been sent to your email.");
        setErrors({});
        setOtp(Array(OTP_LENGTH).fill(""));
        inputRefs.current[0]?.focus();
        setTimer(RESEND_OTP_INTERVAL);
      } else {
        const msg = response?.message || "Could not resend OTP.";
        setServerMessage(msg);
      }
    } catch (e: unknown) {
      const err = e as { message?: string };
      setServerMessage(err?.message || "Could not resend OTP.");
    } finally {
      setSubmitting(false);
    }
  }, [email, timer]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 pt-24">
      <LandingNavbar showActions={false} />
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
        <div className="hidden lg:flex justify-center lg:justify-end">
          <div className="relative w-full max-w-lg px-4">
            <img src="/doctor.png" alt="Doctors Illustration" className="w-full h-auto object-contain" />
          </div>
        </div>

        <div className="w-full max-w-md mx-auto lg:mx-0">
          <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-10">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">OTP Verification</h1>
              <p className="text-gray-600 text-sm">Enter the 6-digit OTP sent to <span className="font-semibold">{email}</span></p>
              <p className="text-gray-500 text-xs mt-2">⏱️ OTP expires in 1 minute</p>
            </div>

            {errors.otp && (
              <div className="text-sm text-red-600 mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
                {errors.otp}
              </div>
            )}

            {serverMessage && (
              <div className="text-sm text-green-600 mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                {serverMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-6">
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
                    className={`w-12 h-12 sm:w-14 sm:h-14 text-center text-xl font-semibold border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all ${errors.otp ? "border-red-500" : digit ? "border-teal-500 bg-teal-50" : "border-gray-300"
                      }`}
                    aria-label={`OTP digit ${index + 1}`}
                    disabled={submitting}
                  />
                ))}
              </div>

              <Button type="submit" loading={submitting} disabled={!isValid || submitting} className="w-full py-3 mt-8">
                {submitting ? "Verifying..." : "Verify OTP"}
              </Button>

              <div className="text-center mt-6">
                <span className="text-gray-600 text-sm">Didn't receive your code? </span>
                <button
                  type="button"
                  onClick={handleResend}
                  className={`text-teal-500 font-medium transition-all ${timer > 0 || submitting ? "opacity-50 cursor-not-allowed" : "hover:text-teal-600 hover:underline"}`}
                  disabled={timer > 0 || submitting}
                >
                  {timer > 0 ? (
                    <span className="text-gray-500">Resend in 0:{timer.toString().padStart(2, "0")}</span>
                  ) : (
                    "Resend Code"
                  )}
                </button>
              </div>
            </form>

            <div className="text-center mt-6 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate("/doctor/register")}
                className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                ← Back to Registration
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorOTPVerify;
