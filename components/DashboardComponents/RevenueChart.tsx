import React from "react";
import type { RevenuePoint } from "../utils/dashboardHomeUtils";

const RevenueChart: React.FC<{ data: RevenuePoint[]; isLight: boolean }> = ({
  data,
  isLight,
}) => {
  const W = 500;
  const H = 160;
  const padX = 40;
  const padY = 12;
  const chartW = W - padX * 2;
  const chartH = H - padY * 2;
  const rawMax = Math.max(...data.map((d) => d.value), 1);
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawMax)));
  const max = Math.ceil(rawMax / magnitude) * magnitude;
  const toX = (i: number) =>
    padX + (data.length === 1 ? chartW / 2 : (i / (data.length - 1)) * chartW);
  const toY = (v: number) => padY + chartH - (v / max) * chartH;
  const points = data.map((d, i) => ({ x: toX(i), y: toY(d.value) }));
  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${H - padY} L ${points[0].x} ${H - padY} Z`;
  const stroke = "#9333ea";
  const labelColor = isLight ? "#374151" : "rgba(255,255,255,0.85)";
  const gridColor = isLight ? "rgba(147,51,234,0.1)" : "rgba(255,255,255,0.06)";
  const yTicks = [1, 2, 3, 4, 5].map((n) => Math.round((max / 5) * n));

  return (
    <svg viewBox={`0 0 ${W} ${H + 24}`} className="w-full h-full">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop
            offset="0%"
            stopColor={stroke}
            stopOpacity={isLight ? "0.15" : "0.3"}
          />
          <stop offset="100%" stopColor={stroke} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {yTicks.map((t) => (
        <line
          key={t}
          x1={padX}
          y1={toY(t)}
          x2={W - padX}
          y2={toY(t)}
          stroke={gridColor}
          strokeWidth="1"
        />
      ))}
      <path d={areaPath} fill="url(#areaGrad)" />
      <path
        d={linePath}
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill={stroke} />
      ))}
      {data.map((d, i) => (
        <text
          key={i}
          x={toX(i)}
          y={H + 16}
          textAnchor="middle"
          fontSize="10"
          fontWeight="600"
          fill={labelColor}
        >
          {d.label}
        </text>
      ))}
      {yTicks
        .filter((_, i) => i % 2 === 1)
        .map((t) => (
          <text
            key={t}
            x={padX - 6}
            y={toY(t) + 4}
            textAnchor="end"
            fontSize="9"
            fontWeight="600"
            fill={labelColor}
          >
            ${(t / 1000).toFixed(0)}k
          </text>
        ))}
    </svg>
  );
};

export default RevenueChart;
