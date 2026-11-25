# Web (`packages/apps/web`)

React 19 + Vite + Tailwind v4 on HeroUI's styles, on `@pollium/readable-react`. One public page, English copy. The look
is deliberate: gray up cells (`bg-foreground/55`), amber down (`#c98500`), faint empty cells, a large quiet headline, no
colour anywhere else.

## Layout

```
vite.config.ts                            readableConfig(...) plus react, tailwind, basic-ssl, port 5177 and the /status proxy
tsconfig.json                             { "extends": "@pollium/readable-react/tsconfig.json" }
src/main.tsx                              initTheme(), then mount({ pages, apiUrl: origin, wrap: the offline banner })
src/vite-env.d.ts                         types VITE_STATUS_NAME on import.meta.env
src/assets/styles/index.css               HeroUI's styles plus the theme: canvas and background tokens, muted, accent,
                                          glass for the offline banner, hidden scrollbars, the enter animation
src/modules/status/
    pages/public/index.tsx                the page at /: nav (board name + theme toggle), headline, hour ruler, one row per
                                          monitor, scrub line
    hooks/use-live-board.ts               useQuery(statusRoutes.board), and every status.board frame from statusGateway
                                          goes to its set()
    components/BeatLane                   the 90 cells of one monitor
    components/CheckedAgo                 "checked 12s ago", ticking every second
    components/BoardSkeleton              the headline placeholder; the row count is unknown until the board loads
    utils/headline.ts                     headline words, percent, checked label, cell time range
```

Calls, queries, the socket and the routing are readable-react's; read its guide at
`node_modules/@pollium/readable-react/AGENTS.md`. `packages/shared/ui` holds only the looks: `QueryState` (readable-react's,
drawn with a skeleton, `ErrorState` and `RefreshFailed`), `OfflineBanner` on readable-react's `useOnline`, and the theme
store (`?theme=`, then `modafinil.theme`, then the system), which readable-react does not cover.

- Never hard-code a monitor, a count or a name: monitor names and blurbs come from the api, and the page renders
  whatever `monitors` holds, in order.
- The board's name is `VITE_STATUS_NAME`, read at build: `%VITE_STATUS_NAME% status` in `index.html` titles the tab
  and `import.meta.env.VITE_STATUS_NAME` fills the nav, so both show before the board loads. In dev it comes from
  `packages/apps/web/.env` (copy `.env.example`); an image takes it as a build arg, which both compose files pass.
  Changing it is a rebuild of the web, not a restart of the api.
- The page holds no api URL: everything is same-origin, so `mount` gets `apiUrl: window.location.origin` instead of
  readable-react's default `<origin>/api`. Vite proxies `/status` with `ws: true` to 3004 in dev.
- A path other than `/` sends the visitor to `/`: that is readable-react's fallback route.
- Style: 4 spaces, single quotes, semicolons, `if(`/`}else{` with no space, `interface Name{`, `@/` imports in the web
  (relative ones inside ui), kebab-case file names except `Component/index.tsx`, no comments, no `!important`.
- Tailwind scans `packages/shared/ui/src` through the `@source` line in `index.css`; a class only ui uses needs no change.

## Checking your work

- `pnpm typecheck`, `npx oxlint --deny-warnings` and `npx vite build` in `packages/apps/web`, which typechecks ui too;
  `npx oxlint --deny-warnings` in `packages/shared/ui`.
- Look at it: run `pnpm dev` and open https://localhost:5177 in light and dark, at desktop and phone width. Stop the api
  to see the error state, and start it again: the page must recover without a reload.
