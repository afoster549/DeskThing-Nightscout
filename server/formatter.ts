import { FormattedReading, GlucoseUnit, NightscoutConfig, NightscoutEntry } from "./utilities/types";

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