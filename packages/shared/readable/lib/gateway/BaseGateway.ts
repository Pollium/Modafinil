import RuntimeError from '../errors/RuntimeError';
import ConnectionsRegistry from './ConnectionRegistry';
import { getParamResolvers } from '../decorators/controllers/Params';
import { channelByGateway } from '../decorators/gateway/Channel';
import { connectHandlersByGateway } from '../decorators/gateway/Gateway';
import { GatewayError } from '../errors/Gateway';
import { createContext } from './create-context';
import { WebSocket } from '@fastify/websocket';
import { FastifyInstance, FastifyRequest } from 'fastify';

export default abstract class BaseGateway{
    protected readonly connections = new ConnectionsRegistry();

    register(app: FastifyInstance){
        const path = channelByGateway.get(this.constructor);
        if(!path) throw GatewayError.MissingChannel();

        app.get(path, { websocket: true }, (socket, req) => this.#onConnection(socket, req));
    }

    #onConnection(socket: WebSocket, req: FastifyRequest){
        this.connections.add(socket);
        socket.on('close', () => this.connections.remove(socket));

        for(const handlerName of connectHandlersByGateway.get(this.constructor)){
            void this.#runLifecycle(handlerName, socket, req);
        }
    }

    async #runLifecycle(handlerName: string | symbol, socket: WebSocket, req: FastifyRequest){
        try{
            await this.#invoke(handlerName, socket, req);
        }catch(error: unknown){
            this.#handleError(socket, error);
        }
    }

    async #invoke(handlerName: string | symbol, socket: WebSocket, req: FastifyRequest): Promise<unknown>{
        const ctx = createContext(req, socket);
        const resolvers = getParamResolvers(this.constructor, handlerName);
        const args = await Promise.all(resolvers.map((resolve) => resolve(ctx)));

        const method = Reflect.get(this, handlerName) as (...args: unknown[]) => unknown;
        return method.apply(this, args);
    }

    #handleError(socket: WebSocket, error: unknown){
        const failure = error instanceof RuntimeError ? error : GatewayError.Internal();
        socket.send(JSON.stringify({ error: failure.message }));
    }
}
