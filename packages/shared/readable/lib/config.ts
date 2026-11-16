import { ConfigError } from './errors/ConfigError';

export interface ReadableRedisConfig{
    host: string;
    port: number;
}

export interface ReadableDatabaseConfig{
    url: string;
    schema: string | undefined;
}

export interface ReadableConfig{
    redis: ReadableRedisConfig;
}

let current: ReadableConfig | undefined;

export const configure = (next: ReadableConfig) => {
    current = next;
};

export const readableConfig = (): ReadableConfig => {
    if(!current) throw ConfigError.MissingEnv('readable');
    return current;
};
