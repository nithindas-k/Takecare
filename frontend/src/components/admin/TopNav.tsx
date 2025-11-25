import React from "react";

const TopNav: React.FC = () => (
  <nav className="bg-primary text-white px-6 py-4 flex items-center justify-between shadow">
    <span className="text-2xl font-bold tracking-wide">TAKECARE</span>
    <div className="flex items-center gap-3">
      <button className="w-9 h-9 bg-white text-primary rounded-full flex items-center justify-center">🔔</button>
      <button className="w-9 h-9 bg-white text-primary rounded-full flex items-center justify-center">👤</button>
    </div>
  </nav>
);

export default TopNav;
