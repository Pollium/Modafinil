import { configure } from '@readable/config';
import { redisFromEnv, serviceConfig } from '@readable/service-config';
import { optionalEnv, requiredEnv } from '@readable/utils/env';
import { monitorsFrom } from './monitors';
import { probeTimeoutFrom } from './probe-timeout';

export const config = {
    ...serviceConfig('https://localhost:5177'),
    redis: redisFromEnv(),
    monitors: monitorsFrom(requiredEnv('MONITORS')),
    probeTimeoutMs: probeTimeoutFrom(optionalEnv('PROBE_TIMEOUT_MS'))
} as const;

configure({
    redis: config.redis
});
