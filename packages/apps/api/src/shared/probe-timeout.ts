import { ConfigError } from '@pollium/readable/app/errors';

const DEFAULT_MS = 5000;
const MAX_MS = 2_147_483_647;

export const probeTimeoutFrom = (raw: string | undefined): number => {
    const ms = raw === undefined ? DEFAULT_MS : Number(raw);
    if(!Number.isInteger(ms) || ms < 1 || ms > MAX_MS){
        throw ConfigError.InvalidEnv(`PROBE_TIMEOUT_MS must be whole milliseconds from 1 to ${MAX_MS}`);
    }

    return ms;
};
