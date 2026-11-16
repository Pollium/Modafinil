export const BeatSample = {
    Up: 'up',
    Down: 'down',
    Empty: 'empty'
} as const;

export type BeatSample = typeof BeatSample[keyof typeof BeatSample];

export const StatusHeadline = {
    Operational: 'operational',
    Degraded: 'degraded',
    Down: 'down'
} as const;

export type StatusHeadline = typeof StatusHeadline[keyof typeof StatusHeadline];

export const STATUS_CELL_COUNT = 90;
export const STATUS_CELL_MINUTES = 16;

export interface MonitorState{
    id: string;
    name: string;
    blurb: string | null;
    state: BeatSample;
    uptime: number | null;
    cells: BeatSample[];
}

export interface Board{
    headline: StatusHeadline;
    uptime: number | null;
    checkedAt: string | null;
    startsAt: string;
    monitors: MonitorState[];
}
