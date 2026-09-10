import { DeskThing } from "@deskthing/server";
import { DESKTHING_EVENTS } from "@deskthing/types";
import { setupSettings } from "./settings";
import { parseNightscoutConfig } from "./formatter";
import { NightscoutPoller } from "./poller";
import { FormattedReading } from "./utilities/types";

const poller = new NightscoutPoller((reading: FormattedReading) => {
    const deltaStr = reading.displayDelta ? ` (${reading.displayDelta})` : "";
    console.log(
        `[Nightscout] ${reading.displayValue} ${reading.displayUnits} ${reading.arrow}${deltaStr}`
    );
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

DeskThing.on(DESKTHING_EVENTS.START, start);
DeskThing.on(DESKTHING_EVENTS.STOP, stop);