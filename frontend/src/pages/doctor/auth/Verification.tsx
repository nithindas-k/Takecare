import React, { useCallback, useState, useRef, useEffect } from "react";
import { FaUserDoctor, FaStethoscope, FaNotesMedical } from "react-icons/fa6";
import Button from "../../../components/Button";
import Input from "../../../components/Input";
import doctorService from "../../../services/doctorService";
import { useNavigate } from "react-router-dom";
import { specialtyService } from "../../../services/specialtyService";
import { Skeleton } from "../../../components/ui/skeleton";
import LandingNavbar from "../../../components/common/LandingNavbar";

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

const IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"];
const MAX_FILES = 5;

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
        if (response.success && response.data) {
          const data = response.data;
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

    const hasExistingDocuments = documents.some(doc => doc.isExisting);
    const hasNewFiles = data.certificateFiles.length > 0;

    if (!hasExistingDocuments && !hasNewFiles) {
      e.certificateFiles = "Please upload at least one verification document (degree certificate, license, etc.)";
    }
    return e;
  }, [documents]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[name as keyof FormData];
      return next;
    });
  }, []);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    if (documents.length + files.length > MAX_FILES) {
      setErrors((prev) => ({ ...prev, certificateFiles: `You can upload a maximum of ${MAX_FILES} documents.` }));
      return;
    }
    const invalidFiles = files.filter(file => !IMAGE_TYPES.includes(file.type));
    if (invalidFiles.length > 0) {
      setErrors((prev) => ({ ...prev, certificateFiles: "Only image files (.jpg, .jpeg, .png) are allowed." }));
      return;
    }

    const largeFiles = files.filter(file => file.size > 4 * 1024 * 1024);
    if (largeFiles.length > 0) {
      setErrors((prev) => ({ ...prev, certificateFiles: "Each file must be less than 4MB." }));
      return;
    }

    const newDocuments: DocumentPreview[] = files.map((file, index) => ({ id: `new-${Date.now()}-${index}`, url: URL.createObjectURL(file), name: file.name, isExisting: false, file }));
    setDocuments((prev) => [...prev, ...newDocuments]);
    setFormData((prev) => ({ ...prev, certificateFiles: [...prev.certificateFiles, ...files] }));
    setErrors((prev) => { const next = { ...prev }; delete next.certificateFiles; return next; });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [documents]);

  const handleRemoveDocument = useCallback((docId: string) => {
    setDocuments((prev) => {
      const docToRemove = prev.find(doc => doc.id === docId);
      const newDocs = prev.filter(doc => doc.id !== docId);
      if (docToRemove && !docToRemove.isExisting && docToRemove.file) { setFormData((prevForm) => ({ ...prevForm, certificateFiles: prevForm.certificateFiles.filter(f => f !== docToRemove.file) })); }
      return newDocs;
    });
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
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
      if (hasExistingDocuments) { const existingUrls = documents.filter(doc => doc.isExisting).map(doc => doc.url); submitData.append("existingDocuments", JSON.stringify(existingUrls)); }
      if (formData.certificateFiles.length > 0) { formData.certificateFiles.forEach((file) => { submitData.append("certificate", file); }); }
      const response = await doctorService.submitVerification(submitData);
      if (response.success) {
        setServerMessage("Verification submitted successfully! Redirecting to dashboard...");
        setFormData({ degree: "", experience: "", speciality: "", videoFees: "", chatFees: "", certificateFiles: [] });
        setDocuments([]); setErrors({}); setRejectionReason(null); setCanResubmit(false);
        setTimeout(() => { navigate("/doctor/dashboard"); }, 2000);
      } else { setServerMessage(response.message || "Failed to submit verification. Please try again."); }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to submit verification. Please try again.";
      setServerMessage(errorMessage);
    } finally {
      setSubmitting(false);
    }
  }, [formData, validate, navigate, documents]);

  const canAddMore = documents.length < MAX_FILES;

  return (
    <>
      <style>{animationStyles}</style>
      <div className="min-h-screen bg-white flex flex-col">
        <LandingNavbar showActions={false} />

        <div className="flex-1 flex pt-12 lg:pt-20">
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
              {doctorIcons.map((iconData, i) => (
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
              className="absolute bottom-[8%] left-0 right-0 flex flex-col items-center gap-3 px-8 text-center"
              style={{ animation: "fadeInUp 0.8s ease-out 0.3s both" }}
            >
              <WaveEmoji />
              <h2 className="text-3xl font-bold text-[#00A1B0] tracking-tight">
                Profile Verification
              </h2>
              <p className="text-gray-500 text-sm max-w-xs leading-relaxed">
                Doctor, please complete your professional profile. Our medical board will review your credentials for approval.
              </p>

              <div
                className="mt-4 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-teal-100/50 p-6 max-w-[260px] w-full border border-gray-100/80 text-left"
                style={{ animation: "fadeInUp 0.8s ease-out 0.8s both" }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00A1B0" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <p className="text-xs font-semibold text-gray-700">Medical Credentials</p>
                </div>
                <div className="space-y-1.5">
                  <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#00A1B0] w-[70%]" />
                  </div>
                  <p className="text-[10px] text-gray-400">70% of setup complete</p>
                </div>
              </div>
            </div>
          </div>

          {/* ─── RIGHT PANEL ─── */}
          <div
            className="w-full lg:w-1/2 flex items-center justify-center px-4 py-8 overflow-y-auto"
            style={{ animation: "slideInRight 0.6s ease-out 0.2s both" }}
          >
            <div className="w-full max-w-md my-auto">
              <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-8 lg:p-10 border border-gray-100">
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-800 mb-1">Verification</h1>
                  <p className="text-sm text-gray-400">Complete your medical profile</p>
                </div>

                {loading ? (
                  <div className="space-y-6">
                    <Skeleton className="h-10 w-full rounded-lg" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                    <Skeleton className="h-24 w-full rounded-lg" />
                    <Skeleton className="h-12 w-full rounded-lg" />
                  </div>
                ) : (
                  <>
                    {rejectionReason && (
                      <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl animate-in fade-in">
                        <h3 className="text-red-800 font-semibold text-sm mb-1">Verification Rejected</h3>
                        <p className="text-red-700 text-xs leading-relaxed">{rejectionReason}</p>
                      </div>
                    )}

                    {serverMessage && (
                      <div className={`mb-6 p-3 rounded-lg text-sm text-center font-medium border animate-in fade-in ${serverMessage.includes("successfully") || serverMessage.includes("approved")
                          ? "bg-green-50 text-green-700 border-green-100"
                          : serverMessage.includes("pending")
                            ? "bg-yellow-50 text-yellow-700 border-yellow-100"
                            : "bg-red-50 text-red-700 border-red-100"
                        }`}>
                        {serverMessage}
                      </div>
                    )}

                    <form onSubmit={handleSubmit} noValidate className="space-y-4">
                      {Object.keys(errors).length > 0 && (
                        <div className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">
                          Please fill all required fields correctly.
                        </div>
                      )}

                      <Input label="Degree" name="degree" value={formData.degree} onChange={handleChange} error={errors.degree} placeholder="e.g. MBBS, MD" />

                      <Input label="Experience" name="experience" value={formData.experience} onChange={handleChange} error={errors.experience} placeholder="Years of experience" />

                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Speciality</label>
                        <select
                          name="speciality"
                          value={formData.speciality}
                          onChange={handleChange}
                          className={`w-full px-4 py-2.5 bg-white border rounded-xl outline-none transition-all focus:ring-2 focus:ring-[#00A1B0]/20 ${errors.speciality ? "border-red-500" : "border-gray-200 focus:border-[#00A1B0]"
                            }`}
                        >
                          <option value="">Select speciality</option>
                          {specialtiesList.map((spec) => (
                            <option key={spec._id} value={spec.name}>{spec.name}</option>
                          ))}
                        </select>
                        {errors.speciality && <p className="text-[11px] text-red-500 ml-1">{errors.speciality}</p>}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <Input label="Video Fees" name="videoFees" value={formData.videoFees} onChange={handleChange} error={errors.videoFees} placeholder="₹ Amount" />
                        <Input label="Chat Fees" name="chatFees" value={formData.chatFees} onChange={handleChange} error={errors.chatFees} placeholder="₹ Amount" />
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-700 block">
                          Medical License / Certificates
                          <span className="text-[10px] font-normal text-gray-400 ml-2">({documents.length}/{MAX_FILES})</span>
                        </label>

                        <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png" onChange={handleFileUpload} className="hidden" multiple />

                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {documents.map((doc) => (
                            <div key={doc.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-xl border border-gray-100 group">
                              <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 bg-white flex-shrink-0">
                                <img src={doc.url} alt={doc.name} className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-medium text-gray-700 truncate">{doc.name}</p>
                                <p className="text-[9px] text-gray-400">{doc.isExisting ? "Verified" : "New Upload"}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveDocument(doc.id)}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}

                          {canAddMore && (
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="w-full py-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-[#00A1B0] hover:bg-teal-50/50 transition-all flex flex-col items-center justify-center gap-1 group"
                            >
                              <div className="p-2 bg-gray-100 rounded-full text-gray-400 group-hover:bg-[#00A1B0]/10 group-hover:text-[#00A1B0] transition-colors">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                              </div>
                              <span className="text-[11px] font-medium text-gray-400 group-hover:text-[#00A1B0]">Upload Documents</span>
                            </button>
                          )}
                        </div>
                        {errors.certificateFiles && <p className="text-[11px] text-red-500 ml-1">{errors.certificateFiles}</p>}
                      </div>

                      <Button
                        type="submit"
                        loading={submitting}
                        className="w-full py-3 mt-4"
                        disabled={submitting}
                      >
                        {rejectionReason ? "Resubmit Profile" : "Submit Verification"}
                      </Button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DoctorVerification;