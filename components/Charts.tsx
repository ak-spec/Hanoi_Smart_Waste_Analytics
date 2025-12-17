import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { DistrictStats, WasteCategory } from '../types';

const COLORS = {
  Organic: '#4ade80', // green-400
  Recyclable: '#60a5fa', // blue-400
  Residual: '#f87171', // red-400
};

interface CompositionPieChartProps {
  data: { name: WasteCategory; value: number }[];
}

export const CompositionPieChart: React.FC<CompositionPieChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={5}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value: number) => `${value.toFixed(1)}%`}
          contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
        />
        <Legend verticalAlign="bottom" height={36}/>
      </PieChart>
    </ResponsiveContainer>
  );
};

interface DistrictBarChartProps {
  data: DistrictStats[];
}

export const DistrictCompositionChart: React.FC<DistrictBarChartProps> = ({ data }) => {
  const chartData = data.map(d => ({
    name: d.name,
    Organic: d.composition.Organic,
    Recyclable: d.composition.Recyclable,
    Residual: d.composition.Residual,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        layout="vertical"
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" domain={[0, 100]} unit="%" />
        <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
        <Tooltip 
           formatter={(value: number) => `${value.toFixed(1)}%`}
           contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
        />
        <Legend />
        <Bar dataKey="Organic" stackId="a" fill={COLORS.Organic} />
        <Bar dataKey="Recyclable" stackId="a" fill={COLORS.Recyclable} />
        <Bar dataKey="Residual" stackId="a" fill={COLORS.Residual} />
      </BarChart>
    </ResponsiveContainer>
  );
};
