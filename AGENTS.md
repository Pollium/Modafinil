# Modafinil — agent guide

Modafinil is a self-hosted status page. It probes a list of URLs once a minute, keeps 25 hours of samples and shows the
last 24 hours as 90 cells per monitor, pushed live over a websocket. pnpm monorepo with two apps:

| Package | What it is | Port |
|---|---|---|
| `packages/apps/api` (`@modafinil/api`) | the only backend: reads `MONITORS`, probes them on a BullMQ scheduler, stores one `Beat` per monitor and minute, answers `GET /status` from memory and pushes the board on `/status/live` | 3004 |
| `packages/apps/web` (`@modafinil/web`) | the public page: React + Vite + Tailwind on HeroUI's styles, one page and no router | 5177 |
| `packages/shared/contracts` (`@modafinil/contracts`) | the board, its routes and its live frame | — |
| `packages/shared/ui` (`@modafinil/ui`) | the web's plumbing: `call`, `useQuery`, `useChannel` and the socket pool, `QueryState`, the offline banner, the theme store, `mountApp` | — |

The api is built on [`@pollium/readable`](https://github.com/Pollium/Readable), the HTTP/WS/queue framework from npm:
`Application`, module discovery, decorators, errors, `BaseModel`, queues, the event bus.

Modules are auto-discovered from the filesystem by folder convention — there is no registry file to edit.

## How data flows

```
BullMQ status-probe, every 60 s ──▶ StatusProbe: fetch every MONITORS url ──▶ Beat (monitor, minute) ──▶ prune past 25 h
                                                                          └──▶ eventBus status.board.refreshed
                                                                                 ├──▶ LiveBoard (memory) ──▶ GET /status
                                                                                 └──▶ StatusGateway ──▶ /status/live
web ── same origin ──▶ /status, /status/live
```

- The monitors are the deploy's config, not code: `MONITORS` is a JSON list of `{ id, name, url, blurb?, anyStatus? }`,
  checked strictly at boot. A monitor is up on a 2xx, or on any answer below 500 with `anyStatus: true`.
- The board's name is the web's, not the api's: `VITE_STATUS_NAME`, baked in at build, fills the nav and titles the tab
  `<name> status` before the board loads and while the api is down.
- One origin serves everything. In dev the web's Vite proxy sends `/status` (with the websocket) to 3004; in production
  `deploy/nginx.conf` sends `/status` and `/health` to `api:3004`. The web never holds an api URL.
- `eventBus` is Redis pub/sub on `modafinil:events`. Redis holds nothing else but the probe scheduler.
- There are no accounts: every route is public and read-only.

## Commands

```
pnpm infra                                    # Postgres :5444, Redis :6391 (compose project modafinil-dev)
pnpm dev                                      # infra + api + web on https://localhost:5177
pnpm --filter @modafinil/api test             # Vitest, inside the package
pnpm typecheck && pnpm lint && pnpm test      # the gates a change must pass
docker compose up -d --build                  # the self-hosted stack on :8080, monitors in docker-compose.yml
```

`compose.quantum.yml` is the production stack, deployed on the Quantum PaaS with the real monitor list.

This file is a router, not a manual. Read the file that matches your task before writing code.

| If you are going to… | Read |
|---|---|
| Work in the api — monitors, probes, the board, the live channel | [.agents/api.md](.agents/api.md) |
| Work in the web or `packages/shared/ui` | [.agents/web.md](.agents/web.md) |
| Write or run tests | [.agents/testing.md](.agents/testing.md) |
| Know the quality bar — what not to write, comments included | [.agents/anti-slop.md](.agents/anti-slop.md) |

## Things that will otherwise burn an hour

- **Vitest runs inside the package.** Running it from the repo root picks up every package's config at once.
  `cd packages/apps/api && npx vitest run`.
- **The web typechecks against the `dist` declarations of contracts and ui.** `tsc -b` in `packages/apps/web` (its
  `build` script) rebuilds them; the api never emits.
- **After editing contracts**, clear the api's typia cache (`rm -rf packages/apps/api/node_modules/.cache/unplugin_typia`)
  and restart the web dev server.
- **`BaseModel` ids default to Postgres 18's `uuidv7()`.** An older Postgres fails at `synchronize`.
- **Synchronize is always on.** Renaming `Beat` or one of its columns makes a new empty table or drops data on the next
  boot. Pin the old name with `@Entity('…')` or move the rows yourself.
- **`checkedAt` is `timestamp without time zone`, written in the api process's timezone.** The images run in UTC; a dev
  api in another zone writes local minutes.
- **A monitor url is fetched from the api's network.** In compose that means `http://api:3004/health`, not `localhost`.
  Node's `fetch` rejects self-signed certificates, so a local `https` dev server always reads as down.

Code style: 4-space indent, single quotes, semicolons, `if(` / `}else{` / `try{` with no space, `interface Name{`,
private `#fields`, no comments, English identifiers and copy.
