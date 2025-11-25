import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

const data = [
  { month: "Jan", Male: 300, Female: 280, Children: 200 },
  { month: "Feb", Male: 250, Female: 320, Children: 180 },
  { month: "Mar", Male: 400, Female: 380, Children: 220 },
  { month: "Apr", Male: 350, Female: 400, Children: 250 },
  { month: "May", Male: 450, Female: 480, Children: 280 },
  { month: "Jun", Male: 500, Female: 520, Children: 300 },
  { month: "Jul", Male: 550, Female: 500, Children: 320 },
  { month: "Aug", Male: 500, Female: 580, Children: 350 },
  { month: "Sep", Male: 600, Female: 620, Children: 380 },
  { month: "Oct", Male: 550, Female: 600, Children: 400 },
  { month: "Nov", Male: 600, Female: 650, Children: 420 },
  { month: "Dec", Male: 550, Female: 680, Children: 450 },
];

const ChartCard: React.FC = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex justify-between items-center mb-4">
      <h3 className="font-semibold text-lg">Patients visit by Gender</h3>
      <select className="border rounded px-3 py-1 text-sm">
        <option>2020</option>
        <option>2021</option>
        <option>2022</option>
      </select>
    </div>
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data}>
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="Male" fill="#2b82f6" />
        <Bar dataKey="Female" fill="#10b981" />
        <Bar dataKey="Children" fill="#fbbf24" />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export default ChartCard;
