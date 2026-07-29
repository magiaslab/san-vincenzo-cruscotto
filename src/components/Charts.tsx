"use client";

import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { CHART_COLORS, PA_PRIMARY } from "@/lib/constants";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
);

const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "bottom" as const,
      labels: { boxWidth: 12, font: { size: 11 } },
    },
  },
};

type SeriesProps = {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    color?: string;
  }>;
};

export function LineChart({ labels, datasets }: SeriesProps) {
  return (
    <div className="h-72 w-full">
      <Line
        options={{
          ...baseOptions,
          scales: {
            y: {
              ticks: {
                callback: (v) =>
                  typeof v === "number"
                    ? new Intl.NumberFormat("it-IT", {
                        notation: "compact",
                      }).format(v)
                    : v,
              },
            },
          },
        }}
        data={{
          labels,
          datasets: datasets.map((d, i) => ({
            label: d.label,
            data: d.data,
            borderColor: d.color ?? CHART_COLORS[i % CHART_COLORS.length],
            backgroundColor: `${d.color ?? CHART_COLORS[i % CHART_COLORS.length]}33`,
            tension: 0.25,
            fill: true,
            pointRadius: 2,
          })),
        }}
      />
    </div>
  );
}

export function BarChart({ labels, datasets }: SeriesProps) {
  return (
    <div className="h-72 w-full">
      <Bar
        options={{
          ...baseOptions,
          indexAxis: labels.length > 6 ? ("y" as const) : ("x" as const),
        }}
        data={{
          labels,
          datasets: datasets.map((d, i) => ({
            label: d.label,
            data: d.data,
            backgroundColor: d.color ?? CHART_COLORS[i % CHART_COLORS.length],
            borderRadius: 4,
          })),
        }}
      />
    </div>
  );
}

export function DoughnutChart({
  labels,
  values,
}: {
  labels: string[];
  values: number[];
}) {
  return (
    <div className="h-64 w-full">
      <Doughnut
        options={baseOptions}
        data={{
          labels,
          datasets: [
            {
              data: values,
              backgroundColor: labels.map(
                (_, i) => CHART_COLORS[i % CHART_COLORS.length],
              ),
              borderWidth: 1,
              borderColor: "#fff",
            },
          ],
        }}
      />
    </div>
  );
}

export { PA_PRIMARY };
