import { FormattedReading, GlucoseUnit, NightscoutConfig, NightscoutEntry } from "./types";

export interface ClientPayload {
    bg: number;
    trendArrow: string;
    delta: number;
    statusText: "HIGH" | "IN RANGE" | "LOW" | "URGENT LOW";
    statusColor: string;
    lastReadingTime: number;
    units: "mmol" | "mgdl";
    dataPoints: { time: string; timestamp: number; value: number }[];
    forecastPoints: { time: string; value: number }[];
}

const DIRECTION_ARROWS: Record<string, string> = {
    DoubleUp: "↑↑",
    SingleUp: "↑",
    FortyFiveUp: "↗",
    Flat: "→",
    FortyFiveDown: "↘",
    SingleDown: "↓",
    DoubleDown: "↓↓",
    "NOT COMPUTABLE": "?",
    "RATE OUT OF RANGE": "⇕",
};

const MMOL_CONVERSION_FACTOR = 18.01559;

export function formatReading(entries: NightscoutEntry[], units: GlucoseUnit): FormattedReading | null {
    if (!entries || entries.length === 0) return null;

    const [latest, previous] = entries;
    const sgvMgDl = latest.sgv;
    const sgvMmolL = Number((sgvMgDl / MMOL_CONVERSION_FACTOR).toFixed(1));

    let deltaMgDl: number | undefined = latest.delta;
    if (deltaMgDl === undefined && previous?.sgv !== undefined) {
        deltaMgDl = latest.sgv - previous.sgv;
    }

    let deltaMmolL: number | undefined;
    let displayDelta: string | undefined;

    if (deltaMgDl !== undefined) {
        deltaMmolL = Number((deltaMgDl / MMOL_CONVERSION_FACTOR).toFixed(1));
        const sign = deltaMgDl > 0 ? "+" : "";
        displayDelta = units === "mmol/l"
            ? `${sign}${deltaMmolL.toFixed(1)} mmol/L`
            : `${sign}${Math.round(deltaMgDl)} mg/dL`;
    }

    const direction = latest.direction || "Flat";
    const arrow = DIRECTION_ARROWS[direction] || "→";
    const timestamp = new Date(latest.date);
    const ageMinutes = Math.max(0, Math.round((Date.now() - latest.date) / 60000));

    return {
        sgvMgDl,
        sgvMmolL,
        displayValue: units === "mmol/l" ? sgvMmolL.toFixed(1) : String(Math.round(sgvMgDl)),
        displayUnits: units,
        direction,
        arrow,
        deltaMgDl,
        deltaMmolL,
        displayDelta,
        timestamp,
        ageMinutes,
        isStale: ageMinutes >= 15,
        device: latest.device,
    };
}

function extractSettingValue<T>(setting: unknown, defaultValue: T): T {
    if (setting === undefined || setting === null) return defaultValue;
    if (typeof setting === "object" && "value" in setting) {
        const val = (setting as { value: unknown }).value;
        return val !== undefined && val !== null ? (val as T) : defaultValue;
    }
    return setting as T;
}

export function parseNightscoutConfig(settings: Record<string, unknown> | null | undefined): NightscoutConfig {
    if (!settings) {
        return { url: "", token: "", intervalMinutes: 5, units: "mg/dl" };
    }

    const rawUrl = extractSettingValue(settings.nightscout_url, "");
    const rawToken = extractSettingValue(settings.nightscout_token, "");
    const rawInterval = extractSettingValue(settings.update_interval, 5);
    const rawUnits = extractSettingValue<string>(settings.display_units, "mg/dl");

    return {
        url: String(rawUrl).trim().replace(/\/+$/, ""),
        token: String(rawToken).trim(),
        intervalMinutes: Math.max(1, Math.min(60, Number(rawInterval) || 5)),
        units: rawUnits === "mmol/l" ? "mmol/l" : "mg/dl",
    };
}

export function buildClientPayload(
    entries: NightscoutEntry[],
    rawForecast: number[],
    units: "mmol/l" | "mg/dl"
): ClientPayload {
    const isMmol = units === "mmol/l";
    const toUnit = (value: number) => (isMmol ? Number((value / 18.01559).toFixed(1)) : Math.round(value));

    const latest = entries[0];
    const prev = entries[1] || entries[0];
    const currentBg = toUnit(latest.sgv);

    const rawDelta = latest.delta !== undefined ? latest.delta : latest.sgv - prev.sgv;
    const delta = isMmol ? Number((rawDelta / 18.01559).toFixed(1)) : Math.round(rawDelta);

    const lowTarget = isMmol ? 4.0 : 70;
    const highTarget = isMmol ? 10.0 : 180;
    let statusText: "HIGH" | "IN RANGE" | "LOW" | "URGENT LOW" = "IN RANGE";
    let statusColor = "#22C55E";

    if (currentBg < (isMmol ? 3.0 : 55)) {
        statusText = "URGENT LOW";
        statusColor = "#EF4444";
    } else if (currentBg < lowTarget) {
        statusText = "LOW";
        statusColor = "#EF4444";
    } else if (currentBg > highTarget) {
        statusText = "HIGH";
        statusColor = "#FACC15";
    }

    const dataPoints = [...entries].reverse().map((entry) => {
        const date = new Date(entry.date);
        return {
            time: `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`,
            timestamp: entry.date,
            value: toUnit(entry.sgv),
        };
    });

    let forecastPoints: { time: string; value: number }[] = [];
    if (rawForecast.length > 0) {
        forecastPoints = rawForecast.map((value, idx) => {
            const d = new Date(latest.date + (idx + 1) * 5 * 60 * 1000);
            return {
                time: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
                value: toUnit(value),
            };
        });
    } else {
        const step = rawDelta;
        forecastPoints = [1, 2, 3, 4].map((multiplier) => {
            const proj = Math.max(36, latest.sgv + step * multiplier * 0.7);
            const d = new Date(latest.date + multiplier * 5 * 60 * 1000);
            return {
                time: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
                value: toUnit(proj),
            };
        });
    }

    return {
        bg: currentBg,
        trendArrow: DIRECTION_ARROWS[latest.direction || ""] || "→",
        delta,
        statusText,
        statusColor,
        lastReadingTime: latest.date,
        units: isMmol ? "mmol" : "mgdl",
        dataPoints,
        forecastPoints,
    };
}