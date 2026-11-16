import { StatusHeadline } from '@modafinil/contracts/status/domain';

export const HEADLINE: Record<StatusHeadline, string> = {
    [StatusHeadline.Operational]: 'Operational',
    [StatusHeadline.Degraded]: 'Degraded',
    [StatusHeadline.Down]: 'Down'
};

export const percent = (value: number | null): string =>
    value === null ? '—' : `${(value * 100).toFixed(2)}%`;

export const checkedLabel = (iso: string | null, now: number): string => {
    if(iso === null) return 'no samples yet';

    const ago = Math.max(0, Math.round((now - Date.parse(iso)) / 1000));
    if(ago < 5) return 'checked just now';
    if(ago < 60) return `checked ${ago}s ago`;

    const minutes = Math.round(ago / 60);
    return `checked ${minutes}m ago`;
};

export const cellRange = (index: number, cellMinutes: number, startsAt: string): string => {
    const start = Date.parse(startsAt) + index * cellMinutes * 60_000;
    const end = start + cellMinutes * 60_000;
    const fmt = (ms: number) => new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return `${fmt(start)}–${fmt(end)}`;
};
