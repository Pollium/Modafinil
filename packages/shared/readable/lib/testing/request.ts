import { Endpoint } from '@modafinil/contracts/shared/routing';
import { FastifyInstance } from 'fastify';

export interface TestResponse<O>{
    status: number;
    json: <T = Record<string, unknown>>() => T;
    data: () => O;
}

export const request = async <I, O>(app: FastifyInstance, endpoint: Endpoint<I, O>): Promise<TestResponse<O>> => {
    const res = await app.inject({
        method: endpoint.method,
        url: endpoint.path
    });

    return {
        status: res.statusCode,
        json: <T>() => res.json() as T,
        data: () => (res.json() as { data: O }).data
    };
};
