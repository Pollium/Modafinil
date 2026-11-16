import { redisOptions } from '../redis/RedisClient';
import { logger } from '../utils/Logger';
import { Queue, Worker, Job, JobSchedulerTemplateOptions } from 'bullmq';

const WORKER_STAGES = ['active', 'completed'] as const;

export default abstract class BaseQueue{
    abstract readonly name: string;
    protected abstract readonly everyMs: number;
    protected abstract readonly jobOptions: JobSchedulerTemplateOptions;

    #queue?: Queue;
    #worker?: Worker;

    abstract process(): Promise<void>;

    startWorker(){
        this.#worker ??= this.#traced(new Worker(this.name, () => this.process(), {
            connection: redisOptions()
        }));

        void this.#schedule();
    }

    async close(){
        await this.#worker?.close();
        await this.#queue?.close();
    }

    async #schedule(){
        await this.#connect().upsertJobScheduler(this.name, { every: this.everyMs }, {
            name: this.name,
            opts: this.jobOptions
        });

        this.#trace('schedule');
    }

    #connect(): Queue{
        this.#queue ??= new Queue(this.name, { connection: redisOptions() });

        return this.#queue;
    }

    #traced(worker: Worker): Worker{
        for(const stage of WORKER_STAGES){
            worker.on(stage, (job?: Job) => this.#trace(stage, job));
        }
        worker.on('failed', (job, error) => logger.error(`${this.name}::Failed`, error, {
            scope: 'queue.failed',
            jobId: job?.id
        }));

        return worker;
    }

    #trace(stage: string, job?: Job){
        logger.debug(this.name, {
            scope: `queue.${stage}`,
            jobId: job?.id,
            attempts: job?.attemptsMade
        });
    }
}
