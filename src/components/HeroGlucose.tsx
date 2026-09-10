import React from "react";
import { NightscoutPayload } from "../types/nightscout";

interface HeroGlucoseProps {
    data: NightscoutPayload;
}

export const HeroGlucose: React.FC<HeroGlucoseProps> = ({ data }) => {
    const formattedDelta = data.delta > 0 ? `+${data.delta}` : `${data.delta}`;
    const minutesAgo = Math.max(1, Math.round((Date.now() - data.lastReadingTime) / 60000));

    return (
        <div className="flex flex-col select-none">
            {/* Mobile-styled BG number + trend arrow */}
            <div className="flex items-baseline gap-4">
                <span
                    className="text-[108px] font-normal tracking-tight leading-none"
                    style={{
                        color: data.statusColor,
                        fontFamily: "-apple-system, BlinkMacSystemFont, 'Roboto', sans-serif"
                    }}
                >
                    {data.bg.toFixed(1)}
                </span>
                <span
                    className="text-6xl font-light leading-none"
                    style={{ color: data.statusColor }}
                >
                    {data.trendArrow}
                </span>
            </div>

            {/* Delta, status, and freshness line */}
            <div className="flex items-center gap-3 mt-2">
                <span className="text-xl font-medium text-neutral-200">
                    {formattedDelta}{" "}
                    <span className="text-xs uppercase font-normal text-neutral-500">
                        {data.units === "mmol" ? "mmol/L" : "mg/dL"}
                    </span>
                </span>

                <span
                    className="text-xs font-semibold uppercase px-2 py-0.5 rounded border"
                    style={{
                        borderColor: `${data.statusColor}40`,
                        backgroundColor: `${data.statusColor}15`,
                        color: data.statusColor,
                    }}
                >
                    {data.statusText}
                </span>

                <span className="text-neutral-600 font-bold text-xs">•</span>

                <span className="text-xs text-neutral-400 font-medium flex items-center gap-1.5">
                    <span
                        className="w-2 h-2 rounded-full inline-block"
                        style={{ backgroundColor: data.statusColor }}
                    />
                    {minutesAgo} min ago
                </span>
            </div>
        </div>
    );
};