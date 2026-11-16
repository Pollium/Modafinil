import Beat from '../models/Beat';
import StatusBoard from '../services/StatusBoard';
import StatusProbe from '../services/StatusProbe';
import { liveBoard } from '../services/LiveBoard';
import { BeatSample } from '@modafinil/contracts/status/domain';
import { statusGateway, StatusFrame } from '@modafinil/contracts/status/gateway';
import { useApp } from '@tests/harness';
import { FastifyInstance } from 'fastify';
import { afterEach, describe, expect, it, vi } from 'vitest';

const visit = async (app: FastifyInstance): Promise<StatusFrame[]> => {
    const frames: StatusFrame[] = [];

    await app.ready();
    await app.injectWS(statusGateway.channel, {}, {
        onInit: (socket) => socket.on('message', (raw) => frames.push(JSON.parse(String(raw)) as StatusFrame))
    });

    return frames;
};

describe('StatusGateway', () => {
    const ctx = useApp();

    afterEach(() => vi.restoreAllMocks());

    it('greets a visitor without a session with the current board', async () => {
        await Beat.create({
            monitor: 'api',
            state: BeatSample.Down,
            checkedAt: new Date()
        }).save();
        await liveBoard.hydrate();

        const frames = await visit(ctx.app);

        await expect.poll(() => frames).toHaveLength(1);
        expect(frames[0]).toMatchObject({
            type: 'status.board',
            data: {
                monitors: expect.arrayContaining([
                    expect.objectContaining({ id: 'api', state: BeatSample.Down })
                ])
            }
        });
    });

    it('pushes the board a probe run just recorded to every visitor', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 200 }));
        const first = await visit(ctx.app);
        const second = await visit(ctx.app);
        await expect.poll(() => [first.length, second.length]).toEqual([1, 1]);

        await new StatusProbe().run();

        await expect.poll(() => [first.length, second.length]).toEqual([2, 2]);
        expect(second[1]).toEqual(first[1]);
        expect(first[1]?.data.monitors.every((monitor) => monitor.state === BeatSample.Up)).toBe(true);
    });

    it('greets every later visitor with the board the last probe run broadcast, without reading it again', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 200 }));
        const watcher = await visit(ctx.app);
        await new StatusProbe().run();
        await expect.poll(() => watcher.length).toBe(2);
        const read = vi.spyOn(StatusBoard.prototype, 'read');

        const visitors = await Promise.all(Array.from({ length: 3 }, () => visit(ctx.app)));

        await expect.poll(() => visitors.map((frames) => frames.length)).toEqual([1, 1, 1]);
        expect(visitors[0]?.[0]).toEqual(watcher[1]);
        expect(read).not.toHaveBeenCalled();
    });
});
