import React from 'react';

interface InfoSectionProps {
  title: string;
  description: string;
}

const InfoSection: React.FC<InfoSectionProps> = ({ title, description }) => (
  <section className="flex flex-col md:flex-row items-center bg-white rounded-xl shadow p-8 my-10">
    <div className="flex-1">
      <h3 className="text-2xl font-semibold mb-4">{title}</h3>
      <p className="mb-4 text-gray-700">{description}</p>
      <button className="px-5 py-2 bg-teal-600 text-white rounded shadow hover:bg-teal-700">Read More</button>
    </div>
    <div className="flex-1 flex justify-center mt-6 md:mt-0">
      {/* Replace with your image */}
      <img src="/images/doctor_services.svg" className="w-56 h-44 object-contain" alt="Doctor Services" />
    </div>
  </section>
);

export default InfoSection;
