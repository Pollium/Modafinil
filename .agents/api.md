# The api

`packages/apps/api` is the only backend. It owns the one table, runs the probe scheduler and answers every question the web
asks. Read [../AGENTS.md](../AGENTS.md) first for the data flow.

## Layout

```
src/server.ts                 boot: reflect-metadata, dotenv, listen(createApp())
src/core/Application.ts       readable's Application: websocket plugin, discovery, DataSource, then LiveBoard.hydrate() + listen()
src/shared/config.ts          env → config (port, database, redis, monitors, probeTimeoutMs)
src/shared/monitors.ts        MONITORS → MonitorConfig[], typia-checked, with duplicate ids refused
src/shared/probe-timeout.ts   PROBE_TIMEOUT_MS → whole milliseconds, 1 to 2147483647
src/modules/status/
    models/Beat.ts            one sample: monitor, state (up|down), checkedAt (the minute); unique (monitor, checkedAt)
    queues/StatusProbeQueue   the BullMQ scheduler, every 60 s, one attempt, finished jobs not kept
    services/StatusProbe      fetch every monitor, upsert its beat, prune past 25 h, emit status.board.refreshed
    services/StatusBoard      beats → Board (boardOf is pure; read() loads the 24 h window)
    services/LiveBoard        the board in memory: hydrated at boot, replaced on every refresh
    controllers/Status.ts     GET /status → { data: liveBoard.board }
    gateways/StatusGateway    /status/live: the board on connect, then on every refresh
```

Discovery loads the default export of every file in a module's `controllers/`, `models/`, `queues/` and `gateways/`.
A file outside those folders is never mounted, and a test file inside one would be.

## Config

| Env | Meaning |
|---|---|
| `PORT` | 3004 |
| `DATABASE_URL` | Postgres 18; the schema is synchronized on boot |
| `REDIS_HOST`, `REDIS_PORT` | the scheduler and `modafinil:events` |
| `MONITORS` | JSON list of `{ id, name, url, blurb?, anyStatus? }`, in display order |
| `PROBE_TIMEOUT_MS` | per fetch, default 5000; anything but whole milliseconds fails the boot |
| `CORS_ORIGIN` | comma list; only matters when the page is served from another origin |
| `LOG_LEVEL`, `LOG_PRETTY` | pino |

`MONITORS` fails the boot with `Config::InvalidEnv:…` on unknown fields, a url that is not `http(s)://`, an empty list or
a repeated id. Changing the list is a deploy, not a migration: a removed id stops showing at once and its beats age out in
25 h; a new id starts empty. Keep an id to keep its history.

## What the board means

- `cells` always has `STATUS_CELL_COUNT` (90) entries of `STATUS_CELL_MINUTES` (16) minutes, aligned to the epoch.
  `startsAt` is the start of cell 0; the last cell is the current, partial slot.
- A cell is `down` if any minute in it was down, `up` if every sampled minute was up, `empty` with no sample.
- `state` is the monitor's latest sample, so it can read `up` while the last cell is `down`.
- `uptime` is up minutes over sampled minutes in the window, or `null` with none; `Board.uptime` uses the same formula
  over every monitor's minutes. The any-down rule only colours the cells.
- `headline` uses the latest states: `down` when all are down, `degraded` when some are, `operational` otherwise or with
  no samples.
- `checkedAt` is the newest sample's minute, or `null`.

## Rules

- The probe never throws for a monitor: a timeout, a refused connection or a bad status is a `down` beat.
- `GET /status` reads memory, never the database, so it costs nothing to poll. Anything that changes the board goes
  through `StatusProbe.run()` and `status.board.refreshed`, which both `LiveBoard` and the gateway follow.
- Routes and frames come from `@modafinil/contracts/status/*`; the web's paths (`/status`, `/status/live`, `/health`) are
  public API, because nginx and old tabs point at them.
