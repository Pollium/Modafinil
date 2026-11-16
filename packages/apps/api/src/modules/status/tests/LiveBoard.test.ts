import Beat from '../models/Beat';
import StatusBoard from '../services/StatusBoard';
import StatusProbe from '../services/StatusProbe';
import { liveBoard } from '../services/LiveBoard';
import { eventBus } from '@readable/events/EventBus';
import { BeatSample, MonitorState } from '@modafinil/contracts/status/domain';
import { statusRoutes } from '@modafinil/contracts/status/routes';
import { useApp } from '@tests/harness';
import { request } from '@tests/request';
import { afterEach, describe, expect, it, vi } from 'vitest';

const stateOf = (monitors: MonitorState[], id: string) =>
    monitors.find((monitor) => monitor.id === id)?.state;

describe('the board in memory', () => {
    const ctx = useApp();

    afterEach(() => vi.restoreAllMocks());

    it('answers every request from memory, without reading the beats again', async () => {
        await Beat.create({ monitor: 'api', state: BeatSample.Down, checkedAt: new Date() }).save();
        const read = vi.spyOn(StatusBoard.prototype, 'read');

        const first = await request(ctx.app, statusRoutes.board);
        const second = await request(ctx.app, statusRoutes.board);

        expect(stateOf(first.data().monitors, 'api')).toBe(BeatSample.Empty);
        expect(second.data()).toEqual(first.data());
        expect(read).not.toHaveBeenCalled();
    });

    it('answers the board the last probe run computed', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 200 }));

        await new StatusProbe().run();
        await eventBus.settled();
        const res = await request(ctx.app, statusRoutes.board);

        expect(res.data().monitors.every((monitor) => monitor.state === BeatSample.Up)).toBe(true);
    });

    it('reads the beats already recorded when it hydrates', async () => {
        await Beat.create({ monitor: 'site', state: BeatSample.Down, checkedAt: new Date() }).save();

        await liveBoard.hydrate();
        const res = await request(ctx.app, statusRoutes.board);

        expect(stateOf(res.data().monitors, 'site')).toBe(BeatSample.Down);
    });
});
