import Beat from '../models/Beat';
import { liveBoard } from '../services/LiveBoard';
import { BeatSample, StatusHeadline } from '@modafinil/contracts/status/domain';
import { statusRoutes } from '@modafinil/contracts/status/routes';
import { useApp } from '@tests/harness';
import { request } from '@tests/request';
import { describe, expect, it } from 'vitest';

describe('StatusController', () => {
    const ctx = useApp();

    it('serves the board without a session', async () => {
        await Beat.create({
            monitor: 'api',
            state: BeatSample.Up,
            checkedAt: new Date()
        }).save();
        await liveBoard.hydrate();

        const res = await request(ctx.app, statusRoutes.board);

        expect(res.status).toBe(200);
        expect(res.data()).toMatchObject({
            headline: StatusHeadline.Operational,
            monitors: expect.arrayContaining([
                expect.objectContaining({ id: 'api', state: BeatSample.Up })
            ])
        });
    });

    it('answers the process liveness probe without an envelope', async () => {
        const res = await request(ctx.app, statusRoutes.health);

        expect(res.status).toBe(200);
        expect(res.json()).toEqual({ status: 'ok' });
    });
});
