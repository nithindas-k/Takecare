import React from 'react';
import Button from '../common/Button';

interface BannerSectionProps {
  title: string;
  buttonText: string;
  image: string;
}

const BannerSection: React.FC<BannerSectionProps> = ({ title, buttonText, image }) => (
  <div className="bg-teal-600 rounded-lg flex flex-col md:flex-row items-center justify-between p-8 my-14">
    <div className="flex-1 mb-6 md:mb-0">
      <h2 className="text-2xl text-white mb-3 font-semibold">{title}</h2>
      <Button>{buttonText}</Button>
    </div>
    <img src={image} alt="Doctor" className="w-44 h-44 md:w-56 md:h-56 object-contain" />
  </div>
);

export default BannerSection;
