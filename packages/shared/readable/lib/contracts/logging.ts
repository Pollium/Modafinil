export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

export type LogContext = Record<string, unknown>;

export interface LoggerOptions{
    level: LogLevel;
    pretty: boolean;
}
