import { configure } from '@readable/config';
import { redisFromEnv, serviceConfig } from '@readable/service-config';
import { requiredEnv } from '@readable/utils/env';
import { monitorsFrom } from './monitors';

export const config = {
    ...serviceConfig('https://localhost:5177'),
    redis: redisFromEnv(),
    monitors: monitorsFrom(requiredEnv('MONITORS'))
} as const;

configure({
    redis: config.redis
});
