import RuntimeError from '../errors/RuntimeError';
import BaseGateway from '../gateway/BaseGateway';
import BaseQueue from '../queues/BaseQueue';
import { ApiError } from '@modafinil/contracts/shared/http';
import { LogLevel } from '../contracts/logging';
import { eventBus } from '../events/EventBus';
import { Discovered, MountedController } from '../services/ModuleDiscovery';
import { logger } from '../utils/Logger';
import Fastify, { LogController, FastifyInstance, FastifyBaseLogger } from 'fastify';
import { DataSource } from 'typeorm';

export interface BuildOptions{
    queues?: boolean;
}

export interface ApplicationLog{
    level: string;
    pretty: boolean;
}

export interface ApplicationOptions{
    port: number;
    log: ApplicationLog;
    discover: () => Promise<Discovered>;
    createDataSource: (entities: Function[]) => DataSource;
    plugins?: (app: FastifyInstance) => Promise<void>;
    afterDatabase?: () => Promise<void>;
}

export default class Application{
    #app!: FastifyInstance;
    #dataSource?: DataSource;
    #queues: BaseQueue[] = [];
    #options: ApplicationOptions;

    constructor(options: ApplicationOptions){
        this.#options = options;
    }

    get dataSource(): DataSource | undefined{
        return this.#dataSource;
    }

    async build({ queues: startQueues = true }: BuildOptions = {}): Promise<FastifyInstance>{
        logger.configure({
            level: this.#options.log.level as LogLevel,
            pretty: this.#options.log.pretty
        });
        this.#app = Fastify({
            loggerInstance: logger.raw as FastifyBaseLogger,
            logController: new LogController({ disableRequestLogging: true })
        });

        if(this.#options.plugins) await this.#options.plugins(this.#app);

        const discovered = await this.#options.discover();

        this.#dataSource = this.#options.createDataSource(discovered.entities);
        await this.#dataSource.initialize();
        if(this.#options.afterDatabase) await this.#options.afterDatabase();

        this.#registerErrorHandler();
        this.#registerRequestLogging();
        await this.#mountControllers(discovered.controllers);
        this.#app.get('/health', async () => ({ status: 'ok' }));
        this.#mountGateways(discovered.gateways);
        if(startQueues) this.#startQueues(discovered.queues);

        return this.#app;
    }

    async start(){
        await this.build();
        await this.#app.listen({ port: this.#options.port, host: '0.0.0.0' });
    }

    async stop(){
        await this.#app.close();
        await Promise.all(this.#queues.map((queue) => queue.close()));
        await eventBus.close();
        await this.#dataSource?.destroy();
    }

    #registerErrorHandler(){
        this.#app.setErrorHandler((err, req, reply) => {
            const status = err instanceof RuntimeError ? err.statusCode : 500;
            const message = err instanceof Error ? err.message : 'Internal Server Error';

            if(status >= 500){
                logger.error(`${req.method} ${req.url}`, err, { scope: 'http', statusCode: status });
            }

            const payload: ApiError = { error: message };
            reply.status(status).send(payload);
        });
    }

    #registerRequestLogging(){
        this.#app.addHook('onResponse', (req, reply, done) => {
            logger.debug(`${req.method} ${req.url}`, {
                scope: 'http',
                statusCode: reply.statusCode,
                ms: Math.round(reply.elapsedTime)
            });
            done();
        });
    }

    async #mountControllers(controllers: MountedController[]){
        for(const { prefix, Controller } of controllers){
            await new Controller().register(this.#app, prefix);
        }
    }

    #mountGateways(gateways: Array<new () => BaseGateway>){
        for(const Gateway of gateways){
            new Gateway().register(this.#app);
        }
    }

    #startQueues(queues: Array<new () => BaseQueue>){
        for(const Queue of queues){
            const queue = new Queue();
            queue.startWorker();
            this.#queues.push(queue);
        }
    }
}
