import React from "react";

interface StatCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, value, label }) => (
  <div className="bg-white rounded-lg shadow flex items-center p-6 gap-4">
    <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center text-primary text-2xl">{icon}</div>
    <div>
      <h3 className="text-2xl font-bold">{value}</h3>
      <p className="text-gray-500 text-sm">{label}</p>
    </div>
  </div>
);

export default StatCard;
