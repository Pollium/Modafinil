import Application from '@readable/http/Application';
import { createDataSource } from '@readable/http/data-source';
import { discoverFrom } from '@readable/http/discover';
import { liveBoard } from '@/modules/status/services/LiveBoard';
import { config } from '@/shared/config';

const createApp = () => new Application({
    port: config.port,
    corsOrigins: [...config.corsOrigins],
    log: config.log,
    discover: () => discoverFrom(import.meta.url),
    createDataSource: (entities) => createDataSource(config.database, entities),
    afterDatabase: async () => {
        await liveBoard.hydrate();
        liveBoard.listen();
    }
});

export default createApp;
