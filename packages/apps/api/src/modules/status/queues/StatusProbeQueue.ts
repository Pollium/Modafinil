import StatusProbe from '../services/StatusProbe';
import BaseQueue from '@readable/queues/BaseQueue';

export default class StatusProbeQueue extends BaseQueue{
    readonly name = 'status-probe';

    protected readonly everyMs = 60_000;

    protected readonly jobOptions = {
        attempts: 1,
        removeOnComplete: true,
        removeOnFail: true
    };

    #probe = new StatusProbe();

    process(){
        return this.#probe.run();
    }
}
