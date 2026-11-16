import ConnectionsRegistry from '../lib/gateway/ConnectionRegistry';
import { WebSocket } from '@fastify/websocket';
import { describe, expect, it } from 'vitest';

interface Listener{
    socket: WebSocket;
    received: () => string[];
}

const listener = (): Listener => {
    const sent: string[] = [];
    const socket = { send: (raw: string) => sent.push(raw) } as unknown as WebSocket;

    return {
        socket,
        received: () => sent.map((raw) => (JSON.parse(raw) as { type: string }).type)
    };
};

const frame = (type: string) => ({ type, data: null });

describe('ConnectionsRegistry', () => {
    it('broadcasts to every open socket and never to one it removed', () => {
        const registry = new ConnectionsRegistry();
        const closed = listener();
        const open = listener();

        registry.add(closed.socket);
        registry.add(open.socket);
        registry.remove(closed.socket);
        registry.broadcast(frame('after.close'));

        expect(closed.received()).toEqual([]);
        expect(open.received()).toEqual(['after.close']);
    });

    it('sends to one socket without reaching the others', () => {
        const registry = new ConnectionsRegistry();
        const target = listener();
        const other = listener();

        registry.add(target.socket);
        registry.add(other.socket);
        registry.sendTo(target.socket, frame('greeting'));

        expect(target.received()).toEqual(['greeting']);
        expect(other.received()).toEqual([]);
    });
});
