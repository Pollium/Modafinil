import { LogContext, LoggerOptions } from '../contracts/logging';
import pino, { Logger as PinoLogger } from 'pino';

export class Logger{
    #pino: PinoLogger = pino({ level: 'info' });

    configure(options: LoggerOptions){
        this.#pino = pino({
            level: options.level,
            transport: options.pretty ? { target: 'pino-pretty' } : undefined
        });
    }

    debug(message: string, context?: LogContext){
        this.#pino.debug(context ?? {}, message);
    }

    error(message: string, error?: unknown, context?: LogContext){
        this.#pino.error({ ...context, err: error }, message);
    }

    get raw(): PinoLogger{
        return this.#pino;
    }
}

export const logger = new Logger();
