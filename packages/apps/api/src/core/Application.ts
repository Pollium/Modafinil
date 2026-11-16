import websocket from '@fastify/websocket';
import Application from '@readable/http/Application';
import { websocketOptions } from '@readable/gateway/websocket-options';
import { createDataSource } from '@readable/http/data-source';
import { discoverFrom } from '@readable/http/discover';
import { liveBoard } from '@/modules/status/services/LiveBoard';
import { config } from '@/shared/config';

const createApp = () => new Application({
    port: config.port,
    log: config.log,
    discover: () => discoverFrom(import.meta.url),
    createDataSource: (entities) => createDataSource(config.database, entities),
    plugins: async (app) => {
        await app.register(websocket, websocketOptions);
    },
    afterDatabase: async () => {
        await liveBoard.hydrate();
        liveBoard.listen();
    }
});

export default createApp;
