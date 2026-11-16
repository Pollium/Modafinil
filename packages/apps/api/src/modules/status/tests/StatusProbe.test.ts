import Beat from '../models/Beat';
import StatusProbe from '../services/StatusProbe';
import { BeatSample } from '@modafinil/contracts/status/domain';
import { config } from '@/shared/config';
import { useApp } from '@tests/harness';
import { afterEach, describe, expect, it, vi } from 'vitest';

const probe = new StatusProbe();
const FORBIDDEN = 403;
const BAD_GATEWAY = 502;

const answering = (status: number) => vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = String(input);
    if(url.includes('storage.test') || url.includes('api.test')) return new Response(null, { status });
    return new Response(null, { status: 200 });
});

const stateOf = async (monitor: string) => (await Beat.findOneBy({ monitor }))?.state;

describe('StatusProbe', () => {
    useApp();

    afterEach(() => vi.restoreAllMocks());

    it('records an up beat for every monitor whose health endpoint answers', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{"status":"ok"}', { status: 200 }));

        await probe.run();

        const beats = await Beat.find();
        expect(beats).toHaveLength(config.monitors.length);
        expect(beats.every((beat) => beat.state === BeatSample.Up)).toBe(true);
        expect(new Set(beats.map((beat) => beat.monitor))).toEqual(new Set(config.monitors.map((monitor) => monitor.id)));
    });

    it('records a down beat when the health endpoint is unreachable', async () => {
        vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('fetch failed'));

        await probe.run();

        const beats = await Beat.find();
        expect(beats).toHaveLength(config.monitors.length);
        expect(beats.every((beat) => beat.state === BeatSample.Down)).toBe(true);
    });

    it('collapses two checks in the same minute onto one row', async () => {
        const at = new Date('2026-09-25T12:00:30Z');

        await probe.record({ monitor: 'api', ok: true }, at);
        await probe.record({ monitor: 'api', ok: false }, at);

        const beats = await Beat.findBy({ monitor: 'api' });
        expect(beats).toHaveLength(1);
        expect(beats[0]?.state).toBe(BeatSample.Down);
    });

    it('keeps one row when two checks of the same minute land together', async () => {
        const at = new Date('2026-09-25T12:00:30Z');

        await Promise.all([
            probe.record({ monitor: 'api', ok: true }, at),
            probe.record({ monitor: 'api', ok: true }, at)
        ]);

        expect(await Beat.countBy({ monitor: 'api' })).toBe(1);
    });

    it('counts any answer below a server error as up for a monitor that takes any status', async () => {
        answering(FORBIDDEN);

        await probe.run();

        await expect(stateOf('storage')).resolves.toBe(BeatSample.Up);
        await expect(stateOf('api')).resolves.toBe(BeatSample.Down);
    });

    it('counts a server error as down even for a monitor that takes any status', async () => {
        answering(BAD_GATEWAY);

        await probe.run();

        await expect(stateOf('storage')).resolves.toBe(BeatSample.Down);
        await expect(stateOf('site')).resolves.toBe(BeatSample.Up);
    });

    it('cancels every response body it does not read', async () => {
        const cancelled = vi.fn();
        vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
            new Response(new ReadableStream({ cancel: cancelled }), { status: 200 }));

        await probe.run();

        expect(cancelled).toHaveBeenCalledTimes(config.monitors.length);
    });

    it('drops beats older than twenty-five hours', async () => {
        const stale = new Date(Date.now() - 26 * 60 * 60 * 1000);
        await Beat.create({
            monitor: 'api',
            state: BeatSample.Up,
            checkedAt: stale
        }).save();

        await probe.prune();

        await expect(Beat.count()).resolves.toBe(0);
    });
});
