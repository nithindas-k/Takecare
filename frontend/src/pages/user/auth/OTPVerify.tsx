import React, {
  useCallback,
  useMemo,
  useState,
  useRef,
  useEffect,
} from "react";
import Button from "../../../components/Button";
import { useLocation, useNavigate } from "react-router-dom";
import authService from "../../../services/authService";

interface OTPFormData {
  otp: string[];
}
type Errors = {
  otp?: string;
};

const OTP_LENGTH = 6;
const RESEND_OTP_INTERVAL = 60;

const PatientOTPVerify: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const email = (location.state as any)?.email || "";
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [errors, setErrors] = useState<Errors>({});
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

  const formErrors = useMemo(() => validate(otp), [otp, validate]);
  const isValid = useMemo(
    () => Object.keys(formErrors).length === 0,
    [formErrors]
  );

  const handleChange = useCallback(
    (index: number, value: string) => {
      if (value && !/^\d$/.test(value)) return;
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      setErrors({});
      setServerError("");
      setSuccessMessage("");
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
      const pastedData = e.clipboardData
        .getData("text/plain")
        .slice(0, OTP_LENGTH);
      if (!/^\d+$/.test(pastedData)) return;
      const newOtp = [...otp];
      pastedData.split("").forEach((char, index) => {
        if (index < OTP_LENGTH) newOtp[index] = char;
      });
      setOtp(newOtp);
      setErrors({});
      setServerError("");
      setSuccessMessage("");
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
        });

        console.log("OTP Response:", response);

        if (response.success && response.data) {
          setSuccessMessage(
            "Registration successful! Redirecting to dashboard..."
          );
          setServerError("");
          setOtp(Array(OTP_LENGTH).fill(""));
          setErrors({});

          authService.saveToken(response.data.token);
          authService.saveUser(response.data);

          setTimeout(() => {
            navigate("/");
          }, 1500);
        } else {
          setServerError(response.message || "Invalid OTP. Please try again.");
          setOtp(Array(OTP_LENGTH).fill(""));
          inputRefs.current[0]?.focus();
        }
      } catch (error: any) {
        console.error("❌ OTP Verification Error:", error);
        setServerError(
          error.message || "Verification failed. Please try again."
        );
        setOtp(Array(OTP_LENGTH).fill(""));
        inputRefs.current[0]?.focus();
      } finally {
        setSubmitting(false);
      }
    },
    [email, otp, validate, navigate]
  );

 
  const handleResend = useCallback(async () => {
    try {
      setSubmitting(true);
      setServerError("");
      setSuccessMessage("");

      const response = await authService.userResendOtp(email); 

      if (response.success) {
        setSuccessMessage("New OTP sent to your email!");
        setErrors({});
        setOtp(Array(OTP_LENGTH).fill(""));
        inputRefs.current[0]?.focus();
        setTimer(RESEND_OTP_INTERVAL);
      } else {
        const errorMsg = response.message || "Failed to resend OTP.";

        if (errorMsg.includes("already registered")) {
          setServerError(
            "This email is already registered. Redirecting to login..."
          );
          setTimeout(() => navigate("/patient/login"), 2000);
        } else if (
          errorMsg.includes("expired") ||
          errorMsg.includes("not found")
        ) {
          setServerError("Session expired. Redirecting to registration...");
          setTimeout(() => navigate("/patient/register"), 2000);
        } else {
          setServerError(errorMsg);
        }
      }
    } catch (error: any) {
      const errorMsg = error.message || "Failed to resend OTP.";

      if (errorMsg.includes("already registered")) {
        setServerError(
          "This email is already registered. Redirecting to login..."
        );
        setTimeout(() => navigate("/patient/login"), 2000);
      } else if (
        errorMsg.includes("expired") ||
        errorMsg.includes("not found")
      ) {
        setServerError("Session expired. Redirecting to registration...");
        setTimeout(() => navigate("/patient/register"), 2000);
      } else {
        setServerError(errorMsg);
      }
    } finally {
      setSubmitting(false);
    }
  }, [email, navigate]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
        <div className="flex justify-center lg:justify-end">
          <div className="relative w-full max-w-lg px-4">
            <img
              src="/interfaceUser.png"
              alt="Patient Illustration"
              className="w-full h-auto object-contain"
            />
          </div>
        </div>

        <div className="w-full max-w-md mx-auto lg:mx-0">
          <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-10">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                OTP Verification
              </h1>
              <p className="text-gray-600 text-sm">
                Enter the 6-digit OTP sent to{" "}
                <span className="font-semibold text-gray-800">{email}</span>
              </p>
              <p className="text-gray-500 text-xs mt-2">
                ⏱️ OTP expires in 1 minute
              </p>
            </div>

            {errors.otp && (
              <div className="text-sm text-red-600 mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
                {errors.otp}
              </div>
            )}

            {serverError && (
              <div className="text-sm text-red-600 mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
                {serverError}
              </div>
            )}

            {successMessage && (
              <div className="text-sm text-green-600 mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                {successMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-6">
              <div className="flex justify-center gap-2 sm:gap-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    className={`w-12 h-12 sm:w-14 sm:h-14 text-center text-xl font-semibold border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all ${
                      errors.otp
                        ? "border-red-500"
                        : digit
                        ? "border-teal-500 bg-teal-50"
                        : "border-gray-300"
                    }`}
                    aria-label={`OTP digit ${index + 1}`}
                    disabled={submitting}
                  />
                ))}
              </div>

              <Button
                type="submit"
                loading={submitting}
                disabled={!isValid || submitting}
                className="w-full py-3 mt-8"
              >
                {submitting ? "Verifying..." : "Verify OTP"}
              </Button>

              <div className="text-center mt-6">
                <span className="text-gray-600 text-sm">
                  Didn't receive your code?{" "}
                </span>
                <button
                  type="button"
                  onClick={handleResend}
                  className={`text-teal-500 font-medium transition-all ${
                    timer > 0 || submitting
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:text-teal-600 hover:underline"
                  }`}
                  disabled={timer > 0 || submitting}
                >
                  {timer > 0 ? (
                    <span className="text-gray-500">
                      Resend in 0:{timer.toString().padStart(2, "0")}
                    </span>
                  ) : (
                    "Resend Code"
                  )}
                </button>
              </div>
            </form>

            <div className="text-center mt-6 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate("/patient/register")}
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

export default PatientOTPVerify;
