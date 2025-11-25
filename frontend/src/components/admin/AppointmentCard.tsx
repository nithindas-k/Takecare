import React from "react";

interface Appointment {
  name: string;
  date: string;
  avatar: string;
}

interface AppointmentCardProps {
  appointments: Appointment[];
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({ appointments }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex justify-between items-center mb-4">
      <h3 className="font-semibold text-lg">Latest Appointment</h3>
      <span className="text-sm text-gray-500">{appointments.length} Patients</span>
    </div>
    <div className="space-y-3">
      {appointments.map((appt, idx) => (
        <div key={idx} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={appt.avatar} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
            <div>
              <p className="font-medium text-sm">{appt.name}</p>
              <p className="text-xs text-gray-500">{appt.date}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center">✓</button>
            <button className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center">✕</button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default AppointmentCard;
