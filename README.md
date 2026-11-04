# MarketBot Frontend

An independent Next.js customer portal, designed around desktop workflows and
adapted to tablets and phones. Persian, right-to-left, with a light neutral
interface, restrained emerald accents, readable tables, and dedicated workspaces.

This project has its own dependency tree, source, routes, build, and deployment.
It imports no files from `marketbot-miniapp` or the `marketbot-web` admin dashboard.
The licensed Vazirmatn font is bundled in `public/fonts` with its OFL notice.

## Run locally

Node.js 24 is recommended (minimum 22.6 for the included test commands).

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open http://127.0.0.1:3001.

Set `MARKETBOT_DEMO_MODE=true` to inspect synthetic accounts, balances, charts,
and orders without a backend. The initial local `.env.local` is configured this
way for design review. Demo orders and saved account edits stay in the browser's
query cache until refresh. SMS, payments, and withdrawals do not reach live
services in demo mode; the server gateway refuses requests in this mode too.

For real accounts, set `MARKETBOT_DEMO_MODE=false` and configure
`MARKETBOT_API_URL` to the customer API origin, such as
`http://127.0.0.1:8080`. There is no automatic fallback from a failed live request
to sample financial data.

## Application structure

```text
src/
  app/                 Next.js App Router pages, layouts, error/loading states
    (portal)/          Authenticated customer routes
    login/             Phone and SMS sign-in
    api/gateway/       Server-only customer API boundary and session cookie
  features/
    dashboard/         Portfolio overview, allocation, markets, activity
    markets/           Search, persistent watchlist, market tables
    trading/           Chart, order book, order entry and review
    wallet/            Assets, ledger, charge and withdrawal flows
    orders/            Open/history filters and cancellation review
    banks/             Saved destinations with IBAN validation
    account/           Profile and account security
    auth/              Desktop sign-in flow
  components/          Shared UI, accessible dialogs, chart, desktop shell
  providers/           Query cache, preview configuration, notifications
  lib/                 Domain contracts, API client, query hooks, formatting
  styles/              Base tokens, shell, component and feature design layers
scripts/
  check-gateway.mjs    Isolated integration test for the real Next.js gateway
```

Routes: `/`, `/markets`, `/trade/USDT_IRT`, `/wallet`, `/orders`,
`/bank-accounts`, `/settings`, and `/login`. Browser navigation and refresh use
native Next.js routing. Desktop uses a persistent sidebar; smaller screens use
an off-canvas menu and page layouts adapt without stretching the mini app.

## Backend contract and sessions

The portal uses `marketbot-api`'s customer `/v1` API. That service owns customers,
and exposes independent customer sessions. Its browser authentication routes
are `POST /v1/auth/web/send` and `POST /v1/auth/web/verify`. Customer identities
link to existing exchange users by verified phone; backoffice sessions cannot
access this interface. The implementation status is listed below.

The browser calls `/api/gateway/...` on its own origin. Next.js forwards only an
explicit allowlist of customer routes. Successful login stores the bearer token
in an HttpOnly, SameSite=Lax cookie (Secure in production) and removes the token
from the JSON response. Tokens are never placed in localStorage. Writes require
a matching Origin, upstream responses are not cached, and redirects from the
upstream are refused. The backend remains responsible for validating all orders,
balances, code attempts, and withdrawals.

Behind an ingress, configure `MARKETBOT_APP_ORIGIN` to the portal's public HTTPS
origin. To preserve client IP throttling, use an ingress that **overwrites**
`X-Real-IP` and blocks direct access to Next.js, then enable
`MARKETBOT_TRUST_INGRESS=true`. The core API currently trusts loopback proxies;
configure the deployment topology so forwarded addresses arrive only through
that trusted chain. Without trusted forwarding, SMS requests share the BFF's
IP limit. Never trust arbitrary client-supplied forwarding headers.
Do not put upstream credentials into `NEXT_PUBLIC_*` variables.

## Product behavior

- Searchable market tables, saved watchlist, and current market summaries.
- Desktop trading places the recent-trade price chart, order book, and order
  form together. Limit, market, and auction entry include a confirmation step.
- Wallet shows available, frozen, and locked balances separately, along with
  ledger history and withdrawal requests. Deposits use the configured bank
  gateway; cryptocurrency deposits remain unavailable as in the customer API.
- Each withdrawal requires a fresh SMS confirmation and records a pending
  request. A saved destination is resolved by the backend, not trusted from
  client-supplied holder details. Pending requests can be cancelled.
- Bank destinations validate Iranian IBAN checksum. Saving a destination does
  not claim verified bank ownership.
- Market information polls every five seconds; balances and orders every
  fifteen seconds. Charts show actual recent trades, not invented historical
  candles. No performance history or fee schedule is fabricated.
- Dialogs provide focus trapping, Escape dismissal, accessible headings, and
  keyboard controls through Radix. Reduced-motion preferences are respected.

## Verify and deploy

```sh
npm run typecheck
npm test
npm run test:gateway
npm run build
npm start
```

`test:gateway` starts a disposable API stub and an isolated Next.js instance on
port 3302. It tests HttpOnly cookies, token stripping, same-origin writes, the
route allowlist, forwarding policy, and logout without touching real accounts.

The included Dockerfile builds standalone Next.js output and runs as a non-root
user on port 3001. Supply runtime environment variables through your deployment
secrets/configuration. Serve the portal over HTTPS and keep demo mode false for
real customer traffic. The portal is not a static export because its session
and API gateway run on the server.

No live deployment or real financial transaction is performed by this setup.

## Core API namespace transition

The upstream is now **marketbot-api**, using `/v1/*`. Backoffice uses the separate
`/backoffice/v1/*` namespace and cookie authentication. There is no dependency on
the mini app server. Set `MARKETBOT_API_URL` to the core origin (without a path).

The core API currently implements customer SMS login, profile, wallet/ledger
reads, bank destinations, and market data. Customer trading mutations, auctions,
deposits and withdrawals still need core handlers; keep preview mode enabled
until those workflows are implemented and verified. A prepared database alone
does not enable those HTTP routes. See the core README for migration 004 and SMS
configuration; this work has not been deployed to production.
# marketbot-frontend
# marketbot-frontend
# marketbot-frontend
