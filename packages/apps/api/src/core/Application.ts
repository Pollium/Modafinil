import Application from '@readable/http/Application';
import { createDataSource } from '@readable/http/data-source';
import { discoverFrom } from '@readable/http/discover';
import { config } from '@/shared/config';

const createApp = () => new Application({
    port: config.port,
    corsOrigins: [...config.corsOrigins],
    log: config.log,
    discover: () => discoverFrom(import.meta.url),
    createDataSource: (entities) => createDataSource(config.database, entities)
});

export default createApp;
