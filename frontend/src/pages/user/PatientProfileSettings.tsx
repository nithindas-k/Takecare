import React, { useEffect, useState, useRef } from "react";
import { useDispatch } from "react-redux";
import { setUser } from "../../redux/user/userSlice";
import NavBar from "../../components/common/NavBar";
import PatientLayout from "../../components/Patient/PatientLayout";
import Breadcrumbs from "../../components/common/Breadcrumbs";
import userService from "../../services/userService";
import { FaUpload, FaCamera } from "react-icons/fa";
import { toast } from "sonner";
import { Skeleton } from "../../components/ui/skeleton";

interface UserProfile {
    name: string;
    email: string;
    phone?: string;
    profileImage?: string;
    gender?: string;
    dob?: string;
}

const PatientProfileSettings: React.FC = () => {
    const dispatch = useDispatch();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);


    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [gender, setGender] = useState("male");
    const [dob, setDob] = useState("");

    // Image Upload
    const [profileImage, setProfileImage] = useState<File | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const response = await userService.getProfile();
            if (response.success && response.data) {
                const data = response.data;
                setProfile(data);

                // Populate form
                setName(data.name || "");
                setPhone(data.phone || "");
                setGender(data.gender || "male");
                setDob(data.dob ? new Date(data.dob).toISOString().split('T')[0] : "");

                if (data.profileImage) {
                    setPreviewImage(data.profileImage);
                }
            }
        } catch (error) {
            console.error("Failed to fetch profile", error);
            toast.error("Failed to load profile data");
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 4 * 1024 * 1024) {
                toast.error("Image size should be less than 4MB");
                return;
            }
            setProfileImage(file);
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const information = {
                name,
                phone,
                gender,
                dob
            };

            const formData = new FormData();
            formData.append("information", JSON.stringify(information));

            if (profileImage) {
                formData.append("profileImage", profileImage);
            }

            const response = await userService.updateProfile(formData);

            if (response.success) {
                toast.success("Profile updated successfully");
                if (response.data) {
                    dispatch(setUser({
                        ...response.data,
                        _id: response.data.id || response.data._id,
                    }));

                    setProfile(response.data);
                }
            } else {
                toast.error(response.message || "Failed to update profile");
            }
        } catch (error) {
            console.error("Update error", error);
            toast.error("An error occurred while updating profile");
        } finally {
            setSubmitting(false);
        }
    };


    return (
        <div className="min-h-screen bg-gray-50 overflow-x-hidden">
            <NavBar />

            <Breadcrumbs
                items={[{ label: 'Home', path: '/' }, { label: 'Profile Settings' }]}
                title="Profile Settings"
                subtitle="Manage your personal information"
            />

            <PatientLayout>
                <section className="flex-1 min-w-0">
                    <div className="mb-6 flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">Profile</h2>
                            <p className="text-sm text-gray-500">Manage your profile information</p>
                        </div>
                        <span className="bg-[#00A1B0]/10 text-[#00A1B0] text-xs font-semibold px-2.5 py-0.5 rounded">Profile</span>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        {loading ? (
                            <div className="p-6 space-y-8">
                                <div className="space-y-4">
                                    <Skeleton className="h-6 w-32" />
                                    <div className="flex items-center gap-6 p-4 border border-gray-100 rounded-xl bg-gray-50/50">
                                        <Skeleton className="w-24 h-24 rounded-full" />
                                        <div className="space-y-2">
                                            <Skeleton className="h-10 w-32 rounded-lg" />
                                            <Skeleton className="h-4 w-48" />
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <div key={i} className="space-y-2">
                                            <Skeleton className="h-4 w-24" />
                                            <Skeleton className="h-10 w-full rounded-lg" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="p-6">
                                    <h3 className="text-lg font-bold text-gray-800 mb-6 border-b pb-4">Profile</h3>

                                    <form onSubmit={handleSubmit}>
                                        <div className="mb-10">
                                            <label className="block text-sm font-medium text-gray-700 mb-4">Profile Photo</label>
                                            <div className="flex items-center gap-6 p-4 border border-gray-100 rounded-xl bg-gray-50/50">
                                                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                                    <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 border-4 border-white shadow-sm">
                                                        {previewImage ? (
                                                            <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                                                                <FaCamera size={24} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <FaUpload className="text-white" />
                                                    </div>
                                                    <div className="absolute bottom-1 right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white"></div>
                                                </div>

                                                <div>
                                                    <div className="flex gap-3 mb-2">
                                                        <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">Change Photo</button>
                                                        {previewImage && (<button type="button" onClick={() => { setProfileImage(null); setPreviewImage(profile?.profileImage || null); }} className="px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors">Remove</button>)}
                                                    </div>
                                                    <p className="text-xs text-gray-500">Allowed JPG, GIF or PNG. Max size of 4MB</p>
                                                </div>
                                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
                                            </div>
                                        </div>

                                        <div className="mb-8">
                                            <h4 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Information</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                                <div className="col-span-2 md:col-span-1"><label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#00A1B0]/20 focus:border-[#00A1B0] outline-none transition-all text-gray-800 bg-gray-50/30" placeholder="Enter your full name" /></div>
                                                <div className="col-span-2 md:col-span-1"><label className="block text-sm font-semibold text-gray-700 mb-1.5">Date of Birth</label><input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#00A1B0]/20 focus:border-[#00A1B0] outline-none transition-all text-gray-800 bg-gray-50/30" /></div>
                                                <div className="col-span-2 md:col-span-1"><label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#00A1B0]/20 focus:border-[#00A1B0] outline-none transition-all text-gray-800 bg-gray-50/30" placeholder="Enter phone number" /></div>
                                                <div className="col-span-2 md:col-span-1"><label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label><input type="email" value={profile?.email || ""} readOnly className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed outline-none" /></div>
                                                <div className="col-span-2 md:col-span-1">
                                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Gender</label>
                                                    <div className="relative">
                                                        <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-gray-800 bg-gray-50/30 appearance-none cursor-pointer">
                                                            <option value="male">Male</option>
                                                            <option value="female">Female</option>
                                                            <option value="other">Other</option>
                                                        </select>
                                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"><svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-end pt-6 border-t border-gray-100"><button type="submit" disabled={submitting} className="w-auto px-8 bg-[#00A1B0] hover:bg-[#008f9c] text-white rounded-lg py-2.5 font-medium shadow-sm transition-all">{submitting ? "Saving..." : "Save Changes"}</button></div>
                                    </form>
                                </div>
                            </>
                        )}
                    </div>
                </section>
            </PatientLayout>
        </div>
    );
};

export default PatientProfileSettings;
