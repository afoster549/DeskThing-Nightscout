import { DeskThing } from '@deskthing/server';
import { DESKTHING_EVENTS } from '@deskthing/types';
import { setupSettings } from "./settings";

const start = async () => {
	await setupSettings();

	const currentSettings = await DeskThing.getSettings();
	console.log("Loaded settings on startup:", currentSettings);
};

const stop = async () => {
	console.log('Stopped the server')
};

DeskThing.on(DESKTHING_EVENTS.SETTINGS, (data) => {
    const updatedSettings = data.payload;
    console.log("Settings changed:", updatedSettings);

    // Reconfigure polling or update API headers with updatedSettings
});

// Main Entrypoint of the server
DeskThing.on(DESKTHING_EVENTS.START, start);

// Main exit point of the server
DeskThing.on(DESKTHING_EVENTS.STOP, stop);