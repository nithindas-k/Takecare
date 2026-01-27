/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/DoctorProfile.tsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaStar,
  FaMapMarkerAlt,
  FaVideo,
  FaRegComment,
  FaMoneyBillWave,
  FaArrowLeft,
  FaHeart,
} from "react-icons/fa";
import NavBar from "../../components/common/NavBar";
import Footer from "../../components/common/Footer";
import doctorService from "../../services/doctorService";
import userService from "../../services/userService";
import ReviewsList from "../../components/reviews/ReviewsList";
import { toast } from "sonner";

import { API_BASE_URL } from "../../utils/constants";
import { Skeleton } from "../../components/ui/skeleton";
import { SpinnerCustom } from "../../components/ui/spinner";

type DoctorDTO = {
  id: string;
  name: string;
  email?: string;
  image?: string | null;
  speciality?: string;
  experience?: number;
  fees?: number | string;
  videoFees?: number | string;
  chatFees?: number | string;
  location?: string;
  rating?: number;
  reviews?: number;
  available?: boolean;
  qualifications?: string[] | string;
  languages?: string[] | string;
  about?: string;
};

const DoctorProfile: React.FC = () => {
  const { id: doctorId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState<DoctorDTO | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [relatedDoctors, setRelatedDoctors] = useState<DoctorDTO[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews'>('overview');
  const [isFavorited, setIsFavorited] = useState<boolean>(false);


  useEffect(() => {
    if (!doctorId) {
      setErrorMsg("Doctor ID is missing in the route.");
      setLoading(false);
      return;
    }

    let mounted = true;

    const checkFavoriteStatus = async () => {
      try {
        const response = await userService.getFavorites();
        if (response.success && Array.isArray(response.data)) {
          const isFav = response.data.some((doc: any) => (doc.id || doc._id) === doctorId);
          if (mounted) setIsFavorited(isFav);
        }
      } catch (error) {
        console.error("Failed to check favorite status", error);
      }
    };

    const fetchDoctor = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const result = await doctorService.getDoctorById(doctorId);
        if (result?.success === false) {
          if (mounted) {
            setErrorMsg(result.message || "Failed to fetch doctor details");
            setDoctor(null);
          }
        } else {
          const payload = result?.data ?? result;
          if (mounted) {
            setDoctor({
              id: payload?.id ?? payload?._id ?? doctorId,
              name: payload?.name ?? "Unknown Doctor",
              email: payload?.email,
              image: payload?.image ?? payload?.profileImage ?? null,
              speciality: payload?.speciality ?? payload?.specialty ?? "General",
              experience: payload?.experience ?? payload?.experienceYears ?? undefined,
              fees: payload?.fees ?? payload?.VideoFees ?? payload?.videoFees ?? undefined,
              videoFees: payload?.videoFees ?? payload?.VideoFees ?? undefined,
              chatFees: payload?.chatFees ?? payload?.ChatFees ?? undefined,
              location: payload?.location ?? "Kerala, India",
              rating: payload?.rating ?? payload?.ratingAvg ?? 0,
              reviews: payload?.reviews ?? payload?.ratingCount ?? 0,
              available: payload?.available ?? payload?.isActive ?? false,
              qualifications: payload?.qualifications,
              languages: payload?.languages,
              about: payload?.about ?? "Dedicated medical professional with years of experience...",
            });
          }
        }
      } catch (err: any) {
        if (mounted) {
          setErrorMsg(err?.response?.data?.message || err?.message || "Failed to fetch doctor details");
          setDoctor(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    const fetchRelatedDoctors = async () => {
      try {
        const result = await doctorService.getRelatedDoctors(doctorId);
        if (result?.success === false) {
          console.warn("Failed to fetch related doctors:", result.message);
          if (mounted) setRelatedDoctors([]);
        } else {
          const relatedData = result?.data ?? result;
          if (mounted && Array.isArray(relatedData)) {
            const mappedDoctors = relatedData.map((doc: any) => ({
              id: doc?.id ?? doc?._id ?? "",
              name: doc?.name ?? "Unknown Doctor",
              email: doc?.email,
              image: doc?.image ?? doc?.profileImage ?? null,
              speciality: doc?.speciality ?? doc?.specialty ?? "General",
              experience: doc?.experience ?? doc?.experienceYears,
              fees: doc?.fees ?? doc?.VideoFees ?? doc?.videoFees,
              videoFees: doc?.videoFees ?? doc?.VideoFees,
              chatFees: doc?.chatFees ?? doc?.ChatFees,
              location: doc?.location ?? "Kerala, India",
              rating: doc?.rating ?? doc?.ratingAvg ?? 0,
              reviews: doc?.reviews ?? doc?.ratingCount ?? 0,
              available: doc?.available ?? doc?.isActive ?? false,
              qualifications: doc?.qualifications,
              languages: doc?.languages,
              about: doc?.about,
            }));
            setRelatedDoctors(mappedDoctors);
          }
        }
      } catch (err: any) {
        console.warn("Error fetching related doctors:", err?.message);
        if (mounted) setRelatedDoctors([]);
      }
    };

    fetchDoctor();
    fetchRelatedDoctors();
    checkFavoriteStatus();

    return () => { mounted = false; };
  }, [doctorId]);

  const handleToggleFavorite = async () => {
    if (!doctorId) return;
    try {
      const response = await userService.toggleFavorite(doctorId);
      if (response.success) {
        setIsFavorited(prev => !prev);
        toast.success(response.message);
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error("Failed to update favorite status");
    }
  };

  const getImageUrl = (imagePath: string | null | undefined) => {
    if (!imagePath) return '/doctor.png';
    if (imagePath.startsWith('http')) return imagePath;
    const cleanPath = imagePath.replace(/\\/g, '/');
    return `${API_BASE_URL}/${cleanPath}`;
  };

  const handleBooking = () => {
    if (!doctor) return;
    navigate(`/booking/${doctor.id}`);
  };

  const handleRelatedDoctorClick = (relatedId: string) => {
    if (!relatedId) return;
    navigate(`/doctors/${relatedId}`);
  };

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      <NavBar />

      <div className="relative bg-gradient-to-r from-[#e0f7fa] to-[#f0f9ff] py-16">
        <div className="container mx-auto px-4 text-center relative z-10">
          <nav className="flex justify-center items-center text-sm font-medium text-gray-500 mb-2">
            <a href="/" className="hover:text-[#00A1B0]">Home</a>
            <span className="mx-2">/</span>
            <span className="text-[#00A1B0]">Doctors</span>
          </nav>
          <h1 className="text-4xl font-bold text-[#002f33]">Doctors</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-[#00A1B0] transition-colors font-medium text-sm"><FaArrowLeft /> Back to Doctors</button>
        </div>

        {loading ? (
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-48 h-48 rounded-lg bg-[#00A1B0]/5 flex items-center justify-center">
                <SpinnerCustom />
              </div>
              <div className="flex-1 space-y-4 pt-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-6 w-32 rounded-full" />
                <div className="flex gap-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-4 w-20" /></div>
                <Skeleton className="h-4 w-40" />
              </div>
              <div className="w-full md:w-64 space-y-4 md:pl-6 border-l border-gray-100">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-6 w-1/2" />
                </div>
                <Skeleton className="h-10 w-full rounded-full" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
              <div className="flex gap-8 border-b border-gray-200 pb-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        ) : errorMsg ? (
          <div className="bg-white rounded-xl p-6 mb-8 text-center text-red-600">{errorMsg}</div>
        ) : doctor ? (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="w-full md:w-56 h-64 md:h-56 flex-shrink-0 overflow-hidden rounded-xl border border-gray-100 shadow-sm">
                  <img src={getImageUrl(doctor.image)} alt={doctor.name} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" onError={(e) => { (e.target as HTMLImageElement).src = "/doctor.png"; }} />
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">{doctor.name}</h2>
                  <p className="text-[#00A1B0] font-semibold text-sm mb-3">{Array.isArray(doctor.qualifications) ? doctor.qualifications.join(", ") : doctor.qualifications ?? ""}</p>
                  <div className="flex items-center gap-2 mb-4"><span className="bg-[#bffff8] text-[#00A1B0] px-2 py-1 rounded-full flex items-center gap-1 text-xs font-bold"><FaStar className="w-3 h-3" /> {doctor.speciality}</span></div>
                  <div className="flex items-center gap-1 mb-4"><div className="flex text-yellow-400 text-xs">{Array.from({ length: 5 }).map((_, i) => (<FaStar key={i} className={i < Math.round(doctor.rating ?? 0) ? "" : "text-gray-300"} />))}</div><span className="text-gray-500 text-sm font-semibold">({doctor.reviews} Reviews)</span></div>
                  <div className="flex items-center text-gray-500 text-sm mb-4"><FaMapMarkerAlt className="mr-1 text-[#00A1B0]" /><span>{doctor.location}</span></div>
                  <div className="flex flex-wrap gap-2">{doctor.qualifications && (Array.isArray(doctor.qualifications) ? doctor.qualifications.slice(0, 3) : [doctor.qualifications]).map((q, idx) => (<span key={idx} className="px-3 py-1 bg-gray-50 text-gray-600 text-[10px] uppercase tracking-wider font-bold rounded-md border border-gray-200">{q}</span>))}</div>
                </div>
                <div className="w-full md:w-64 flex flex-col justify-between border-t md:border-t-0 md:border-l border-gray-100 pt-6 md:pt-0 md:pl-8 mt-6 md:mt-0">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between md:justify-start text-gray-600 text-sm"><span className="flex items-center"><FaRegComment className="mr-2 text-[#00A1B0]" /> Feedback</span><span className="font-bold text-gray-800 md:ml-2">{doctor.reviews ?? 0}</span></div>
                    <div className="flex items-center justify-between md:justify-start text-gray-600 text-sm"><span className="flex items-center"><FaMapMarkerAlt className="mr-2 text-[#00A1B0]" /> Location</span><span className="font-bold text-gray-800 md:ml-2">{doctor.location}</span></div>
                    <div className="pt-2 border-t border-gray-50">
                      <p className="text-xs text-gray-400 mb-1">Consultation Fee</p>
                      <div className="flex items-center text-[#00A1B0] font-black text-2xl"><FaMoneyBillWave className="mr-2 text-sm" /><span>{doctor.fees ?? doctor.videoFees ?? doctor.chatFees ? `₹${doctor.fees ?? doctor.videoFees ?? doctor.chatFees}` : "Contact"}</span></div>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button
                      className={`flex-1 md:flex-none p-3 border rounded-xl transition-all flex justify-center ${isFavorited ? 'bg-red-50 border-red-200 text-red-500 shadow-sm shadow-red-100' : 'border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-[#00A1B0]'}`}
                      onClick={handleToggleFavorite}
                      title={isFavorited ? "Remove from Favorites" : "Add to Favorites"}
                    >
                      <FaHeart />
                    </button>
                    <button className="flex-1 md:flex-none p-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-[#00A1B0] transition-all flex justify-center" title="Send Message"><FaRegComment /></button>
                    <button className="flex-1 md:flex-none p-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-[#00A1B0] transition-all flex justify-center"><FaVideo /></button>
                  </div>
                  <button onClick={handleBooking} className="w-full mt-4 bg-[#00A1B0] hover:bg-[#008f9c] text-white py-3.5 rounded-xl font-bold shadow-none hover:shadow-none transition-all active:scale-[0.98] text-sm" disabled={!doctor.available}>{doctor.available ? "Book Appointment Now" : "Currently Unavailable"}</button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
              <div className="border-b border-gray-200 mb-8">
                <nav className="-mb-px flex space-x-8">
                  <button onClick={() => setActiveTab('overview')} className={`py-4 px-1 font-bold text-sm transition-all border-b-2 ${activeTab === 'overview' ? 'border-[#00A1B0] text-[#00A1B0]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>Overview</button>
                  <button onClick={() => setActiveTab('reviews')} className={`py-4 px-1 font-bold text-sm transition-all border-b-2 ${activeTab === 'reviews' ? 'border-[#00A1B0] text-[#00A1B0]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>Reviews ({doctor.reviews})</button>
                </nav>
              </div>
              <div className="min-h-[300px]">
                {activeTab === 'overview' ? (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="mb-8"><h3 className="text-lg font-bold text-[#002f33] mb-4">About Doctor</h3><p className="text-gray-500 text-sm leading-relaxed mb-4">{doctor.about}</p></div>
                  </div>
                ) : (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300"><ReviewsList doctorId={doctor.id} /></div>
                )}
              </div>
            </div>

            <div className="mb-12">
              <h3 className="text-xl font-bold text-[#002f33] mb-6">Related Doctors</h3>
              {relatedDoctors.length === 0 ? (
                <div className="bg-white border border-gray-100 rounded-lg p-6 text-center text-gray-500">No related doctors found.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {relatedDoctors.map((d) => (
                    <div key={d.id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100 group cursor-pointer" onClick={() => handleRelatedDoctorClick(d.id)}>
                      <div className="relative h-48 overflow-hidden bg-gray-100">
                        <img src={getImageUrl(d.image ?? null)} alt={d.name} className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-110" onError={(e) => ((e.target as HTMLImageElement).src = "/doctor.png")} />
                        <div className="absolute top-2 left-2 bg-[#00A1B0] text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm flex items-center gap-1"><FaStar className="text-yellow-300" /> {d.rating}</div>
                      </div>
                      <div className="p-3">
                        <div className="flex justify-between items-center mb-1"><span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">{d.speciality}</span>{d.available ? (<span className="text-[10px] text-green-600 bg-green-50 px-1.5 rounded border border-green-100">● Available</span>) : (<span className="text-[10px] text-red-500 bg-red-50 px-1.5 rounded border border-red-100">● Unavailable</span>)}</div>
                        <h4 className="text-sm font-bold text-gray-800 mb-3 group-hover:text-[#00A1B0] transition-colors">{d.name}</h4>
                        <div className="flex items-center gap-2 text-[10px] text-gray-500 mb-3"><div className="flex items-center gap-0.5"><FaMapMarkerAlt /> {d.location}</div>{d.experience !== undefined && (<div className="flex items-center gap-0.5">● {d.experience} yrs</div>)}</div>
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100"><div><p className="text-[10px] text-gray-400">Consultation Fees</p><p className="text-[#00A1B0] font-bold text-sm">{d.fees ?? d.videoFees ?? d.chatFees ? `₹${d.fees ?? d.videoFees ?? d.chatFees}` : "Contact"}</p></div><button className="bg-white border border-[#00A1B0] text-[#00A1B0] hover:bg-[#00A1B0] hover:text-white text-xs px-3 py-1.5 rounded-full font-bold transition-all">Book Now</button></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>

      <Footer />
    </div>
  );
};

export default DoctorProfile;

