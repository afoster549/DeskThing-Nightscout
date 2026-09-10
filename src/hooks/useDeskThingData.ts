import { useState, useEffect, useRef } from "react";
import { DeskThing } from "@deskthing/client";
import { NightscoutPayload, NIGHTSCOUT_COLORS } from "../types/nightscout";

interface DeskThingDataEvent {
	type?: string;
	payload?: NightscoutPayload | { type?: string; payload?: NightscoutPayload };
	bg?: number;
}

const INITIAL_STATE: NightscoutPayload = {
	bg: 0.0,
	trendArrow: "-",
	delta: 0.0,
	statusText: "IN RANGE",
	statusColor: NIGHTSCOUT_COLORS.target,
	lastReadingTime: Date.now(),
	units: "mmol",
	dataPoints: [],
	forecastPoints: [],
};

export function useDeskThingData(): NightscoutPayload {
	const [data, setData] = useState<NightscoutPayload>(INITIAL_STATE);
	const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	useEffect(() => {
		const onData = (event: DeskThingDataEvent) => {
			if (!event) return;

			const rawPayload = event.payload ?? event;

			if (pingIntervalRef.current !== null) {
				clearInterval(pingIntervalRef.current);
				pingIntervalRef.current = null;
			}

			if (
				typeof rawPayload === "object" &&
				rawPayload !== null &&
				"type" in rawPayload &&
				rawPayload.type === "nightscout_data" &&
				"payload" in rawPayload
			) {
				setData(rawPayload.payload as NightscoutPayload);
			} else if (
				typeof rawPayload === "object" &&
				rawPayload !== null &&
				"bg" in rawPayload
			) {
				setData(rawPayload as NightscoutPayload);
			}
		};

		DeskThing.on("nightscout_data", onData);

		DeskThing.send({ type: "get_nightscout_data" });

		pingIntervalRef.current = setInterval(() => {
			console.log("Pinged Server")

			DeskThing.send({ type: "get_nightscout_data" });
		}, 1500);

		return () => {
			DeskThing.off("nightscout_data", onData);

			if (pingIntervalRef.current !== null) {
				clearInterval(pingIntervalRef.current);
				pingIntervalRef.current = null;
			}
		};
	}, []);

	return data;
}