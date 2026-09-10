export type GlucoseUnit = "mg/dl" | "mmol/l";

export interface NightscoutEntry {
    _id: string;
    sgv: number;
    date: number;
    dateString: string;
    trend?: number;
    direction?: string;
    device?: string;
    type?: string;
    delta?: number;
    sysTime?: string;
}

export interface FormattedReading {
    sgvMgDl: number;
    sgvMmolL: number;
    displayValue: string;
    displayUnits: GlucoseUnit;
    direction: string;
    arrow: string;
    deltaMgDl?: number;
    deltaMmolL?: number;
    displayDelta?: string;
    timestamp: Date;
    ageMinutes: number;
    isStale: boolean;
    device?: string;
}

export interface NightscoutConfig {
    url: string;
    token: string;
    intervalMinutes: number;
    units: GlucoseUnit;
}