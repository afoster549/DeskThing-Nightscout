import { DeskThing } from "@deskthing/server";
import { DESKTHING_EVENTS } from "@deskthing/types";
import { setupSettings } from "./settings";
import { parseNightscoutConfig, ClientPayload } from "./utilities/formatter";
import { NightscoutPoller } from "./poller";

let latestPayload: ClientPayload | null = null;

const poller = new NightscoutPoller((payload: ClientPayload) => {
    latestPayload = payload;
    console.log(`[Nightscout] ${payload.bg} ${payload.units} ${payload.trendArrow} (Δ: ${payload.delta})`);

    DeskThing.send({
        type: "nightscout_data",
        payload,
    });
});

const start = async () => {
    await setupSettings();

    const currentSettings = await DeskThing.getSettings();
    console.log("Loaded settings on startup:", currentSettings);

    const config = parseNightscoutConfig(currentSettings);
    poller.start(config);
};

const stop = async () => {
    console.log("Stopping Nightscout server...");
    poller.stop();
};

DeskThing.on(DESKTHING_EVENTS.SETTINGS, (data) => {
    const updatedSettings = data.payload;
    console.log("Settings changed:", updatedSettings);

    const config = parseNightscoutConfig(updatedSettings);
    poller.restart(config);
});

DeskThing.on("get_nightscout_data", () => {
    console.log("1. Recived")

    if (latestPayload) {
        console.log("2. Sent")

        DeskThing.send({
            type: "nightscout_data",
            payload: latestPayload,
        });
    }
});

DeskThing.on("ping", () => {
    DeskThing.send({
        type: "server_status",
        payload: { ready: true }
    })
})

DeskThing.on(DESKTHING_EVENTS.START, start);
DeskThing.on(DESKTHING_EVENTS.STOP, stop);