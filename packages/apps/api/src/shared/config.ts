import {
    configure,
    redisFromEnv,
    serviceConfig,
    optionalEnv,
    requiredEnv
} from '@pollium/readable/app/config';
import { monitorsFrom } from './monitors';
import { probeTimeoutFrom } from './probe-timeout';

export const config = {
    ...serviceConfig(''),
    redis: redisFromEnv(),
    monitors: monitorsFrom(requiredEnv('MONITORS')),
    probeTimeoutMs: probeTimeoutFrom(optionalEnv('PROBE_TIMEOUT_MS'))
} as const;

configure({
    name: 'modafinil',
    jwtSecret: null,
    redis: config.redis,
    storage: null
});
