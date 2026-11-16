import { monitorsFrom } from '../monitors';
import { describe, expect, it } from 'vitest';

const listed = (monitors: unknown[]): string => JSON.stringify(monitors);

describe('monitorsFrom', () => {
    it('reads each monitor with its optional blurb and status rule', () => {
        const monitors = monitorsFrom(listed([
            { id: 'api', name: 'API', url: 'http://api:3004/health', blurb: 'api.example.com' },
            { id: 'storage', name: 'Storage', url: 'https://storage.example.com', anyStatus: true }
        ]));

        expect(monitors).toEqual([
            { id: 'api', name: 'API', url: 'http://api:3004/health', blurb: 'api.example.com' },
            { id: 'storage', name: 'Storage', url: 'https://storage.example.com', anyStatus: true }
        ]);
    });

    it('refuses a value that is not JSON', () => {
        expect(() => monitorsFrom('api=http://api/health')).toThrow('Config::InvalidEnv:MONITORS is not JSON');
    });

    it('names the field of the monitor that is wrong', () => {
        expect(() => monitorsFrom(listed([
            { id: 'api', name: 'API', url: 'http://api/health' },
            { id: 'site', name: 'Site' }
        ]))).toThrow(/^Config::InvalidEnv:MONITORS\[1\]\.url must be /);
    });

    it('refuses a url that is not one, or that fetch cannot ask', () => {
        expect(() => monitorsFrom(listed([{ id: 'api', name: 'API', url: 'api health' }])))
            .toThrow(/^Config::InvalidEnv:MONITORS\[0\]\.url must be .*Format<"uri">/);
        expect(() => monitorsFrom(listed([{ id: 'mail', name: 'Mail', url: 'mailto:ops@example.com' }])))
            .toThrow(/^Config::InvalidEnv:MONITORS\[0\]\.url must be .*Pattern<"\^https\?:\/\/">/);
    });

    it('refuses a field it does not know, so a misspelt rule does not pass silently', () => {
        expect(() => monitorsFrom(listed([{ id: 'api', name: 'API', url: 'http://api/health', anystatus: true }])))
            .toThrow(/^Config::InvalidEnv:MONITORS\[0\]\.anystatus must be /);
    });

    it('refuses an empty list', () => {
        expect(() => monitorsFrom('[]')).toThrow(/^Config::InvalidEnv:MONITORS must be /);
    });

    it('refuses two monitors with the same id', () => {
        expect(() => monitorsFrom(listed([
            { id: 'api', name: 'API', url: 'http://api/health' },
            { id: 'api', name: 'API again', url: 'http://api-2/health' }
        ]))).toThrow('Config::InvalidEnv:MONITORS has the id api more than once');
    });
});
