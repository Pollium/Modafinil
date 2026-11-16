# Web (`packages/apps/web`)

React 19 + Vite + Tailwind v4 on HeroUI's styles. One page, no router, English copy. The look is deliberate: gray up cells
(`bg-foreground/55`), amber down (`#c98500`), faint empty cells, a large quiet headline, no colour anywhere else.

## Layout

```
src/main.tsx                              mountApp(<StatusPage />)
src/vite-env.d.ts                         types VITE_STATUS_NAME on import.meta.env
src/assets/styles/index.css               HeroUI's styles plus the theme: canvas and background tokens, muted, accent,
                                          glass for the offline banner, hidden scrollbars, the enter animation
src/modules/status/
    api/api.ts                            statusApi.board = call(statusRoutes.board)
    hooks/use-live-board.ts               GET /status once, then every status.board frame replaces it
    contracts/channel.ts                  augments @modafinil/ui/contracts/channel with the /status/live frames
    components/StatusPage                 nav (board name + theme toggle), headline, hour ruler, one row per monitor, scrub line
    components/BeatLane                   the 90 cells of one monitor
    components/CheckedAgo                 "checked 12s ago", ticking every second
    components/BoardSkeleton              the headline placeholder; the row count is unknown until the board loads
    utils/headline.ts                     headline words, percent, checked label, cell time range
```

`packages/shared/ui` holds what a page would share: `call` and the alova client (same origin, GET, `{ data }` unwrapped),
`useQuery(request)` with `reload`, `useChannel(path, handlers)` over a pooled `SocketChannel` that reconnects with
backoff and on `online`/visibility, `QueryState` (skeleton, `ErrorState`, `RefreshFailed`), `OfflineBanner`, the theme
store (`?theme=`, then `modafinil.theme`, then the system) and `mountApp`. It has no session and no routing.

- Never hard-code a monitor, a count or a name: monitor names and blurbs come from the api, and the page renders
  whatever `monitors` holds, in order.
- The board's name is `VITE_STATUS_NAME`, read at build: `%VITE_STATUS_NAME% status` in `index.html` titles the tab
  and `import.meta.env.VITE_STATUS_NAME` fills the nav, so both show before the board loads. In dev it comes from
  `packages/apps/web/.env` (copy `.env.example`); an image takes it as a build arg, which both compose files pass.
  Changing it is a rebuild of the web, not a restart of the api.
- The page has no api URL: everything is same-origin. Vite proxies `/status` with `ws: true` to 3004 in dev.
- Style: 4 spaces, single quotes, semicolons, `if(`/`}else{` with no space, `interface Name{`, `@/` imports in the web
  (relative ones inside ui), kebab-case file names except `Component/index.tsx`, no comments, no `!important`.
- Tailwind scans `packages/shared/ui/src` through the `@source` line in `index.css`; a class only ui uses needs no change.

## Checking your work

- `npx tsc -b`, `npx oxlint --deny-warnings` and `npx vite build` in `packages/apps/web`; `npx oxlint --deny-warnings` in
  `packages/shared/ui`.
- Look at it: run `pnpm dev` and open https://localhost:5177 in light and dark, at desktop and phone width. Stop the api
  to see the error state, and start it again: the page must recover without a reload.
