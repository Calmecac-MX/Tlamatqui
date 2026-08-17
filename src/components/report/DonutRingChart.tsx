import React from "react";

export interface DonutSegment {
  value: number;
  color: string;
  label: string;
}

interface DonutRingProps {
  segments: DonutSegment[];
  centerText: string;
  centerSubtext: string;
  size?: number;
  strokeWidth?: number;
  textClass?: string;
}

export const DonutRingChart: React.FC<DonutRingProps> = ({
  segments,
  centerText,
  centerSubtext,
  size = 180,
  strokeWidth = 18,
  textClass = "",
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const totalVal = segments.reduce((acc, s) => acc + Math.max(0, s.value), 0);
  const normalizedSegments = segments.map((s) => ({
    ...s,
    percent: totalVal > 0 ? (Math.max(0, s.value) / totalVal) * 100 : 0,
  }));

  let accumulatedPercent = 0;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="rgba(255, 255, 255, 0.05)"
          strokeWidth={strokeWidth}
        />
        {normalizedSegments.map((segment, idx) => {
          const strokeDasharray = `${(segment.percent * circumference) / 100} ${circumference}`;
          const strokeDashoffset = -((accumulatedPercent * circumference) / 100);
          accumulatedPercent += segment.percent;

          return (
            <circle
              key={idx}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke={segment.color}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
        <span className={`font-bold text-white tracking-tight ${textClass || "text-xl md:text-2xl"}`}>
          {centerText}
        </span>
        <span className="text-[10px] md:text-xs text-text-dim-theme mt-0.5">
          {centerSubtext}
        </span>
      </div>
    </div>
  );
};
