import React, { useEffect, useState, useRef } from "react";
import { useDispatch } from "react-redux";
import { setUser } from "../../redux/user/userSlice";
import DoctorNavbar from "../../components/Doctor/DoctorNavbar";
import DoctorLayout from "../../components/Doctor/DoctorLayout";
import doctorService from "../../services/doctorService";
import { specialtyService } from "../../services/specialtyService";
import Button from "../../components/Button";
import { FaUpload, FaTimes } from "react-icons/fa";
import { toast } from "sonner";
import { Skeleton } from "../../components/ui/skeleton";
import ImageCropper from "../../components/common/ImageCropper";

interface DoctorProfile {
  name: string;
  email: string;
  phone?: string;
  specialty?: string;
  qualifications: string[];
  experienceYears?: number;
  VideoFees?: number;
  ChatFees?: number;
  languages: string[];
  licenseNumber?: string;
  profileImage?: string;
  gender?: string;
  dob?: string;
  verificationStatus: string;
  about?: string;
}

const MAX_ABOUT_LENGTH = 1000;

const DoctorProfileSettings: React.FC = () => {
  const dispatch = useDispatch();
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("male");
  const [dob, setDob] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [videoFees, setVideoFees] = useState("");
  const [chatFees, setChatFees] = useState("");

  const [specialtiesList, setSpecialtiesList] = useState<{ _id: string; name: string }[]>([]);

  const [languages, setLanguages] = useState<string[]>([]);
  const [languageInput, setLanguageInput] = useState("");
  const [qualifications, setQualifications] = useState<string[]>([]);
  const [qualificationInput, setQualificationInput] = useState("");

  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [about, setAbout] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [removeImage, setRemoveImage] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);


  useEffect(() => {
    fetchProfile();
    fetchSpecialties();
  }, []);

  const fetchSpecialties = async () => {
    try {
      const response = await specialtyService.getActiveSpecialties();
      if (response?.success && response.data) {
        setSpecialtiesList(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch specialties:", error);
    }
  };


  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await doctorService.getDoctorProfile();
      if (response?.success && response.data) {
        const data = response.data;
        setProfile(data);
        setName(data.name || "");
        setPhone(data.phone || "");
        setGender(data.gender || "male");
        setDob(data.dob ? new Date(data.dob).toISOString().split("T")[0] : "");
        setSpecialty(data.specialty || "");
        setLicenseNumber(data.licenseNumber || "");
        setExperienceYears(data.experienceYears?.toString() || "");
        setVideoFees(data.VideoFees?.toString() || "");
        setChatFees(data.ChatFees?.toString() || "");
        setLanguages(data.languages || []);
        setQualifications(data.qualifications || []);
        setAbout(data.about || "");
        if (data.profileImage) setPreviewImage(data.profileImage);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  };


  const generateLocalAbout = () => {
    const years = experienceYears || "several";
    const quals = qualifications.length ? qualifications.join(", ") : "";
    const langs = languages.length ? languages.join(", ") : "";
    const docName = name || "The doctor";
    let text = `${docName} is an experienced ${specialty || "medical expert"} with over ${years} years in the healthcare field. `;
    if (quals) text += `They hold important qualifications such as ${quals}, which strengthen their professional expertise. `;
    text += `They are committed to offering patient-focused healthcare, ensuring every consultation is handled with clarity, empathy, and dedication. `;
    if (langs) text += `They can communicate fluently in ${langs}, allowing patients from diverse backgrounds to feel understood and comfortable. `;
    text += `${docName} continues to stay updated with modern medical practices and aims to deliver reliable, effective, and personalized treatment to all patients.`;
    return text.slice(0, MAX_ABOUT_LENGTH);
  };

  const handleAutoGenerateAbout = () => {
    if (generating) return;
    setGenerating(true);
    try {
      const generated = generateLocalAbout();
      setAbout(generated);
      toast.success("About generated successfully");
    } catch {
      toast.error("Failed to generate About");
    } finally {
      setGenerating(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];


      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        toast.error("Only image files (JPG, PNG, GIF) are allowed");
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      if (file.size > 4 * 1024 * 1024) {
        toast.error("Image size must be less than 4MB");
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setImageToCrop(reader.result as string);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = (croppedImageBlob: Blob) => {
    const file = new File([croppedImageBlob], "profile.jpg", { type: "image/jpeg" });
    setProfileImage(file);
    setPreviewImage(URL.createObjectURL(file));
    setRemoveImage(false);
    setShowCropper(false);
    setImageToCrop(null);
  };

  const handleRemoveImage = () => {
    setProfileImage(null);
    setPreviewImage(null);
    setRemoveImage(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAddLanguage = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && languageInput.trim()) {
      e.preventDefault();
      if (!languages.includes(languageInput.trim())) {
        setLanguages([...languages, languageInput.trim()]);
      }
      setLanguageInput("");
    }
  };

  const removeLanguage = (lang: string) => {
    setLanguages(languages.filter((l) => l !== lang));
  };

  const handleAddQualification = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && qualificationInput.trim()) {
      e.preventDefault();
      if (!qualifications.includes(qualificationInput.trim())) {
        setQualifications([...qualifications, qualificationInput.trim()]);
      }
      setQualificationInput("");
    }
  };

  const removeQualification = (qual: string) => {
    setQualifications(qualifications.filter((q) => q !== qual));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const information = { name, phone, gender, dob };
      const additionalInformation = { specialty, licenseNumber, experienceYears: Number(experienceYears), VideoFees: Number(videoFees), ChatFees: Number(chatFees), languages, qualifications, about };
      const formData = new FormData();
      formData.append("information", JSON.stringify(information));
      formData.append("additionalInformation", JSON.stringify(additionalInformation));
      if (profileImage) {
        formData.append("profileImage", profileImage);
      } else if (removeImage) {
        formData.append("removeProfileImage", "true");
      }
      const response = await doctorService.updateProfile(formData);
      if (response?.success && response.data) {
        toast.success("Profile updated successfully");
        dispatch(setUser({ ...response.data, _id: response.data.id || response.data._id }));
        setProfile(response.data);
      } else {
        toast.error(response?.message || "Update failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update profile");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DoctorNavbar />
        <DoctorLayout>
          <div className="bg-white p-6 shadow-sm rounded-xl space-y-8">
            <Skeleton className="h-8 w-48" />
            <div className="mb-8 p-6 bg-gray-50 rounded-xl border flex items-start gap-6">
              <Skeleton className="w-24 h-24 rounded-full" />
              <div className="space-y-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-24 rounded-lg" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
              ))}
            </div>
            <div className="space-y-4">
              <Skeleton className="h-6 w-48" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full rounded-lg" /></div>
                <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full rounded-lg" /></div>
              </div>
            </div>
          </div>
        </DoctorLayout>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DoctorNavbar />
      <DoctorLayout>
        <div className="bg-white p-6 shadow-sm rounded-xl">
          <h2 className="text-2xl font-bold mb-6">Profile Settings</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-8 p-6 bg-gray-50 rounded-xl border">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 border-2 border-white shadow-sm">
                  {previewImage ? (
                    <img src={previewImage} className="w-full h-full object-cover" alt="Profile preview" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-3xl font-bold">Dr</div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Profile Image</h3>
                  <div className="flex flex-wrap justify-center sm:justify-start gap-3 mb-2">
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-primary text-white rounded-lg flex items-center gap-2 text-sm hover:bg-primary/90 transition-colors"><FaUpload size={12} /> Upload</button>
                    {previewImage && (
                      <button type="button" onClick={handleRemoveImage} className="px-4 py-2 text-red-600 border border-red-200 rounded-lg text-sm hover:bg-red-50 transition-colors">Remove</button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">JPG, PNG or GIF. Max size 4MB.</p>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div><label className="text-sm font-medium">Name *</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2 border rounded-lg" required /></div>
              <div><label className="text-sm font-medium">Email (readonly)</label><input type="email" value={profile?.email || ""} readOnly className="w-full px-4 py-2 border rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed" /></div>
              <div><label className="text-sm font-medium">Phone *</label><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-2 border rounded-lg" required /></div>
              <div><label className="text-sm font-medium">Gender</label><select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full px-4 py-2 border rounded-lg"><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div>
              <div><label className="text-sm font-medium">Date of Birth</label><input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="w-full px-4 py-2 border rounded-lg" /></div>
              <div><label className="text-sm font-medium">License Number</label><input type="text" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} className="w-full px-4 py-2 border rounded-lg" /></div>
            </div>

            <h3 className="text-lg font-semibold mb-4">Professional Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div><label className="text-sm font-medium">Specialty</label><select value={specialty} onChange={(e) => setSpecialty(e.target.value)} className="w-full px-4 py-2 border rounded-lg"><option value="">Select Specialty</option>{specialtiesList.map((spec) => (<option key={spec._id} value={spec.name}>{spec.name}</option>))}</select></div>
              <div><label className="text-sm font-medium">Experience (Years)</label><input type="number" min="0" value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)} className="w-full px-4 py-2 border rounded-lg" /></div>
            </div>

            <div className="mb-8">
              <div className="flex justify-between items-center mb-2"><label className="text-sm font-medium">About</label><button type="button" className="px-3 py-1 text-xs bg-primary text-white rounded" onClick={handleAutoGenerateAbout}>{generating ? "Generating..." : "Auto Generate"}</button></div>
              <textarea rows={6} value={about} onChange={(e) => { if (e.target.value.length <= MAX_ABOUT_LENGTH) setAbout(e.target.value); }} className="w-full px-4 py-3 border rounded-lg" placeholder="Write something about yourself..."></textarea>
              <div className="text-right text-xs text-gray-500">{about.length}/{MAX_ABOUT_LENGTH}</div>
            </div>

            <h3 className="text-lg font-semibold mb-4">Consultation Fees</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div><label className="text-sm font-medium">Video Consultation Fee (₹)</label><input type="number" min="0" value={videoFees} onChange={(e) => setVideoFees(e.target.value)} className="w-full px-4 py-2 border rounded-lg" /></div>
              <div><label className="text-sm font-medium">Chat Consultation Fee (₹)</label><input type="number" min="0" value={chatFees} onChange={(e) => setChatFees(e.target.value)} className="w-full px-4 py-2 border rounded-lg" /></div>
            </div>

            <h3 className="text-lg font-semibold mb-3">Languages</h3>
            <div className="p-2 border rounded-lg mb-6">
              <div className="flex flex-wrap gap-2 mb-2">{languages.map((lang, index) => (<span key={index} className="px-3 py-1 bg-gray-100 rounded-full flex items-center gap-2">{lang}<button type="button" onClick={() => removeLanguage(lang)}><FaTimes size={12} className="text-gray-500 hover:text-red-500" /></button></span>))}</div>
              <input type="text" value={languageInput} onChange={(e) => setLanguageInput(e.target.value)} onKeyDown={handleAddLanguage} placeholder="Type a language and press Enter" className="w-full px-2 py-1 text-sm outline-none" />
            </div>

            <h3 className="text-lg font-semibold mb-3">Qualifications</h3>
            <div className="p-2 border rounded-lg mb-8">
              <div className="flex flex-wrap gap-2 mb-2">{qualifications.map((qual, index) => (<span key={index} className="px-3 py-1 bg-gray-100 rounded-full flex items-center gap-2">{qual}<button type="button" onClick={() => removeQualification(qual)}><FaTimes size={12} className="text-gray-500 hover:text-red-500" /></button></span>))}</div>
              <input type="text" value={qualificationInput} onChange={(e) => setQualificationInput(e.target.value)} onKeyDown={handleAddQualification} placeholder="Type qualification and press Enter" className="w-full px-2 py-1 text-sm outline-none" />
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t"><Button type="button" className="px-6 bg-gray-200">Cancel</Button><Button type="submit" disabled={submitting} className="px-6">{submitting ? "Saving..." : "Save Changes"}</Button></div>
          </form>
        </div>
      </DoctorLayout>
      {showCropper && imageToCrop && (
        <ImageCropper
          image={imageToCrop}
          onCropComplete={onCropComplete}
          onCancel={() => {
            setShowCropper(false);
            setImageToCrop(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
          aspect={3 / 4}
        />
      )}
    </div>
  );
};

export default DoctorProfileSettings;
