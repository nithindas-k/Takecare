// src/components/Doctor/DoctorNavbar.tsx
import React from "react";
import { FaUserCircle } from "react-icons/fa";

const DoctorNavbar: React.FC = () => {
  return (
    <nav className="bg-white shadow flex items-center px-8 py-3 justify-between">
      <div className="flex items-center gap-2">
        <img src="/logo.svg" alt="DOCCURE" className="w-36 h-12 object-contain" />
      </div>
      <div className="flex items-center gap-6">
        <FaUserCircle className="w-10 h-10 text-gray-400 cursor-pointer hover:text-teal-500 transition" />
      </div>
    </nav>
  );
};

export default DoctorNavbar;
