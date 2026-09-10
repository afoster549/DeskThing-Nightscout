import { fetchNightscoutEntries } from "./utilities/api";
import { formatReading } from "./utilities/formatter";
import { FormattedReading, NightscoutConfig } from "./utilities/types";

export type ReadingCallback = (reading: FormattedReading) => void;

export class NightscoutPoller {
    private config: NightscoutConfig | null = null;
    private timer: ReturnType<typeof setInterval> | null = null;
    private isPolling = false;
    private onReading: ReadingCallback | null = null;

    constructor(onReading?: ReadingCallback) {
        if (onReading) this.onReading = onReading;
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
            const entries = await fetchNightscoutEntries(this.config, 2);
            const formatted = formatReading(entries, this.config.units);
            if (formatted && this.onReading) {
                this.onReading(formatted);
            }
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            console.error(`[Nightscout] Fetch error: ${msg}`);
        } finally {
            this.isPolling = false;
        }
    }
}