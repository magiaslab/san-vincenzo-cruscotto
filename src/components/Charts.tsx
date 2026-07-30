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
    /** Colore unico o palette per barra. */
    color?: string | string[];
  }>;
};

export function LineChart({ labels, datasets }: SeriesProps) {
  return (
    <div className="h-64 w-full sm:h-72">
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
          datasets: datasets.map((d, i) => {
            const fallback = CHART_COLORS[i % CHART_COLORS.length];
            const stroke = Array.isArray(d.color) ? (d.color[0] ?? fallback) : (d.color ?? fallback);
            return {
              label: d.label,
              data: d.data,
              borderColor: stroke,
              backgroundColor: `${stroke}33`,
              tension: 0.25,
              fill: true,
              pointRadius: 2,
            };
          }),
        }}
      />
    </div>
  );
}

export function BarChart({
  labels,
  datasets,
  stacked = false,
}: SeriesProps & { stacked?: boolean }) {
  return (
    <div className="h-64 w-full sm:h-72">
      <Bar
        options={{
          ...baseOptions,
          indexAxis: !stacked && labels.length > 6 ? ("y" as const) : ("x" as const),
          scales: stacked
            ? {
                x: { stacked: true },
                y: { stacked: true, beginAtZero: true },
              }
            : undefined,
        }}
        data={{
          labels,
          datasets: datasets.map((d, i) => ({
            label: d.label,
            data: d.data,
            backgroundColor: d.color ?? CHART_COLORS[i % CHART_COLORS.length],
            borderRadius: stacked ? 0 : 4,
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
    <div className="h-56 w-full sm:h-64">
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
