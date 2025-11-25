import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = ["#2b82f6", "#10b981", "#fbbf24", "#e5e7eb"];
const data = [
  { name: "Cardiology", value: 90 },
  { name: "Dentistry", value: 47 },
  { name: "Neurology", value: 78 },
  { name: "Urology", value: 34 },
];

const DepartmentDonut: React.FC = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex justify-between items-center mb-4">
      <h3 className="font-semibold text-lg">Patients by Department</h3>
      <select className="border rounded px-3 py-1 text-sm">
        <option>Today</option>
        <option>This Week</option>
        <option>This Month</option>
      </select>
    </div>
    <div className="flex items-center justify-center">
      <ResponsiveContainer width="80%" height={180}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            fill="#8884d8"
            label
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute text-center">
        <div className="text-xs text-gray-500">Total</div>
        <div className="text-xl font-bold">249</div>
      </div>
    </div>
  </div>
);

export default DepartmentDonut;
