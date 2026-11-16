import { HttpMethod } from '@modafinil/contracts/shared/routing';
import { FastifyReply, FastifyRequest, RouteGenericInterface } from 'fastify';

export interface RouteDefinition{
    path: string;
    method: HttpMethod;
    handlerName: string | symbol;
}

export type Handler = (
    req: FastifyRequest<RouteGenericInterface>,
    reply: FastifyReply
) => unknown;
