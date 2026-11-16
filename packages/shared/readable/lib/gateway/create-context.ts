import { WebSocket } from '@fastify/websocket';
import { FastifyRequest } from 'fastify';

export const SOCKET = Symbol('gateway.socket');

export interface GatewayContext extends FastifyRequest{
    [SOCKET]: WebSocket;
}

export const createContext = (req: FastifyRequest, socket: WebSocket): GatewayContext => {
    const ctx = Object.create(req) as GatewayContext;
    ctx[SOCKET] = socket;
    return ctx;
};
