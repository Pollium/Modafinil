import Beat from '../models/Beat';
import { BeatSample, Board, MonitorState, STATUS_CELL_COUNT, STATUS_CELL_MINUTES, StatusHeadline } from '@modafinil/contracts/status/domain';
import { MonitorConfig } from '@/shared/monitors';
import { config } from '@/shared/config';
import { In, MoreThanOrEqual } from 'typeorm';

const CELL_MS = STATUS_CELL_MINUTES * 60_000;

const ratio = (samples: BeatSample[]): number | null => {
    const known = samples.filter((sample) => sample !== BeatSample.Empty);
    if(known.length === 0) return null;

    return known.filter((sample) => sample === BeatSample.Up).length / known.length;
};

const headlineOf = (states: BeatSample[]): StatusHeadline => {
    if(states.length === 0) return StatusHeadline.Operational;
    if(states.every((state) => state === BeatSample.Down)) return StatusHeadline.Down;
    if(states.some((state) => state === BeatSample.Down)) return StatusHeadline.Degraded;
    return StatusHeadline.Operational;
};

const windowStart = (now: Date): Date => {
    const currentSlot = Math.floor(now.getTime() / CELL_MS);
    return new Date((currentSlot - (STATUS_CELL_COUNT - 1)) * CELL_MS);
};

const cellsOf = (beats: Beat[], startsAt: Date): BeatSample[] => {
    const bySlot = new Map<number, BeatSample>();

    for(const beat of beats){
        const slot = Math.floor((beat.checkedAt.getTime() - startsAt.getTime()) / CELL_MS);
        if(slot < 0 || slot >= STATUS_CELL_COUNT) continue;
        if(bySlot.get(slot) === BeatSample.Down) continue;
        bySlot.set(slot, beat.state);
    }

    return Array.from({ length: STATUS_CELL_COUNT }, (_, slot) => bySlot.get(slot) ?? BeatSample.Empty);
};

const monitorOf = (monitor: MonitorConfig, beats: Beat[], startsAt: Date): MonitorState => {
    const cells = cellsOf(beats, startsAt);

    return {
        id: monitor.id,
        name: monitor.name,
        blurb: monitor.blurb ?? null,
        state: beats.at(-1)?.state ?? BeatSample.Empty,
        uptime: ratio(beats.map((beat) => beat.state)),
        cells
    };
};

export const boardOf = (beats: Beat[], now: Date): Board => {
    const startsAt = windowStart(now);
    const monitors = config.monitors.map((monitor) =>
        monitorOf(monitor, beats.filter((beat) => beat.monitor === monitor.id), startsAt));
    const latest = monitors.map((monitor) => monitor.state).filter((state) => state !== BeatSample.Empty);

    return {
        headline: headlineOf(latest),
        uptime: ratio(beats.map((beat) => beat.state)),
        checkedAt: beats.at(-1)?.checkedAt.toISOString() ?? null,
        startsAt: startsAt.toISOString(),
        monitors
    };
};

export default class StatusBoard{
    async read(now = new Date()): Promise<Board>{
        const beats = await Beat.find({
            where: {
                monitor: In(config.monitors.map((monitor) => monitor.id)),
                checkedAt: MoreThanOrEqual(windowStart(now))
            },
            order: { checkedAt: 'ASC' }
        });

        return boardOf(beats, now);
    }
}
