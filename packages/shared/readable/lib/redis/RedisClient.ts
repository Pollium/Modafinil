import { readableConfig } from '../config';
import { Redis, RedisOptions } from 'ioredis';

export const redisOptions = (): RedisOptions => {
    const { host, port } = readableConfig().redis;
    return { host, port };
};

export const createRedis = (): Redis => new Redis(redisOptions());
