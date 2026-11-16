import Beat from '../models/Beat';
import StatusBoard from '../services/StatusBoard';
import { BeatSample, STATUS_CELL_COUNT, StatusHeadline } from '@modafinil/contracts/status/domain';
import { config } from '@/shared/config';
import { useApp } from '@tests/harness';
import { describe, expect, it } from 'vitest';

const board = new StatusBoard();
const now = new Date('2026-09-25T12:10:00Z');
const FIRST_CELL_MINUTES_AGO = 1434;
const DAY_MINUTES = 24 * 60;
const RETIRED = 'retired';
const PREVIOUS_CELL_MINUTES_AGO = Array.from({ length: 16 }, (_, index) => 11 + index);

const beat = (monitor: string, minutesAgo: number, state: BeatSample) =>
    Beat.create({
        monitor,
        state,
        checkedAt: new Date(now.getTime() - minutesAgo * 60_000)
    }).save();

describe('StatusBoard', () => {
    useApp();

    it('returns empty cells and a live headline when nothing has been sampled', async () => {
        const page = await board.read(now);

        expect(page.headline).toBe(StatusHeadline.Operational);
        expect(page.uptime).toBeNull();
        expect(page.checkedAt).toBeNull();
        expect(page.monitors.map(({ id, name, blurb }) => ({ id, name, blurb }))).toEqual([
            { id: 'api', name: 'API', blurb: 'api.example.com' },
            { id: 'site', name: 'Site', blurb: null },
            { id: 'storage', name: 'Storage', blurb: null }
        ]);
        expect(page.monitors[0]?.cells).toHaveLength(STATUS_CELL_COUNT);
        expect(page.monitors[0]?.cells.every((cell) => cell === BeatSample.Empty)).toBe(true);
    });

    it('packs a minute sample into a sixteen-minute cell and leaves gaps empty', async () => {
        await beat('api', 8, BeatSample.Up);
        await beat('api', 40, BeatSample.Down);

        const [api] = (await board.read(now)).monitors;

        expect(api?.cells.at(-1)).toBe(BeatSample.Up);
        expect(api?.cells.at(-3)).toBe(BeatSample.Down);
        expect(api?.cells.at(-2)).toBe(BeatSample.Empty);
        expect(api?.state).toBe(BeatSample.Up);
        expect(api?.uptime).toBe(0.5);
    });

    it('shows a cell down when any minute in its slot was down, while the monitor reads its latest minute', async () => {
        await beat('api', 10, BeatSample.Down);
        await beat('api', 2, BeatSample.Up);

        const [api] = (await board.read(now)).monitors;

        expect(api?.cells.at(-1)).toBe(BeatSample.Down);
        expect(api?.state).toBe(BeatSample.Up);
    });

    it('counts uptime by the minute, so one down minute does not cost its whole cell', async () => {
        await Promise.all(PREVIOUS_CELL_MINUTES_AGO.map((minutesAgo) =>
            beat('api', minutesAgo, minutesAgo === PREVIOUS_CELL_MINUTES_AGO[0] ? BeatSample.Down : BeatSample.Up)));

        const page = await board.read(now);
        const [api] = page.monitors;

        expect(api?.cells.at(-2)).toBe(BeatSample.Down);
        expect(api?.uptime).toBe(15 / 16);
        expect(page.uptime).toBe(15 / 16);
    });

    it('marks the board degraded when any monitor is currently down', async () => {
        await beat('api', 1, BeatSample.Up);
        await beat('site', 1, BeatSample.Down);

        const page = await board.read(now);

        expect(page.headline).toBe(StatusHeadline.Degraded);
        expect(page.monitors.find((monitor) => monitor.id === 'site')?.state).toBe(BeatSample.Down);
    });

    it('keeps a minute in the same cell while the clock moves through its slot', async () => {
        await beat('api', 12, BeatSample.Down);

        const [early] = (await board.read(now)).monitors;
        const [late] = (await board.read(new Date(now.getTime() + 5 * 60_000))).monitors;

        expect(early?.cells.at(-2)).toBe(BeatSample.Down);
        expect(late?.cells).toEqual(early?.cells);
    });

    it('starts the window on a slot boundary and leaves out anything older', async () => {
        await beat('api', FIRST_CELL_MINUTES_AGO, BeatSample.Up);
        await beat('site', DAY_MINUTES, BeatSample.Down);

        const page = await board.read(now);

        expect(page.startsAt).toBe('2026-09-24T12:16:00.000Z');
        expect(page.monitors.find((monitor) => monitor.id === 'api')?.cells[0]).toBe(BeatSample.Up);
        expect(page.monitors.find((monitor) => monitor.id === 'site')?.uptime).toBeNull();
    });

    it('leaves out a monitor the config no longer lists', async () => {
        await beat(RETIRED, 1, BeatSample.Down);

        const page = await board.read(now);

        expect(page.monitors.map((monitor) => monitor.id)).toEqual(config.monitors.map((monitor) => monitor.id));
        expect(page.headline).toBe(StatusHeadline.Operational);
        expect(page.checkedAt).toBeNull();
    });
});
