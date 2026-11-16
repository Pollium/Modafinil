import BaseQueue from '../lib/queues/BaseQueue';
import { configure } from '../lib/config';
import { redisOptions } from '../lib/redis/RedisClient';
import { logger } from '../lib/utils/Logger';
import { Queue } from 'bullmq';
import { randomUUID } from 'node:crypto';
import { afterAll, describe, expect, it, vi } from 'vitest';

configure({ redis: { host: 'localhost', port: 6391 } });

const NAME = `scheduled-${randomUUID()}`;
const FAILING = `failing-${randomUUID()}`;
const EVERY_MS = 60_000;
const BROKEN = new Error('database unreachable');

let runs = 0;

class TickQueue extends BaseQueue{
    readonly name = NAME;
    protected readonly everyMs = EVERY_MS;
    protected readonly jobOptions = { attempts: 1, removeOnComplete: true, removeOnFail: true };

    async process(){
        runs += 1;
    }
}

class BrokenQueue extends BaseQueue{
    readonly name = FAILING;
    protected readonly everyMs = EVERY_MS;
    protected readonly jobOptions = { attempts: 1, removeOnComplete: true, removeOnFail: true };

    async process(){
        throw BROKEN;
    }
}

describe('a scheduled queue', () => {
    const queue = new TickQueue();
    const inspector = new Queue(NAME, { connection: redisOptions() });

    afterAll(async () => {
        await queue.close();
        await inspector.obliterate({ force: true });
        await inspector.close();
    });

    it('hands its job options to the scheduler, so a finished run leaves nothing behind', async () => {
        queue.startWorker();

        await expect.poll(() => inspector.getJobScheduler(NAME)).toMatchObject({
            every: EVERY_MS,
            template: { opts: { attempts: 1, removeOnComplete: true, removeOnFail: true } }
        });
        await expect.poll(() => runs).toBe(1);
        await expect.poll(() => inspector.getJobCounts('active')).toEqual({ active: 0 });
        await expect(inspector.getJobCounts('completed')).resolves.toEqual({ completed: 0 });
    });
});

describe('a scheduled queue whose run fails', () => {
    const queue = new BrokenQueue();
    const inspector = new Queue(FAILING, { connection: redisOptions() });

    afterAll(async () => {
        vi.restoreAllMocks();
        await queue.close();
        await inspector.obliterate({ force: true });
        await inspector.close();
    });

    it('logs the error, because the failed job is not kept', async () => {
        const logged = vi.spyOn(logger, 'error').mockImplementation(() => undefined);

        queue.startWorker();

        await expect.poll(() => logged.mock.calls.length).toBe(1);
        expect(logged).toHaveBeenCalledWith(`${FAILING}::Failed`, BROKEN, expect.objectContaining({ scope: 'queue.failed' }));
    });
});
