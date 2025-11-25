import React from 'react';

interface SpecialityIconProps {
  label: string;
  icon: string; 
  active?: boolean;
}

const SpecialityIcon: React.FC<SpecialityIconProps> = ({ label, icon, active }) => (
  <div className={`flex flex-col items-center mx-4 ${active ? 'text-teal-600' : 'text-gray-500'}`}>
    <img src={icon} alt={label} className={`w-12 h-12 mb-2 ${active ? 'scale-110' : ''}`} />
    <span className="text-sm font-medium">{label}</span>
  </div>
);

export default SpecialityIcon;
