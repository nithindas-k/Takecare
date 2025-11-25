import React, { useCallback, useMemo, useState, useRef } from "react";
import Button from "../../../components/Button";
import Input from "../../../components/Input";
import doctorService from "../../../services/doctorService";
import { useNavigate } from "react-router-dom";


interface FormData {
  degree: string;
  experience: string;
  speciality: string;
  videoFees: string;
  chatFees: string;
  certificateFile: File | null;
}

type Errors = Partial<Record<keyof FormData, string>>;

const specialities = [
  "Cardiologist",
  "Dermatologist",
  "Neurologist",
  "Pediatrician",
  "Psychiatrist",
  "Orthopedic",
  "General Physician",
  "Other",
];

const IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"];


const DoctorVerification: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<FormData>({
    degree: "",
    experience: "",
    speciality: "",
    videoFees: "",
    chatFees: "",
    certificateFile: null,
  });

  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [serverMessage, setServerMessage] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validate = useCallback((data: FormData): Errors => {
    const e: Errors = {};
    if (!data.degree.trim()) e.degree = "Degree is required.";
    if (!data.experience.trim()) e.experience = "Experience is required.";
    if (!data.speciality) e.speciality = "Speciality is required.";
    if (!data.videoFees.trim()) e.videoFees = "Video fees is required.";
    else if (isNaN(Number(data.videoFees)) || Number(data.videoFees) <= 0) {
      e.videoFees = "Please enter a valid amount.";
    }
    if (!data.chatFees.trim()) e.chatFees = "Chat fees is required.";
    else if (isNaN(Number(data.chatFees)) || Number(data.chatFees) <= 0) {
      e.chatFees = "Please enter a valid amount.";
    }
    if (!data.certificateFile) {
      e.certificateFile = "Medical license/certificate is required.";
    } else if (!IMAGE_TYPES.includes(data.certificateFile.type)) {
      e.certificateFile = "Only image files (.jpg, .jpeg, .png) are allowed.";
    }
    return e;
  }, []);

  const formErrors = useMemo(() => validate(formData), [formData, validate]);
  const isValid = useMemo(
    () => Object.keys(formErrors).length === 0,
    [formErrors]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name as keyof FormData];
        return next;
      });
    },
    []
  );

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null; // <-- Fix: declare file here
      let error: string | undefined = undefined;
      if (!file) {
        error = "Medical license/certificate is required.";
      } else if (!IMAGE_TYPES.includes(file.type)) {
        error = "Only image files (.jpg, .jpeg, .png) are allowed.";
      }
      setFormData((prev) => ({
        ...prev,
        certificateFile: error ? null : file,
      }));
      setErrors((prev) => ({ ...prev, certificateFile: error }));
    },
    []
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const validation = validate(formData);
      setErrors(validation);
      setServerMessage("");
      if (Object.keys(validation).length > 0) return;

      try {
        setSubmitting(true);
        const submitData = new FormData();
        submitData.append("degree", formData.degree);
        submitData.append("experience", formData.experience);
        submitData.append("speciality", formData.speciality);
        submitData.append("videoFees", formData.videoFees);
        submitData.append("chatFees", formData.chatFees);
        if (formData.certificateFile) {
          submitData.append("certificate", formData.certificateFile);
        }

        const response = await doctorService.submitVerification(submitData);
        if (response.success) {
          setServerMessage(
            "Verification submitted successfully. Redirecting to dashboard..."
          );
          setFormData({
            degree: "",
            experience: "",
            speciality: "",
            videoFees: "",
            chatFees: "",
            certificateFile: null,
          });
          setErrors({});
          // Redirect after a short delay
          setTimeout(() => {
            navigate("/doctor/dashboard");
          }, 1200); // 1.2 seconds delay for UX
        } else {
          setServerMessage(response.message || "Verification failed.");
        }
      } catch (err: any) {
        setServerMessage("Failed to submit verification. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
    [formData, validate]
  );

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
        {/* Illustration */}
        <div className="flex justify-center lg:justify-end">
          <div className="relative w-full max-w-lg px-4">
            <img
              src="doctor.png"
              alt="Doctors Illustration"
              className="w-full h-auto object-contain"
            />
          </div>
        </div>

        {/* Form */}
        <div className="w-full max-w-md mx-auto lg:mx-0">
          <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-10">
            <div className="flex items-start justify-between mb-8">
              <h1 className="text-3xl font-bold text-gray-800">Verification</h1>
            </div>

            {serverMessage && (
              <div
                className={`mb-4 ${
                  serverMessage.includes("successfully")
                    ? "text-green-600"
                    : "text-red-600"
                } font-medium`}
              >
                {serverMessage}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              noValidate
              className="space-y-5"
              aria-describedby="formErrors"
            >
              {Object.keys(errors).length > 0 && (
                <div id="formErrors" className="text-sm text-red-600">
                  Please fix the highlighted fields.
                </div>
              )}

              <Input
                label="Degree"
                name="degree"
                value={formData.degree}
                onChange={handleChange}
                error={errors.degree}
              />
              <Input
                label="Experience"
                name="experience"
                value={formData.experience}
                onChange={handleChange}
                error={errors.experience}
              />

              <div>
                <label
                  htmlFor="speciality"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Speciality
                </label>
                <select
                  id="speciality"
                  name="speciality"
                  value={formData.speciality}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all ${
                    errors.speciality ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value="">Select speciality</option>
                  {specialities.map((spec) => (
                    <option key={spec} value={spec}>
                      {spec}
                    </option>
                  ))}
                </select>
                {errors.speciality && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.speciality}
                  </p>
                )}
              </div>

              <Input
                label="Video Fees"
                name="videoFees"
                type="text"
                value={formData.videoFees}
                onChange={handleChange}
                error={errors.videoFees}
                placeholder="Enter consultation fee"
              />

              <Input
                label="Chat Fees"
                name="chatFees"
                type="text"
                value={formData.chatFees}
                onChange={handleChange}
                error={errors.chatFees}
                placeholder="Enter consultation fee"
              />

              {/* File Upload Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload medical license / certificate
                </label>
                <div className="relative">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png,image/jpg"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-left text-gray-500 hover:border-teal-500 transition-all"
                  >
                    {formData.certificateFile ? (
                      <span className="text-teal-600 font-medium">
                        {formData.certificateFile.name}
                      </span>
                    ) : (
                      <span className="text-teal-500">
                        Choose Image File (.jpg, .jpeg, .png)
                      </span>
                    )}
                  </button>
                </div>
                {errors.certificateFile && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.certificateFile}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                loading={submitting}
                disabled={!isValid || submitting}
                className="w-full py-3 mt-6"
              >
                {submitting ? "Submitting..." : "Submit"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorVerification;
