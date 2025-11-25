import React from 'react';
import Button from '../common/Button';

interface Doctor {
  name: string;
  details: string;
  rating: number;
  location: string;
  availability: string;
  priceRange: string;
  image: string;
}

interface DoctorCardProps {
  doctor: Doctor;
}

const DoctorCard: React.FC<DoctorCardProps> = ({ doctor }) => (
  <div className="bg-white rounded-lg shadow-md p-5 flex flex-col items-center">
    <img src={doctor.image} alt={doctor.name} className="w-20 h-20 rounded-full mb-3 border-4 border-teal-100 object-cover" />
    <h3 className="font-semibold text-lg">{doctor.name} <span className="ml-2 text-sm text-teal-400">✔</span></h3>
    <p className="text-xs text-gray-400 mb-1">{doctor.details}</p>
    <div className="flex items-center mb-1">
      <span className="text-yellow-400">★</span>
      <span className="ml-1 text-sm">{doctor.rating}</span>
    </div>
    <div className="text-xs text-gray-500 mb-2">{doctor.location}</div>
    <div className="text-xs mb-1">Available: {doctor.availability}</div>
    <div className="text-xs mb-2">Fee: {doctor.priceRange}</div>
    <div className="flex space-x-2 mt-auto">
      <Button variant="secondary">View Profile</Button>
      <Button>Book Now</Button>
    </div>
  </div>
);

export default DoctorCard;
