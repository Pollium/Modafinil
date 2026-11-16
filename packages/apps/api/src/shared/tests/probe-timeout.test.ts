import { probeTimeoutFrom } from '../probe-timeout';
import { describe, expect, it } from 'vitest';

describe('probeTimeoutFrom', () => {
    it('waits five seconds when unset', () => {
        expect(probeTimeoutFrom(undefined)).toBe(5000);
    });

    it('reads whole milliseconds', () => {
        expect(probeTimeoutFrom('2500')).toBe(2500);
    });

    it('refuses a value a fetch timeout cannot take, so no probe fails before it is sent', () => {
        for(const raw of ['5s', '2500.5', '0', '-1', '2147483648']){
            expect(() => probeTimeoutFrom(raw)).toThrow(/^Config::InvalidEnv:PROBE_TIMEOUT_MS must be /);
        }
    });
});
