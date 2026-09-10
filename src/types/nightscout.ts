export interface CGMReading {
    time: string;
    timestamp: number;
    value: number;
}

export interface ForecastPoint {
    time: string;
    value: number;
}

export interface NightscoutPayload {
    bg: number;
    trendArrow: string;
    delta: number;
    statusText: "HIGH" | "IN RANGE" | "LOW" | "URGENT LOW";
    statusColor: string;
    lastReadingTime: number;
    units: "mmol" | "mgdl";
    dataPoints: CGMReading[];
    forecastPoints: ForecastPoint[];
}

export const NIGHTSCOUT_COLORS = {
    high: "#FACC15",
    target: "#22C55E",
    low: "#EF4444",
    forecast: "#38BDF8",
    corridorFill: "rgba(34, 197, 94, 0.05)",
    gridLine: "rgba(255, 255, 255, 0.07)",
} as const;