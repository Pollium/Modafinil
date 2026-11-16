import { eventBus } from '../events/EventBus';
import { requireTestSchema, truncateSchema } from './postgres';
import { FastifyInstance } from 'fastify';
import { DataSource } from 'typeorm';
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';

export interface TestApp{
    app: FastifyInstance;
    resetDb: () => Promise<void>;
    close: () => Promise<void>;
}

export interface HarnessOptions{
    createApp: () => { build: (options?: { queues?: boolean }) => Promise<FastifyInstance>; dataSource?: DataSource; stop: () => Promise<void> };
    schema: string | undefined;
    onReset?: () => Promise<void>;
}

const createTestApp = async (options: HarnessOptions): Promise<TestApp> => {
    const application = options.createApp();
    const app = await application.build({ queues: false });
    const dataSource = application.dataSource!;
    const schema = requireTestSchema(options.schema);

    return {
        app,
        resetDb: async () => {
            await truncateSchema(dataSource, schema);
            await options.onReset?.();
        },
        close: () => application.stop()
    };
};

export const useApp = (options: HarnessOptions): TestApp => {
    const ctx = {} as TestApp;

    beforeAll(async () => {
        Object.assign(ctx, await createTestApp(options));
    });
    afterAll(() => ctx.close());
    beforeEach(() => ctx.resetDb());
    afterEach(() => eventBus.settled());

    return ctx;
};
