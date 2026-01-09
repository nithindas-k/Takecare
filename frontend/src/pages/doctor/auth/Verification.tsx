import React, { useCallback, useState, useRef, useEffect } from "react";
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
  certificateFiles: File[];
}

interface DocumentPreview {
  id: string;
  url: string;
  name: string;
  isExisting: boolean;
  file?: File;
}

type Errors = Partial<Record<keyof FormData, string>>;

import { specialtyService } from "../../../services/specialtyService";

// const specialities = [
//   "Cardiologist",
//   "Dermatologist",
//   "Neurologist",
//   "Pediatrician",
//   "Psychiatrist",
//   "Orthopedic",
//   "General Physician",
//   "Other",
// ];

const IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"];
const MAX_FILES = 5;


const DoctorVerification: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<FormData>({
    degree: "",
    experience: "",
    speciality: "",
    videoFees: "",
    chatFees: "",
    certificateFiles: [],
  });

  const [documents, setDocuments] = useState<DocumentPreview[]>([]);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [serverMessage, setServerMessage] = useState<string>("");
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [, setCanResubmit] = useState<boolean>(true);
  const [specialtiesList, setSpecialtiesList] = useState<{ _id: string; name: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchVerificationData = async () => {
      try {
        const response = await doctorService.getVerificationFormData();
        console.log("Full API Response:", response);

        if (response.success && response.data) {
          const data = response.data;
          console.log("Verification Data:", data);
          console.log("Verification Documents:", data.verificationDocuments);

          setFormData({
            degree: data.degree || "",
            experience: data.experience?.toString() || "",
            speciality: data.speciality || "",
            videoFees: data.videoFees?.toString() || "",
            chatFees: data.chatFees?.toString() || "",
            certificateFiles: [],
          });
          setRejectionReason(data.rejectionReason || null);
          setCanResubmit(data.canResubmit);

          // Load existing documents
          if (data.verificationDocuments && data.verificationDocuments.length > 0) {
            const existingDocs: DocumentPreview[] = data.verificationDocuments.map((docUrl: string, index: number) => {
              const fullUrl = docUrl.startsWith("http")
                ? docUrl
                : `http://localhost:5000/${docUrl.replace(/^\//, '')}`;
              return {
                id: `existing-${index}`,
                url: fullUrl,
                name: `Certificate ${index + 1}`,
                isExisting: true,
              };
            });
            setDocuments(existingDocs);
          }

          if (data.verificationStatus === "pending") {
            setServerMessage("Your verification is pending review. Please wait for admin approval.");
          } else if (data.verificationStatus === "approved") {
            setServerMessage("Your verification has already been approved!");
          }
        }
      } catch (error) {
        console.error("Failed to fetch verification data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVerificationData();
  }, []);

  useEffect(() => {
    const fetchSpecialties = async () => {
      try {
        const response = await specialtyService.getActiveSpecialties();
        if (response.success && response.data) {
          setSpecialtiesList(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch specialties:", error);
      }
    };
    fetchSpecialties();
  }, []);

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

    // Check if there are either existing documents or new files
    const hasExistingDocuments = documents.some(doc => doc.isExisting);
    const hasNewFiles = data.certificateFiles.length > 0;

    if (!hasExistingDocuments && !hasNewFiles) {
      e.certificateFiles = "Please upload at least one verification document (degree certificate, license, etc.)";
    }
    return e;
  }, [documents]);



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
      const files = Array.from(e.target.files || []);

      if (files.length === 0) return;

      // Check if adding these files would exceed the max limit
      if (documents.length + files.length > MAX_FILES) {
        setErrors((prev) => ({
          ...prev,
          certificateFiles: `You can upload a maximum of ${MAX_FILES} documents.`
        }));
        return;
      }


      const invalidFiles = files.filter(file => !IMAGE_TYPES.includes(file.type));
      if (invalidFiles.length > 0) {
        setErrors((prev) => ({
          ...prev,
          certificateFiles: "Only image files (.jpg, .jpeg, .png) are allowed."
        }));
        return;
      }


      const newDocuments: DocumentPreview[] = files.map((file, index) => ({
        id: `new-${Date.now()}-${index}`,
        url: URL.createObjectURL(file),
        name: file.name,
        isExisting: false,
        file,
      }));

      setDocuments((prev) => [...prev, ...newDocuments]);
      setFormData((prev) => ({
        ...prev,
        certificateFiles: [...prev.certificateFiles, ...files],
      }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next.certificateFiles;
        return next;
      });


      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [documents]
  );

  const handleRemoveDocument = useCallback((docId: string) => {
    setDocuments((prev) => {
      const docToRemove = prev.find(doc => doc.id === docId);
      const newDocs = prev.filter(doc => doc.id !== docId);


      if (docToRemove && !docToRemove.isExisting && docToRemove.file) {
        setFormData((prevForm) => ({
          ...prevForm,
          certificateFiles: prevForm.certificateFiles.filter(f => f !== docToRemove.file),
        }));
      }

      return newDocs;
    });
  }, []);

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


        const hasExistingDocuments = documents.some(doc => doc.isExisting);
        submitData.append("hasExistingDocuments", hasExistingDocuments.toString());


        if (hasExistingDocuments) {
          const existingUrls = documents
            .filter(doc => doc.isExisting)
            .map(doc => doc.url);
          submitData.append("existingDocuments", JSON.stringify(existingUrls));
        }


        if (formData.certificateFiles.length > 0) {
          console.log("Appending new files:", formData.certificateFiles.length);
          formData.certificateFiles.forEach((file, index) => {
            console.log(`File ${index}:`, file.name, file.type, file.size);
            submitData.append("certificate", file);
          });
        }

        console.log("=== SUBMITTING TO SERVER ===");
        console.log("Has existing docs:", hasExistingDocuments);
        console.log("New files count:", formData.certificateFiles.length);
        console.log("Total documents:", documents.length);

        console.log("=== SUBMITTING TO API ===");
        console.log("Endpoint: /doctors/submit-verification");

        const response = await doctorService.submitVerification(submitData);

        console.log("Server response:", response);

        if (response.success) {
          setServerMessage("Verification submitted successfully! Redirecting to dashboard...");

          // Clear the form
          setFormData({
            degree: "",
            experience: "",
            speciality: "",
            videoFees: "",
            chatFees: "",
            certificateFiles: [],
          });
          setDocuments([]);
          setErrors({});
          setRejectionReason(null);
          setCanResubmit(false);

          setTimeout(() => {
            navigate("/doctor/dashboard");
          }, 2000);
        } else {
          setServerMessage(response.message || "Failed to submit verification. Please try again.");
        }
      } catch (err: any) {
        console.error("Verification submission error:", err);
        setServerMessage(err.response?.data?.message || "Failed to submit verification. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
    [formData, validate, navigate, documents]
  );

  const canAddMore = documents.length < MAX_FILES;

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
        {/* Illustration */}
        <div className="flex justify-center lg:justify-end">
          <div className="relative w-full max-w-lg px-4">
            <img
              src="/doctor.png"
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

            {/* Loading State */}
            {loading && (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
                <span className="ml-3 text-gray-600">Loading...</span>
              </div>
            )}

            {/* Rejection Reason Alert */}
            {!loading && rejectionReason && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="text-red-800 font-semibold mb-1">Verification Rejected</h3>
                <p className="text-red-700 text-sm">{rejectionReason}</p>
                <p className="text-red-600 text-xs mt-2">Please update your information and resubmit.</p>
              </div>
            )}

            {serverMessage && (
              <div
                className={`mb-4 ${serverMessage.includes("successfully") || serverMessage.includes("approved")
                  ? "text-green-600"
                  : serverMessage.includes("pending")
                    ? "text-yellow-600"
                    : "text-red-600"
                  } font-medium`}
              >
                {serverMessage}
              </div>
            )}

            {!loading && (
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
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all ${errors.speciality ? "border-red-500" : "border-gray-300"
                      }`}
                  >
                    <option value="">Select speciality</option>
                    {specialtiesList.map((spec) => (
                      <option key={spec._id} value={spec.name}>
                        {spec.name}
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
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Medical license / certificate
                    <span className="text-xs text-gray-500 ml-2">
                      ({documents.length}/{MAX_FILES} uploaded)
                    </span>
                  </label>

                  {/* Hidden file input - supports multiple files */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png,image/jpg"
                    onChange={handleFileUpload}
                    className="hidden"
                    multiple
                  />

                  <div className="space-y-3">
                    {/* Existing Document Cards */}
                    {documents.map((doc) => (
                      <div key={doc.id} className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                        <div className="flex items-center gap-4">
                          {/* Thumbnail */}
                          <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-gray-200 bg-white">
                            <img
                              src={doc.url}
                              alt={doc.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "/placeholder-document.png";
                              }}
                            />
                          </div>

                          {/* Document Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-teal-600" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                              </svg>
                              <span className="text-sm font-medium text-gray-900 truncate">
                                {doc.name}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">
                              {doc.isExisting ? "Current document" : "New document"}
                            </p>
                          </div>

                          {/* Remove Button */}
                          <button
                            type="button"
                            onClick={() => handleRemoveDocument(doc.id)}
                            className="flex-shrink-0 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove document"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Add Document Button - Show if under limit */}
                    {canAddMore && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-teal-500 hover:bg-teal-50/50 transition-all group"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div className="p-3 bg-teal-100 rounded-full group-hover:bg-teal-200 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700 group-hover:text-teal-700">
                              {documents.length === 0 ? "Add Document" : "Add More Documents"}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Upload .jpg, .jpeg, or .png files (Max {MAX_FILES})
                            </p>
                          </div>
                        </div>
                      </button>
                    )}

                    {/* Max limit reached message */}
                    {!canAddMore && (
                      <div className="text-center py-3 text-sm text-gray-500">
                        Maximum {MAX_FILES} documents uploaded
                      </div>
                    )}
                  </div>

                  {errors.certificateFiles && (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.certificateFiles}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  loading={submitting}
                  className="w-full py-3 mt-6"
                >
                  {submitting ? "Submitting..." : rejectionReason ? "Resubmit" : "Submit"}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorVerification;