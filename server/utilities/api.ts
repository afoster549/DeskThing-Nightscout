import { getSha1 } from "./crypto";
import { NightscoutConfig, NightscoutEntry } from "./types";

async function resolveAuth(rawToken?: string): Promise<{
    apiSecretHeader?: string;
    tokenParam?: string;
}> {
    if (!rawToken) {
        return {};
    }

    const trimmed = rawToken.trim();
    const isSha1 = /^[0-9a-f]{40}$/i.test(trimmed);

    if (isSha1) {
        return { apiSecretHeader: trimmed };
    }

    if (trimmed.includes("-")) {
        return { apiSecretHeader: trimmed, tokenParam: trimmed };
    }

    return { apiSecretHeader: await getSha1(trimmed) };
}

function buildEndpoint(url: string, path: string): URL {
    const base = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    return new URL(`${base.replace(/\/+$/, "")}${path}`);
}

async function parseNightscoutResponse<T>(response: Response): Promise<T[]> {
    if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
            throw new Error(`Unauthorized (HTTP ${response.status}): Check API Secret / Token`);
        }
        if (response.status === 404) {
            const origin = new URL(response.url).origin;
            throw new Error(`Not Found (HTTP 404): Check Nightscout URL (${origin})`);
        }
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
        throw new Error("Invalid response format from Nightscout (expected array)");
    }

    return data as T[];
}

export async function fetchNightscoutEntries(
    config: NightscoutConfig,
    count = 2
): Promise<NightscoutEntry[]> {
    if (!config.url) {
        throw new Error("No Nightscout URL configured");
    }

    const endpoint = buildEndpoint(config.url, "/api/v1/entries/sgv.json");
    endpoint.searchParams.set("count", String(count));

    const headers: Record<string, string> = {
        Accept: "application/json",
        "User-Agent": "DeskThing-Nightscout/0.11.4",
    };

    const { apiSecretHeader, tokenParam } = await resolveAuth(config.token);

    if (apiSecretHeader) {
        headers["api-secret"] = apiSecretHeader;
    }
    if (tokenParam) {
        endpoint.searchParams.set("token", tokenParam);
    }

    const response = await fetch(endpoint.toString(), {
        method: "GET",
        headers,
        signal: AbortSignal.timeout(10000),
    });

    return parseNightscoutResponse<NightscoutEntry>(response);
}