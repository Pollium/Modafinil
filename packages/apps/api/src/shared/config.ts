import { configure } from '@readable/config';
import { redisFromEnv, serviceConfig } from '@readable/service-config';

export const config = {
    ...serviceConfig('https://localhost:5177'),
    redis: redisFromEnv()
} as const;

configure({
    redis: config.redis
});
