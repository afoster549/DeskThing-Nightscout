import { DeskThing } from "@deskthing/server";
import { AppSettings, SETTING_TYPES } from "@deskthing/types";

export const setupSettings = async () => {
	const nightscoutSettings: AppSettings = {
		nightscout_url: {
			id: "nightscout_url",
			label: "Nightscout URL",
			description: "The base URL of your Nightscout instance (e.g. https://mycgm.herokuapp.com)",
			type: SETTING_TYPES.STRING,
			value: "",
		},
		nightscout_token: {
			id: "nightscout_token",
			label: "API Secret / Access Token",
			description: "API secret (plain or SHA-1) or token for authentication",
			type: SETTING_TYPES.STRING,
			value: "",
		},
		update_interval: {
			id: "update_interval",
			label: "Update Interval (Minutes)",
			description: "How often to fetch new blood glucose readings",
			type: SETTING_TYPES.NUMBER,
			value: 5,
			min: 1,
			max: 60,
		},
		display_units: {
			id: "display_units",
			label: "BG Units",
			description: "Display units for blood glucose",
			type: SETTING_TYPES.SELECT,
			value: "mg/dl",
			options: [
				{ label: "mg/dL", value: "mg/dl" },
				{ label: "mmol/L", value: "mmol/l" },
			],
		},
	};

	await DeskThing.initSettings(nightscoutSettings);
};