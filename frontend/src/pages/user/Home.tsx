import React from 'react';
import SearchInput from '../../components/common/SearchInput';
import SpecialityIcon from '../../components/home/SpecialityIcon';
import DoctorCard from '../../components/home/DoctorCard';
import InfoSection from '../../components/home/InfoSection';
import WhyChooseItem from '../../components/home/WhyChooseItem';
import BannerSection from '../../components/home/BannerSection';
import NavBar from '../../components/common/NavBar';
import Footer from '../../components/common/Footer';

// Sample data (replace image paths/icons with your assets)
const specialities = [
  { label: 'Urology', icon: '/icons/urology.svg', active: true },
  { label: 'Neurology', icon: '/icons/neurology.svg' },
  { label: 'Orthopaedic', icon: '/icons/orthopaedic.svg' },
  { label: 'Cardiologist', icon: '/icons/cardiologist.svg' },
  { label: 'Dentist', icon: '/icons/dentist.svg' },
];

const doctors = [
  {
    name: 'Juby Perrin',
    details: 'MDS - Periodontology and Oral Implantology, BDS',
    rating: 4.5,
    location: 'Florida, USA',
    availability: 'Fri, 22 Mar',
    priceRange: '₹300 - ₹1000',
    image: '/images/doctor1.jpg',
  },
  {
    name: 'Darren Elder',
    details: 'BDS, MDS - Oral & Maxillofacial Surgery',
    rating: 4.6,
    location: 'Newyork, USA',
    availability: 'Fri, 22 Mar',
    priceRange: '₹750 - ₹3000',
    image: '/images/doctor2.jpg',
  },
  {
    name: 'Deborah Angel',
    details: 'MBBS, MD - General Medicine, DNB - Cardiology',
    rating: 4.7,
    location: 'Georgia, USA',
    availability: 'Fri, 22 Mar',
    priceRange: '₹1100 - ₹2400',
    image: '/images/doctor3.jpg',
  },
];

const whyChoose = [
  { icon: '/icons/medical-care.svg', title: 'Convenient Access', desc: 'Instant Medical Care' },
  { icon: '/icons/top-doctor.svg', title: 'Expert Specialists', desc: 'Top Doctors Online' },
  { icon: '/icons/time-cost.svg', title: 'Time & Cost Savings', desc: 'Efficient Consultations' },
  { icon: '/icons/personalized.svg', title: 'Personalized Treatment', desc: 'Tailored Healthcare' },
  { icon: '/icons/secure.svg', title: 'Secure & Private', desc: 'Safe Telemedicine' },
];

const Home: React.FC = () => (
<div>
       <NavBar />
     <div className="min-h-screen bg-gray-50">
    {/* Search & Hero */}
    <div className="bg-white py-12 shadow">
      <div className="max-w-5xl mx-auto text-center px-4">
        <h1 className="text-3xl font-bold mb-2">Search Doctor, Make an Appointment</h1>
        <p className="text-teal-700 mb-4">Discover the best doctors</p>
        <SearchInput placeholder="Search Doctors" />
      </div>
    </div>

    {/* What are you looking for */}
    <div className="max-w-3xl mx-auto my-12 text-center">
      <h2 className="text-lg font-semibold mb-4">What are you looking for?</h2>
      <div className="flex justify-center">
        <div className="flex flex-col items-center">
          <img src="/icons/book-appointment.svg" alt="Book" className="w-20 h-20 mb-2"/>
          <p className="text-base font-medium">Book Appointment</p>
        </div>
      </div>
    </div>

    {/* Specialities */}
    <div className="max-w-5xl mx-auto">
      <h2 className="text-xl font-medium mb-6 text-center">Clinic and Specialities</h2>
      <p className="text-gray-500 mb-8 text-center">Lorem ipsum dolor sit amet, consectetur...</p>
      <div className="flex justify-center mb-12">
        {specialities.map((spec) => (
          <SpecialityIcon key={spec.label} {...spec} />
        ))}
      </div>
    </div>

    {/* Doctor Cards */}
    <div className="max-w-5xl mx-auto my-16">
      <h2 className="text-2xl font-semibold mb-6">Book Our Doctor</h2>
      <p className="mb-6 text-gray-600 max-w-2xl">Lorem ipsum is simply dummy text ...</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {doctors.map((doctor) => <DoctorCard key={doctor.name} doctor={doctor} />)}
      </div>
    </div>

    {/* Info Section */}
    <div className="max-w-5xl mx-auto">
      <InfoSection
        title="Good Services And Better Health By Our Specialists"
        description="Great doctor if you need your family member to get ... simple consultation."
      />
    </div>

    {/* Why Choose */}
    <div className="max-w-6xl mx-auto my-20">
      <h3 className="text-lg font-semibold mb-8 text-center">
        WHY CHOOSE MEDICAS?
      </h3>
      <div className="flex flex-wrap justify-center gap-6">
        {whyChoose.map((item) => (
          <WhyChooseItem key={item.title} {...item} />
        ))}
      </div>
    </div>

    {/* Banner CTA */}
    <div className="max-w-5xl mx-auto">
      <BannerSection
        title="Book Appointment With 100+ Trusted Doctors"
        buttonText="Create account"
        image="/images/banner-doctor.png"
      />
    </div>
  </div>
    <Footer />
</div>
);

export default Home;
