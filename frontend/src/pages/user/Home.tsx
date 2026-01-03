import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '../../components/common/NavBar';
import Footer from '../../components/common/Footer';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import doctorService from '../../services/doctorService';
import { API_BASE_URL } from '../../utils/constants';

import { FaUserMd, FaBrain, FaBone, FaHeartbeat, FaTooth, FaCalendarCheck, FaCheck, FaHandHoldingMedical, FaClock, FaVials, FaShieldAlt } from 'react-icons/fa';

// Register ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

const specialities = [
  { label: 'Urology', icon: <FaUserMd className="w-8 h-8 text-[#00A1B0]" /> },
  { label: 'Neurology', icon: <FaBrain className="w-8 h-8 text-[#00A1B0]" /> },
  { label: 'Orthopaedic', icon: <FaBone className="w-8 h-8 text-[#00A1B0]" /> },
  { label: 'Cardiologist', icon: <FaHeartbeat className="w-8 h-8 text-[#00A1B0]" /> },
  { label: 'Dentist', icon: <FaTooth className="w-8 h-8 text-[#00A1B0]" /> },
];

const whyChoose = [
  { icon: <FaHandHoldingMedical className="w-8 h-8 text-[#00A1B0]" />, title: 'Convenient Access', desc: 'Instant Medical Care' },
  { icon: <FaUserMd className="w-8 h-8 text-[#00A1B0]" />, title: 'Expert Specialists', desc: 'Top Doctors Online' },
  { icon: <FaClock className="w-8 h-8 text-[#00A1B0]" />, title: 'Time & Cost Savings', desc: 'Efficient Consultations' },
  { icon: <FaVials className="w-8 h-8 text-[#00A1B0]" />, title: 'Personalized Treatment', desc: 'Tailored Healthcare' },
  { icon: <FaShieldAlt className="w-8 h-8 text-[#00A1B0]" />, title: 'Secure & Private', desc: 'Safe Telemedicine' },
];

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [latestDoctors, setLatestDoctors] = useState<any[]>([]);
  const [totalDoctors, setTotalDoctors] = useState<number>(0);
  const doctorCountLabel = totalDoctors > 0 ? `${totalDoctors}+` : "—";

  useEffect(() => {
    // Hero Animations - Smooth & Elegant
    gsap.fromTo('.hero-content',
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.2, ease: 'power3.out' }
    );
    gsap.fromTo('.hero-search',
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.2, delay: 0.2, ease: 'power3.out' }
    );

    // Section 2: What are you looking for - Gentle Pop
    gsap.fromTo('.promo-card',
      { scale: 0.95, opacity: 0, y: 20 },
      {
        scale: 1, opacity: 1, y: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: {
          trigger: '.promo-card',
          start: 'top 85%',
        }
      }
    );

    // Section 3: Specialities - Smooth Stagger
    gsap.fromTo('.speciality-item',
      { y: 40, opacity: 0 },
      {
        y: 0, opacity: 1, duration: 1, stagger: 0.1, ease: 'power3.out',
        scrollTrigger: {
          trigger: '.specialities-section',
          start: 'top 80%',
        }
      }
    );

    // Section 4: Doctors - Luxurious Fade Up
    gsap.fromTo('.doctor-card-home',
      { y: 50, opacity: 0 },
      {
        y: 0, opacity: 1, duration: 1.2, stagger: 0.15, ease: 'power3.out',
        scrollTrigger: {
          trigger: '.doctors-section',
          start: 'top 75%',
        }
      }
    );

    // Section 5: Info Section - Clean Rise
    gsap.fromTo('.info-text',
      { y: 40, opacity: 0 },
      {
        y: 0, opacity: 1, duration: 1.2, ease: 'power3.out',
        scrollTrigger: {
          trigger: '.info-section',
          start: 'top 75%',
        }
      }
    );
    gsap.fromTo('.info-image',
      { y: 40, opacity: 0 },
      {
        y: 0, opacity: 1, duration: 1.2, delay: 0.2, ease: 'power3.out',
        scrollTrigger: {
          trigger: '.info-section',
          start: 'top 75%',
        }
      }
    );

    // Section 6: Why Choose - Crisp Reveal
    gsap.fromTo('.why-choose-item',
      { y: 30, opacity: 0 },
      {
        y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power2.out',
        scrollTrigger: {
          trigger: '.why-choose-section',
          start: 'top 80%',
        }
      }
    );

    // Section 7: Banner CTA - Grand Reveal
    gsap.fromTo('.banner-cta',
      { y: 60, opacity: 0 },
      {
        y: 0, opacity: 1, duration: 1.5, ease: 'expo.out',
        scrollTrigger: {
          trigger: '.banner-cta',
          start: 'top 85%',
        }
      }
    );
    gsap.fromTo('.banner-doc-img',
      { y: 100, opacity: 0, scale: 0.9 },
      {
        y: 0, opacity: 1, scale: 1, duration: 1.5, delay: 0.3, ease: 'power4.out',
        scrollTrigger: {
          trigger: '.banner-cta',
          start: 'top 85%',
        }
      }
    );

    const fetchLatestDoctors = async () => {
      try {
        const result = await doctorService.getAllDoctors({ page: 1, limit: 4 });
        const list = result?.data?.doctors ?? result?.doctors ?? [];
        const total = result?.data?.total ?? result?.total ?? 0;
        setLatestDoctors(Array.isArray(list) ? list : []);
        setTotalDoctors(Number.isFinite(total) ? total : 0);
      } catch (err) {
        console.warn('Failed to load latest doctors', err);
        setLatestDoctors([]);
        setTotalDoctors(0);
      }
    };

    fetchLatestDoctors();

  }, []);

  const getImageUrl = (imagePath: string | null | undefined) => {
    if (!imagePath) return '/doctor.png';
    if (imagePath.startsWith('http')) return imagePath;
    const cleanPath = imagePath.replace(/\\/g, '/');
    return `${API_BASE_URL}/${cleanPath}`;
  };

  const statImageUrl1 = getImageUrl(latestDoctors?.[0]?.image);
  const statImageUrl2 = getImageUrl(latestDoctors?.[1]?.image);

  return (
    <div className="bg-gray-50 min-h-screen font-sans overflow-x-hidden">
      <NavBar />

      {/* Hero / Search Section */}
      {/* Hero / Search Section - Architectural Split */}
      <section className="relative bg-white pt-16 lg:pt-20 pb-20 lg:pb-28 px-4 min-h-[600px] flex items-center overflow-hidden">
        {/* Right Side Slanted Panel - Light & Fresh */}
        <div className="absolute top-0 right-0 lg:right-[-10%] w-full lg:w-[55%] h-full bg-[#effcfd] lg:-skew-x-12 z-0 transform origin-top-right transition-all duration-700"></div>

        {/* Abstract Circle Accents */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-[#00A1B0]/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute bottom-10 right-[40%] w-48 h-48 bg-[#00A1B0]/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center relative z-10">

          {/* Left Column: Content */}
          <div className="text-center lg:text-left hero-content flex flex-col items-center lg:items-start order-1 lg:order-1">
            <div className="flex items-center gap-2 mb-4 lg:mb-6">
              <span className="w-8 lg:w-12 h-1 bg-[#00A1B0]"></span>
              <span className="text-[#00A1B0] font-bold uppercase tracking-widest text-xs lg:text-sm">Health First</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-gray-900 mb-6 lg:mb-8 leading-tight">
              Your Health, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00A1B0] to-[#008f9c]">
                Our Promise.
              </span>
            </h1>
            <p className="text-gray-500 mb-8 lg:mb-12 text-lg lg:text-xl font-light leading-relaxed max-w-lg mx-auto lg:mx-0">
              Experience the future of healthcare. Instant appointments, verified specialists, and 24/7 support.
            </p>

            {/* Hero CTA tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2 lg:mt-6 w-full max-w-xl mx-auto lg:mx-0">
              <div className="p-4 rounded-2xl border border-gray-100 shadow-sm bg-white flex items-center gap-3 text-left">
                <div className="w-10 h-10 shrink-0 rounded-full bg-[#00A1B0]/10 flex items-center justify-center text-[#00A1B0] font-bold">1</div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Browse verified doctors</p>
                  <p className="text-xs text-gray-500">Choose by specialty and experience.</p>
                </div>
              </div>
              <div className="p-4 rounded-2xl border border-gray-100 shadow-sm bg-white flex items-center gap-3 text-left">
                <div className="w-10 h-10 shrink-0 rounded-full bg-[#00A1B0]/10 flex items-center justify-center text-[#00A1B0] font-bold">2</div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Book in minutes</p>
                  <p className="text-xs text-gray-500">Instant scheduling and reminders.</p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap justify-center lg:justify-start gap-4 text-sm font-medium w-full">
              <button
                className="flex-1 sm:flex-none px-6 py-3.5 bg-[#00A1B0] text-white rounded-xl font-bold shadow-md hover:bg-[#008f9c] transition-all"
                onClick={() => navigate('/doctors')}
              >
                Explore Doctors
              </button>

            </div>
          </div>

          {/* Right Column: Image overlapping background */}
          <div className="relative h-full flex justify-center lg:justify-start hero-image order-2 lg:order-2 mt-8 lg:mt-0 perspective-1000">
            <div className="relative z-10 w-full max-w-lg lg:-ml-12 group" style={{ transformStyle: 'preserve-3d' }}>
              {/* 3D Layered background elements */}
              <div
                className="absolute inset-0 bg-gradient-to-br from-[#00A1B0]/20 to-transparent rounded-3xl blur-2xl transition-transform duration-500 group-hover:scale-110"
                style={{ transform: 'translateZ(-80px)' }}
              ></div>

              {/* Geometric Shapes behind doctor - 3D positioned */}
              <div
                className="absolute top-10 right-10 w-20 h-20 border-4 border-[#00A1B0]/20 rounded-full animate-pulse-slow transition-transform duration-500 group-hover:rotate-45"
                style={{ transform: 'translateZ(-40px)' }}
              ></div>
              <div
                className="absolute bottom-20 left-10 w-16 h-16 bg-[#00A1B0] rounded-full opacity-20 blur-xl transition-transform duration-500"
                style={{ transform: 'translateZ(-60px)' }}
              ></div>
              <div
                className="absolute top-1/2 right-0 w-24 h-24 bg-gradient-to-br from-[#00A1B0]/10 to-[#00A1B0]/5 rounded-full blur-lg transition-transform duration-500"
                style={{ transform: 'translateZ(-30px) translateY(-50%)' }}
              ></div>

              {/* Main Doctor Image with 3D Transform */}
              <div
                className="relative transition-all duration-500 ease-out group-hover:scale-[1.02]"
                style={{
                  transform: 'rotateY(-5deg) rotateX(2deg)',
                  transformStyle: 'preserve-3d'
                }}
              >
                <img
                  src="/doctor.png"
                  alt="Doctor"
                  className="relative z-10 w-full h-auto object-contain drop-shadow-2xl transition-all duration-500 group-hover:drop-shadow-[0_35px_60px_rgba(0,161,176,0.3)]"
                  style={{ transform: 'translateZ(40px)' }}
                />

                {/* Shadow layer for depth */}
                <div
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-8 bg-black/10 rounded-full blur-xl transition-all duration-500 group-hover:w-[90%] group-hover:blur-2xl"
                  style={{ transform: 'translateZ(-20px) rotateX(90deg)' }}
                ></div>
              </div>

              {/* Stats Card - Floating visually between backgrounds with 3D effect */}
              <div
                className="absolute bottom-10 sm:bottom-20 left-0 sm:left-[-10px] lg:left-[-40px] bg-white p-4 sm:p-5 rounded-2xl shadow-xl flex flex-col gap-1 z-20 animate-bounce-slow max-w-[140px] lg:max-w-[160px] transition-all duration-500 hover:shadow-2xl hover:scale-105"
                style={{ transform: 'translateZ(60px) rotateY(5deg)' }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex -space-x-2">
                    <img
                      src={statImageUrl1}
                      alt="Doctor"
                      className="w-6 h-6 lg:w-7 lg:h-7 rounded-full border border-white object-cover shadow-sm"
                      onError={(e) => ((e.target as HTMLImageElement).src = '/doctor.png')}
                    />
                    <img
                      src={statImageUrl2}
                      alt="Doctor"
                      className="w-6 h-6 lg:w-7 lg:h-7 rounded-full border border-white object-cover shadow-sm"
                      onError={(e) => ((e.target as HTMLImageElement).src = '/doctor.png')}
                    />
                  </div>
                  <span className="text-xs font-bold text-gray-800">{doctorCountLabel}</span>
                </div>
                <p className="text-[10px] sm:text-xs text-gray-500 leading-tight">Expert doctors ready to help you.</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* What are you looking for */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">What are you looking for?</h2>
          </div>
          <div className="flex justify-center">
            <div
              className="bg-[#00A1B0] rounded-xl p-10 w-72 h-80 flex flex-col items-center justify-center relative shadow-xl hover:shadow-2xl transition-transform hover:-translate-y-1 cursor-pointer promo-card"
              onClick={() => navigate('/doctors')}
            >
              {/* Checkmark Badge */}
              <div className="absolute top-6 right-6 bg-white rounded-full p-1.5 shadow-sm">
                <FaCheck className="text-[#00A1B0] w-4 h-4" />
              </div>

              {/* Icon */}
              <div className="mb-6 relative">
                <FaCalendarCheck className="text-white w-20 h-20" />
              </div>

              <h3 className="text-2xl font-bold text-white text-center">Book Appointment</h3>
            </div>
          </div>
        </div>
      </section>

      {/* Clinic and Specialities */}
      <section className="py-20 bg-[#f9f9f9] specialities-section">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4"> Specialities</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
          </div>

          <div className="flex flex-wrap justify-center gap-8">
            {specialities.map((spec) => (
              <div key={spec.label} className="bg-white rounded-full shadow-lg p-6 flex flex-col items-center justify-center w-40 h-40 hover:shadow-xl transition-all transform hover:-translate-y-1 cursor-pointer border border-gray-100 speciality-item">
                {/* Icons */}
                <div className="w-16 h-16 mb-3 p-3 bg-gray-50 rounded-full flex items-center justify-center">
                  {spec.icon}
                </div>
                <p className="font-semibold text-gray-700 text-sm">{spec.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Book Our Doctor */}
      <section className="py-20 bg-white doctors-section">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Book Our Doctor</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">Discover the latest verified doctors.</p>
          </div>

          {latestDoctors.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-xl p-6 text-center text-gray-500">
              No doctors available right now.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
              {latestDoctors.slice(0, 4).map((doctor) => {
                const id = (doctor as any)?.id || (doctor as any)?._id || (doctor as any)?.customId;
                const rating = Math.round(doctor?.rating ?? doctor?.ratingAvg ?? 0);
                const reviews = doctor?.reviews ?? doctor?.ratingCount ?? 0;
                const fees = doctor?.fees ?? doctor?.VideoFees ?? doctor?.videoFees ?? doctor?.ChatFees ?? doctor?.chatFees;
                return (
                  <div
                    key={id || doctor?.name}
                    className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 group doctor-card-home"
                  >
                    <div className="relative h-40 sm:h-64 overflow-hidden bg-gray-100">
                      <img
                        src={getImageUrl(doctor?.image)}
                        alt={doctor?.name}
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => ((e.target as HTMLImageElement).src = "/doctor.png")}
                      />
                      <button className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm text-gray-400 hover:text-red-500 transition-colors hover:bg-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                      </button>
                    </div>
                    <div className="p-3 md:p-5">
                      <h3 className="font-bold text-sm md:text-lg mb-0.5 md:mb-1 truncate">{doctor?.name}</h3>
                      <p className="text-[10px] md:text-xs text-gray-500 mb-2 md:mb-3 truncate">
                        {doctor?.speciality || doctor?.specialty || 'Specialist'}
                      </p>

                      <div className="flex items-center gap-0.5 md:gap-1 mb-3">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 md:h-4 md:w-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300 fill-current'}`} viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        ))}
                        <span className="text-[10px] text-gray-400 ml-1">({reviews})</span>
                      </div>

                      <ul className="space-y-1.5 mb-4 border-t border-gray-50 pt-3 hidden sm:block">
                        <li className="flex items-center text-xs text-gray-600">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-2 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          <span className="truncate">{doctor?.location ?? 'Kerala, India'}</span>
                        </li>
                        <li className="flex items-center text-xs text-gray-600">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-2 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          <span className="truncate">{doctor?.experience ?? doctor?.experienceYears ?? 0} yrs Exp</span>
                        </li>
                      </ul>

                      <div className="flex flex-col gap-2">
                        <p className="font-bold text-[#00A1B0] text-sm mb-1">{fees ? `₹${fees}` : 'N/A'}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <button
                            className="px-2 py-1.5 border border-[#00A1B0] text-[#00A1B0] rounded-md text-[10px] md:text-xs font-semibold hover:bg-[#00A1B0]/10 transition-colors"
                            onClick={() => navigate(`/doctors/${id}`)}
                          >
                            View Profile
                          </button>
                          <button
                            className="px-2 py-1.5 bg-[#00A1B0] text-white rounded-md text-[10px] md:text-xs font-semibold hover:bg-[#008f9c] transition-colors shadow"
                            onClick={() => navigate(`/booking/${id}`)}
                          >
                            Book Now
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Info Section - Placeholder replacement */}
      <div className="max-w-6xl mx-auto my-20 px-4 info-section">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Text Section - Left */}
          <div className="order-1 info-text">
            <div className="inline-block bg-[#00A1B0]/10 text-[#00A1B0] px-4 py-1.5 rounded-full text-sm font-semibold mb-6">
              About Takecare
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
              Good Services And Better <br /> Health By Our Specialists
            </h2>
            <p className="text-gray-500 mb-6 leading-relaxed">
              Great doctor if you need your family member to get effective immediate assistance, emergency treatment or a simple consultation.
            </p>
            <p className="text-gray-500 mb-8 leading-relaxed">
              The most well-known dummy text is the 'Lorem Ipsum', which is said to have originated in the 16th century. Lorem Ipsum is composed in a pseudo-Latin language which more or less corresponds to 'proper' Latin.
            </p>
            <button className="px-8 py-3 border border-[#00A1B0]/30 text-[#00A1B0] rounded-md font-medium hover:bg-[#00A1B0] hover:text-white transition-all shadow-sm">
              Read More
            </button>
          </div>

          {/* Image Section - Right */}
          <div className="order-2 relative flex justify-center md:justify-end info-image">
            <img src="/home about.png" className="w-full max-w-lg object-contain" alt="About Takecare" />
          </div>
        </div>
      </div>

      {/* Why Choose */}
      <div className="bg-[#f9f9f9] py-20 why-choose-section">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h3 className="text-xl font-bold mb-16 text-gray-900 tracking-wider">
            WHY CHOOSE TAKECARE?
            <div className="w-16 h-1 bg-[#00A1B0] mx-auto mt-4 rounded-full"></div>
          </h3>

          <div className="relative">
            <div className="hidden lg:block absolute top-[40px] left-0 right-0 h-0.5 bg-[#00A1B0]/30 -z-0"></div>
            <div className="flex flex-wrap justify-center gap-8 relative z-10">
              {whyChoose.map((item, index) => (
                <div key={index} className="flex flex-col items-center flex-1 min-w-[180px] max-w-[220px] why-choose-item">
                  <div className="w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center border border-gray-100 mb-6 group hover:scale-110 transition-transform cursor-pointer relative z-10">
                    {item.icon}
                  </div>
                  <h4 className="font-bold text-[#002f33] mb-2 text-center text-lg">{item.title}</h4>
                  <p className="text-sm text-gray-500 text-center">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Banner CTA */}
      <div className="max-w-6xl mx-auto py-16 lg:py-24 px-4 banner-cta">
        <div className="bg-[#00A1B0] rounded-[2rem] shadow-2xl flex flex-col md:flex-row relative min-h-[320px] md:min-h-[380px]">
          {/* Text Content */}
          <div className="p-8 md:p-12 lg:p-16 text-white md:w-1/2 flex flex-col justify-center z-10 text-center md:text-left">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-6 md:mb-8 leading-tight">
              Book Appointment <br className="hidden sm:block" />
              With 100+ Trusted Doctors
            </h2>
            <div className="flex justify-center md:justify-start">
              <button
                className="bg-white text-[#00A1B0] px-8 py-3 rounded-full font-bold shadow-lg hover:bg-gray-100 transition-all active:scale-95"
                onClick={() => navigate('/patient/register')}
              >
                Create account
              </button>
            </div>
          </div>

          {/* Doctor Image - Head overflows outside container */}
          <div className="md:w-1/2 relative flex items-end justify-center md:justify-end overflow-visible">
            <img
              src="/appointment-doc-img.png"
              alt="Doctor Banner"
              className="absolute bottom-0 right-0 md:right-4 lg:right-8 h-[350px] md:h-[450px] lg:h-[500px] w-auto object-contain object-bottom banner-doc-img"
              onError={(e) => (e.target as HTMLImageElement).src = '/doctor.png'}
            />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Home;


