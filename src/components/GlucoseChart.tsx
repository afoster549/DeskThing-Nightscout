import React, { useRef, useState, useLayoutEffect } from "react";
import { CGMReading, ForecastPoint, NIGHTSCOUT_COLORS } from "../types/nightscout";

interface GlucoseChartProps {
    dataPoints: CGMReading[];
    forecastPoints: ForecastPoint[];
    statusColor: string;
    units: "mmol" | "mgdl";
}

export const GlucoseChart: React.FC<GlucoseChartProps> = ({
    dataPoints,
    forecastPoints,
    statusColor,
    units,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 200 });

    useLayoutEffect(() => {
        if (!containerRef.current) return;

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                if (width > 0 && height > 0) {
                    setDimensions({
                        width: Math.round(width),
                        height: Math.round(height),
                    });
                }
            }
        });

        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    const { width, height } = dimensions;
    const padding = { top: 15, bottom: 25, left: 16, right: 38 };

    const isMmol = units === "mmol";
    const minValue = isMmol ? 2.0 : 40;
    const maxValue = isMmol ? 22.0 : 400;
    const targetLow = isMmol ? 4.0 : 70;
    const targetHigh = isMmol ? 10.0 : 180;

    const yTicks = isMmol ? [4, 6, 10, 14, 18, 22] : [70, 100, 180, 250, 300];

    const getY = (value: number) => {
        const clamped = Math.max(minValue, Math.min(maxValue, value));
        const usableHeight = height - padding.top - padding.bottom;
        return padding.top + usableHeight * (1 - (clamped - minValue) / (maxValue - minValue));
    };

    const totalPoints = Math.max(1, dataPoints.length + forecastPoints.length);
    const getX = (index: number) => {
        const usableWidth = width - padding.left - padding.right;
        return padding.left + (index / (totalPoints - 1)) * usableWidth;
    };

    const yLow = getY(targetLow);
    const yHigh = getY(targetHigh);
    const nowX = getX(dataPoints.length - 1);

    return (
        <div ref={containerRef} className="w-full h-full min-h-[140px] flex items-end overflow-hidden">
            <svg
                width={width}
                height={height}
                className="w-full h-full overflow-visible select-none"
            >
                <rect
                    x={padding.left}
                    y={yHigh}
                    width={Math.max(0, width - padding.left - padding.right)}
                    height={Math.max(0, yLow - yHigh)}
                    fill="rgba(34, 197, 94, 0.08)"
                />

                {yTicks.map((value) => {
                    const y = getY(value);
                    const isTarget = value === targetLow || value === targetHigh;
                    return (
                        <g key={`y-${value}`}>
                            <line
                                x1={padding.left}
                                y1={y}
                                x2={width - padding.right}
                                y2={y}
                                stroke={isTarget ? NIGHTSCOUT_COLORS.target : "rgba(255, 255, 255, 0.25)"}
                                strokeWidth={isTarget ? 1.5 : 0.8}
                                strokeDasharray={isTarget ? "4 3" : "3 4"}
                            />
                            <text
                                x={width - padding.right + 7}
                                y={y + 3.5}
                                fill={isTarget ? NIGHTSCOUT_COLORS.target : "rgba(255, 255, 255, 0.6)"}
                                fontSize="11"
                                fontFamily="-apple-system, BlinkMacSystemFont, 'Roboto', sans-serif"
                                fontWeight={isTarget ? "bold" : "normal"}
                            >
                                {value}
                            </text>
                        </g>
                    );
                })}

                {dataPoints.map((pt, i) => {
                    if (i % 4 !== 0 && i !== dataPoints.length - 1) return null;
                    const x = getX(i);
                    return (
                        <g key={`time-${i}`}>
                            <line
                                x1={x}
                                y1={padding.top}
                                x2={x}
                                y2={height - padding.bottom}
                                stroke="rgba(255, 255, 255, 0.18)"
                                strokeWidth="1"
                                strokeDasharray="3 4"
                            />
                            <text
                                x={x}
                                y={height - padding.bottom + 16}
                                fill="rgba(255, 255, 255, 0.5)"
                                fontSize="11"
                                textAnchor="middle"
                                fontFamily="-apple-system, BlinkMacSystemFont, 'Roboto', monospace"
                            >
                                {pt.time}
                            </text>
                        </g>
                    );
                })}

                {/* Current Time "Now" Dashed Line */}
                <line
                    x1={nowX}
                    y1={padding.top}
                    x2={nowX}
                    y2={height - padding.bottom}
                    stroke="rgba(255, 255, 255, 0.4)"
                    strokeWidth="1.2"
                    strokeDasharray="4 4"
                />

                {/* CGM Reading Scatter */}
                {dataPoints.map((pt, i) => {
                    const isLatest = i === dataPoints.length - 1;
                    const cx = getX(i);
                    const cy = getY(pt.value);

                    const dotColor =
                        pt.value < targetLow
                            ? NIGHTSCOUT_COLORS.low
                            : pt.value > targetHigh
                                ? NIGHTSCOUT_COLORS.high
                                : NIGHTSCOUT_COLORS.target;

                    return (
                        <g key={`pt-${i}`}>
                            {isLatest && (
                                <circle
                                    cx={cx}
                                    cy={cy}
                                    r="6"
                                    fill="none"
                                    stroke={statusColor}
                                    strokeWidth="2"
                                >
                                    <animate
                                        attributeName="r"
                                        values="6;15;6"
                                        dur="2.5s"
                                        repeatCount="indefinite"
                                    />
                                    <animate
                                        attributeName="opacity"
                                        values="0.8;0;0.8"
                                        dur="2.5s"
                                        repeatCount="indefinite"
                                    />
                                </circle>
                            )}
                            <circle
                                cx={cx}
                                cy={cy}
                                r={isLatest ? 5.5 : 3.5}
                                fill={dotColor}
                            />
                        </g>
                    );
                })}

                {/* Forecast Rings (Perfect Circles) */}
                {forecastPoints.map((pt, idx) => {
                    const cx = getX(dataPoints.length + idx);
                    const cy = getY(pt.value);
                    return (
                        <circle
                            key={`forecast-${idx}`}
                            cx={cx}
                            cy={cy}
                            r="3.5"
                            fill="none"
                            stroke={NIGHTSCOUT_COLORS.forecast}
                            strokeWidth="1.8"
                            opacity={1 - idx * 0.12}
                        />
                    );
                })}
            </svg>
        </div>
    );
};