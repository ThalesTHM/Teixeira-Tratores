import React from "react";
import { Card } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";


export const FinancePieChart = ({ billsToPay, billsToReceive }: { billsToPay: number; billsToReceive: number }) => {
  const data = [
    { name: "Contas a Pagar", value: billsToPay },
    { name: "Contas a Receber", value: billsToReceive },
  ];
  // Black, gray, white shades
  const PIE_COLORS = ["#111111", "#d1d5db"];
  return (
    <Card className="p-0 flex flex-col items-center w-full h-full bg-gray-100 border-none shadow-none">
      <h2 className="text-lg font-semibold mb-2 text-gray-900">Resumo de Contas</h2>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
          >
            {data.map((entry, idx) => (
              <Cell key={`cell-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Legend verticalAlign="bottom" height={36} wrapperStyle={{ color: '#111827' }} />
          <Tooltip wrapperStyle={{ background: '#fff', color: '#111827', border: '1px solid #d1d5db' }} />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
};

const PIE_COLORS = ["#a21caf", "#eab308", "#db2777"];

export const EntityPieChart = ({ clients, projects, suppliers }: { clients: number; projects: number; suppliers: number }) => {
  const data = [
    { name: "Clientes", value: clients },
    { name: "Projetos", value: projects },
    { name: "Fornecedores", value: suppliers },
  ];
  // Black, gray, white shades
  const PIE_COLORS = ["#111111", "#6b7280", "#d1d5db"]; // black, gray-500, gray-300
  return (
    <Card className="p-0 flex flex-col items-center w-full h-full bg-gray-100 border-none shadow-none">
      <h2 className="text-lg font-semibold mb-2 text-gray-900">Distribuição de Entidades</h2>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
          >
            {data.map((entry, idx) => (
              <Cell key={`cell-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Legend verticalAlign="bottom" height={36} wrapperStyle={{ color: '#111827' }} />
          <Tooltip wrapperStyle={{ background: '#fff', color: '#111827', border: '1px solid #d1d5db' }} />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
};
