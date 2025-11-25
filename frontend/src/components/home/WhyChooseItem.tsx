import React from 'react';

interface WhyChooseItemProps {
  icon: string;
  title: string;
  desc: string;
}

const WhyChooseItem: React.FC<WhyChooseItemProps> = ({ icon, title, desc }) => (
  <div className="flex flex-col items-center p-6 bg-white border rounded-md shadow w-52">
    <img src={icon} alt={title} className="w-14 h-14 mb-2" />
    <h4 className="text-base font-bold mb-1">{title}</h4>
    <span className="text-xs text-gray-500 text-center">{desc}</span>
  </div>
);

export default WhyChooseItem;
