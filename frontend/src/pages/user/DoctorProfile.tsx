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
} from "react-icons/fa";
import NavBar from "../../components/common/NavBar";
import Footer from "../../components/common/Footer";
import doctorService from "../../services/doctorService";
import ReviewsList from "../../components/reviews/ReviewsList";

import { API_BASE_URL } from "../../utils/constants";

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


  useEffect(() => {
    if (!doctorId) {
      setErrorMsg("Doctor ID is missing in the route.");
      setLoading(false);
      return;
    }

    let mounted = true;
    const fetchDoctor = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        // Using existing frontend service you provided earlier
        const result = await doctorService.getDoctorById(doctorId);

        // The service returns an ApiResponse { success: true, data: {...} }
        // but it may also return { success: false, message: '...' }
        if (result?.success === false) {
          if (mounted) {
            setErrorMsg(result.message || "Failed to fetch doctor details");
            setDoctor(null);
          }
        } else {
          // If controller wrapped data under `.data`, handle both shapes:
          const payload = result?.data ?? result;
          if (mounted) {
            // Map fields defensively to our UI DTO
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
          setErrorMsg(
            err?.response?.data?.message || err?.message || "Failed to fetch doctor details"
          );
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

    return () => {
      mounted = false;
    };
  }, [doctorId]);

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
            <a href="/" className="hover:text-[#00A1B0]">
              Home
            </a>
            <span className="mx-2">/</span>
            <span className="text-[#00A1B0]">Doctors</span>
          </nav>
          <h1 className="text-4xl font-bold text-[#002f33]">Doctors</h1>
        </div>
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-10 -left-10 w-64 h-64 bg-white/20 rounded-full blur-2xl"></div>
          <div className="absolute top-10 right-10 w-96 h-96 bg-[#00A1B0]/5 rounded-full blur-3xl"></div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-[#00A1B0] transition-colors font-medium text-sm"
          >
            <FaArrowLeft /> Back to Doctors
          </button>
        </div>

        {/* Loading / Error states */}
        {loading ? (
          <div className="bg-white rounded-xl p-6 mb-8 text-center">Loading doctor details...</div>
        ) : errorMsg ? (
          <div className="bg-white rounded-xl p-6 mb-8 text-center text-red-600">
            {errorMsg}
          </div>
        ) : doctor ? (
          <>
            {/* Doctor Profile Widget Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Doctor Image */}
                <div className="w-full md:w-48 h-48 flex-shrink-0">
                  <img
                    src={getImageUrl(doctor.image)}
                    alt={doctor.name}
                    className="w-full h-full object-cover rounded-lg border border-gray-100 shadow-sm"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/doctor.png";
                    }}
                  />
                </div>

                {/* Doctor Info (Middle) */}
                <div className="flex-1 flex flex-col justify-center">
                  <h2 className="text-2xl font-bold text-gray-800 mb-1">{doctor.name}</h2>
                  <p className="text-gray-500 text-sm mb-2">
                    {Array.isArray(doctor.qualifications)
                      ? doctor.qualifications.join(", ")
                      : doctor.qualifications ?? ""}
                  </p>

                  <div className="flex items-center gap-2 mb-3">
                    <span className="bg-[#bffff8] text-[#00A1B0] p-1 rounded-full">
                      <FaStar className="w-3 h-3" />
                    </span>
                    <span className="text-gray-600 text-sm font-medium">
                      {doctor.speciality}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 mb-4">
                    <div className="flex text-yellow-400 text-xs">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <FaStar key={i} className={i < Math.round(doctor.rating ?? 0) ? "" : "text-gray-300"} />
                      ))}
                    </div>
                    <span className="text-gray-500 text-sm font-semibold">({doctor.reviews})</span>
                  </div>

                  <div className="flex items-center text-gray-500 text-sm mb-4">
                    <FaMapMarkerAlt className="mr-1 text-gray-400" />
                    <span>{doctor.location}</span>
                  </div>

                  <div className="flex gap-2">
                    {/* Example treatment tags (from qualifications or specialties) */}
                    {doctor.qualifications &&
                      (Array.isArray(doctor.qualifications)
                        ? doctor.qualifications.slice(0, 2)
                        : [doctor.qualifications]).map((q, idx) => (
                          <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-md border border-gray-200">
                            {q}
                          </span>
                        ))}
                  </div>
                </div>

                {/* Doctor Actions (Right) */}
                <div className="w-full md:w-64 flex flex-col justify-between border-l border-gray-100 md:pl-6 pt-4 md:pt-0">
                  <div className="space-y-3">
                    <div className="flex items-center text-gray-600 text-sm">
                      <FaRegComment className="mr-2 text-gray-400" />
                      <span>{doctor.reviews ?? 0} Feedback</span>
                    </div>
                    <div className="flex items-center text-gray-600 text-sm">
                      <FaMapMarkerAlt className="mr-2 text-gray-400" />
                      <span>{doctor.location}</span>
                    </div>
                    <div className="flex items-center text-gray-800 font-bold text-sm">
                      <FaMoneyBillWave className="mr-2 text-gray-400" />
                      <span>
                        {doctor.fees ?? doctor.videoFees ?? doctor.chatFees
                          ? `₹${doctor.fees ?? doctor.videoFees ?? doctor.chatFees}`
                          : "Contact"}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 md:mt-0">
                    <button
          
                      className="p-2 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 hover:text-[#00A1B0] transition-colors"
                      title="Send Message"
                    >
                      <FaRegComment />
                    </button>
                    <button className="p-2 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 hover:text-[#00A1B0] transition-colors">
                      <FaVideo />
                    </button>
                  </div>

                  <button
                    onClick={handleBooking}
                    className="w-full mt-3 bg-[#00A1B0] hover:bg-[#008f9c] text-white py-2.5 rounded-full font-bold shadow-md transition-all text-sm"
                    disabled={!doctor.available}
                  >
                    {doctor.available ? "Book Appointment" : "Currently Unavailable"}
                  </button>
                </div>
              </div>
            </div>

            {/* Tabs & Content Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
              <div className="border-b border-gray-200 mb-8">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`py-4 px-1 font-bold text-sm transition-all border-b-2 ${activeTab === 'overview'
                        ? 'border-[#00A1B0] text-[#00A1B0]'
                        : 'border-transparent text-gray-400 hover:text-gray-600'
                      }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab('reviews')}
                    className={`py-4 px-1 font-bold text-sm transition-all border-b-2 ${activeTab === 'reviews'
                        ? 'border-[#00A1B0] text-[#00A1B0]'
                        : 'border-transparent text-gray-400 hover:text-gray-600'
                      }`}
                  >
                    Reviews ({doctor.reviews})
                  </button>
                </nav>
              </div>

              <div className="min-h-[300px]">
                {activeTab === 'overview' ? (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="mb-8">
                      <h3 className="text-lg font-bold text-[#002f33] mb-4">About Doctor</h3>
                      <p className="text-gray-500 text-sm leading-relaxed mb-4">
                        {doctor.about}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <ReviewsList doctorId={doctor.id} />
                  </div>
                )}
              </div>

            </div>

            {/* Related Doctors */}
            <div className="mb-12">
              <h3 className="text-xl font-bold text-[#002f33] mb-6">Related Doctors</h3>
              {relatedDoctors.length === 0 ? (
                <div className="bg-white border border-gray-100 rounded-lg p-6 text-center text-gray-500">
                  No related doctors found.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {relatedDoctors.map((d) => (
                    <div
                      key={d.id}
                      className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100 group cursor-pointer"
                      onClick={() => handleRelatedDoctorClick(d.id)}
                    >
                      <div className="relative h-48 overflow-hidden bg-gray-100">
                        <img
                          src={getImageUrl(d.image ?? null)}
                          alt={d.name}
                          className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-110"
                          onError={(e) => ((e.target as HTMLImageElement).src = "/doctor.png")}
                        />
                        <div className="absolute top-2 left-2 bg-[#00A1B0] text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm flex items-center gap-1">
                          <FaStar className="text-yellow-300" /> {d.rating}
                        </div>
                      </div>
                      <div className="p-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">{d.speciality}</span>
                          {d.available ? (
                            <span className="text-[10px] text-green-600 bg-green-50 px-1.5 rounded border border-green-100">● Available</span>
                          ) : (
                            <span className="text-[10px] text-red-500 bg-red-50 px-1.5 rounded border border-red-100">● Unavailable</span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-gray-800 mb-3 group-hover:text-[#00A1B0] transition-colors">{d.name}</h4>

                        <div className="flex items-center gap-2 text-[10px] text-gray-500 mb-3">
                          <div className="flex items-center gap-0.5"><FaMapMarkerAlt /> {d.location}</div>
                          {d.experience !== undefined && (
                            <div className="flex items-center gap-0.5">● {d.experience} yrs</div>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          <div>
                            <p className="text-[10px] text-gray-400">Consultation Fees</p>
                            <p className="text-[#00A1B0] font-bold text-sm">
                              {d.fees ?? d.videoFees ?? d.chatFees ? `₹${d.fees ?? d.videoFees ?? d.chatFees}` : "Contact"}
                            </p>
                          </div>
                          <button className="bg-white border border-[#00A1B0] text-[#00A1B0] hover:bg-[#00A1B0] hover:text-white text-xs px-3 py-1.5 rounded-full font-bold transition-all">
                            Book Now
                          </button>
                        </div>
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
