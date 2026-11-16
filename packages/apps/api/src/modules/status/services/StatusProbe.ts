import Beat from '../models/Beat';
import StatusBoard from './StatusBoard';
import { eventBus } from '@readable/events/EventBus';
import { BeatSample } from '@modafinil/contracts/status/domain';
import { ProbeResult } from '../contracts/domain/probe';
import { MonitorConfig } from '@/shared/monitors';
import { config } from '@/shared/config';
import { LessThan } from 'typeorm';

const RETENTION_MS = 25 * 60 * 60 * 1000;
const SERVER_ERROR = 500;

const minuteOf = (at: Date): Date => {
    const next = new Date(at);
    next.setSeconds(0, 0);
    return next;
};

export default class StatusProbe{
    #board = new StatusBoard();

    async ping(monitor: MonitorConfig): Promise<boolean>{
        try{
            const response = await fetch(monitor.url, { signal: AbortSignal.timeout(config.probeTimeoutMs) });
            await response.body?.cancel();
            return monitor.anyStatus === true ? response.status < SERVER_ERROR : response.ok;
        }catch{
            return false;
        }
    }

    async check(monitor: MonitorConfig): Promise<ProbeResult>{
        return {
            monitor: monitor.id,
            ok: await this.ping(monitor)
        };
    }

    async record(result: ProbeResult, at = new Date()){
        await Beat.upsert({
            monitor: result.monitor,
            state: result.ok ? BeatSample.Up : BeatSample.Down,
            checkedAt: minuteOf(at)
        }, ['monitor', 'checkedAt']);
    }

    async prune(now = new Date()){
        await Beat.delete({ checkedAt: LessThan(new Date(now.getTime() - RETENTION_MS)) });
    }

    async run(){
        const results = await Promise.all(config.monitors.map((monitor) => this.check(monitor)));
        await Promise.all(results.map((result) => this.record(result)));
        await this.prune();
        eventBus.emit('status.board.refreshed', { board: await this.#board.read() });
    }
}
