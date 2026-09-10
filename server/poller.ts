import { fetchNightscoutEntries, fetchNightscoutForecast } from "./utilities/api";
import { buildClientPayload, ClientPayload } from "./utilities/formatter";
import { NightscoutConfig } from "./utilities/types";

export type PayloadCallback = (payload: ClientPayload) => void;

export class NightscoutPoller {
    private config: NightscoutConfig | null = null;
    private timer: ReturnType<typeof setInterval> | null = null;
    private isPolling = false;
    private onPayload: PayloadCallback | null = null;

    constructor(onPayload?: PayloadCallback) {
        if (onPayload) this.onPayload = onPayload;
    }

    public start(config: NightscoutConfig) {
        this.config = config;
        this.stop();

        if (!config.url) {
            console.log("[Nightscout] URL not configured. Awaiting configuration...");
            return;
        }

        console.log(`[Nightscout] Starting poller: ${config.url} (${config.intervalMinutes}m interval)`);

        void this.poll();
        this.timer = setInterval(() => void this.poll(), config.intervalMinutes * 60 * 1000);
    }

    public stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    public restart(config: NightscoutConfig) {
        this.stop();
        this.start(config);
    }

    public async poll() {
        if (this.isPolling || !this.config?.url) return;

        this.isPolling = true;
        try {
            const [entries, forecast] = await Promise.all([
                fetchNightscoutEntries(this.config, 36),
                fetchNightscoutForecast(this.config),
            ]);

            if (entries.length > 0 && this.onPayload) {
                const payload = buildClientPayload(entries, forecast, this.config.units);
                this.onPayload(payload);
            }
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            console.error(`[Nightscout] Fetch error: ${msg}`);
        } finally {
            this.isPolling = false;
        }
    }
}