"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

type SalesDataPoint = {
  month: string;
  totalSales: number;
};

const axisStyle = {
  stroke: "var(--muted-foreground)",
  fontSize: 12,
  tickLine: false,
  axisLine: false,
} as const;

export default function AdminOverviewCharts({
  salesData,
  xAxisLabel,
}: {
  salesData: SalesDataPoint[];
  xAxisLabel: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={salesData}>
        <XAxis
          dataKey="month"
          {...axisStyle}
          label={{
            value: xAxisLabel,
            position: "insideBottomRight",
            offset: -5,
            style: { fill: "var(--muted-foreground)", fontSize: 12 },
          }}
        />
        <YAxis
          {...axisStyle}
          tickFormatter={(value) => `PLN ${value}`}
        />
        <Bar
          dataKey="totalSales"
          fill="var(--chart-1)"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
