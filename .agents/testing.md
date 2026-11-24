# Testing

The suite is **Vitest** running through each package's `vite.config.ts`, the same plugins and transforms as production.
The api's `MONITORS` check is a typia validator compiled by `@typia/unplugin`, so a test exercises the exact code that
boots. Do not introduce Jest, `node:test` or a `tsx`-based runner.

## Running

```
pnpm infra                                    # the compose Postgres :5444 and Redis :6391
pnpm test                                     # every package, one at a time
cd packages/apps/api && npx vitest run        # one package; never from the repo root
```

- `packages/apps/api` needs Postgres only. `tests/setup.ts` sets the env (three `.test` monitors) and gives each Vitest
  pool slot its own schema (`api_test_1`, `api_test_2`, … through
  `DATABASE_SCHEMA`), so files run in parallel and never touch the `public` schema your dev data lives in.
- The web and ui have no tests. Check them by building and by looking at the page ([web.md](web.md)).

`vite.config.ts` raises `hookTimeout` to 60 s, because `useApp()` builds the whole app through the typia transform and a
cold cache (`node_modules/.cache/unplugin_typia`) takes longer than the default. Don't lower it.

## Layout

```
tests/setup.ts                  env + per-slot Postgres schema
tests/harness.ts                useApp(): builds the app once per file with queues off, truncates the schema and
                                re-hydrates LiveBoard before each test, closes on teardown
tests/request.ts                request(app, endpoint): the typed twin of the web's call()
src/modules/status/tests/       the module's suites: probe, board, live board, controller, gateway
src/shared/tests/               unit tests for shared code (the MONITORS and PROBE_TIMEOUT_MS parsers)
```

Never put a `.test.ts` in `controllers/`, `models/`, `queues/` or `gateways/`: discovery loads every default export
there. A module's `tests/` folder is not scanned.

## How the suites are written

- **HTTP**: `useApp()` once, then per test seed `Beat` rows, `await liveBoard.hydrate()`, call
  `request(ctx.app, statusRoutes.board)` and assert `res.status` and `res.data()` against the contract.
- **WebSocket**: `ctx.app.injectWS(statusGateway.channel, …)` and collect the frames; assert the frame on connect and
  the one after `StatusProbe.run()`.
- **Probes**: stub `globalThis.fetch` with `vi.spyOn` per test and restore it in `afterEach`; the `.test` hosts are never
  resolved. Call `probe.run()` and assert the `Beat` rows it wrote.
- **The board**: seed beats around a fixed `now`, call `new StatusBoard().read(now)` and assert cells, uptime and
  headline.
- **The queue**: `StatusProbeQueue.process` delegates to `StatusProbe.run()`, so there is no BullMQ to involve.

## Do NOT

- No mocking of TypeORM models: use the compose Postgres.
- No second database engine (SQLite or an in-memory driver) to make `pnpm test` standalone.
- Never point `DATABASE_SCHEMA` at `public` in tests: the harness truncates the configured schema, and refuses `public`.
- No `listen()`, no supertest: `app.inject()` and `app.injectWS()` cover HTTP and sockets.
- A test must be able to fail: if inverting the condition under test would not break it, rewrite it.
