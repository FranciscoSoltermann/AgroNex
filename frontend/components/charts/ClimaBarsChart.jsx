"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function ClimaBarsChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EFF6FF" />
        <XAxis
          dataKey="fecha"
          tick={{ fontSize: 11, fill: "#6B7280" }}
          axisLine={false}
          tickLine={false}
          dy={10}
        />
        <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
        <Tooltip
          cursor={{ fill: "#EFF6FF" }}
          contentStyle={{ borderRadius: "12px", border: "none", fontWeight: "bold" }}
        />
        <Bar dataKey="mm" name="Lluvia caida (mm)" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
}
