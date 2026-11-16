import createApp from '@/core/Application';
import { useApp as useSharedApp, TestApp } from '@readable/testing/harness';
import { liveBoard } from '@/modules/status/services/LiveBoard';
import { config } from '@/shared/config';

export type { TestApp };

export const useApp = (): TestApp => useSharedApp({
    createApp,
    schema: config.database.schema,
    onReset: () => liveBoard.hydrate()
});
