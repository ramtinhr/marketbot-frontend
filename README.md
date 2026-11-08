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
  app/globals.css      Tailwind entry, theme tokens, document defaults and keyframes
scripts/
  check-gateway.mjs    Isolated integration test for the real Next.js gateway
```

Routes: `/`, `/markets`, `/trade/USDT_IRT`, `/wallet`, `/orders`,
`/bank-accounts`, `/settings`, and `/login`. Browser navigation and refresh use
native Next.js routing. Desktop uses a persistent sidebar; smaller screens use
an off-canvas menu and page layouts adapt without stretching the mini app.

Styling uses Tailwind CSS v4 through PostCSS. Components use utility classes;
`lib/ui-styles.ts` holds shared conditional recipes. `data-ui` attributes provide
structural and state hooks for Tailwind descendant variants. Keep utility strings
complete so Tailwind can discover them. Dynamic bank colors and chart values use
CSS variables or inline styles.

Server state is managed by TanStack Query (caching, polling, mutations and
invalidation). React Context shares demo configuration and notifications; local
form and dialog state stays in React components.

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

## GitHub CI/CD

The workflows follow the sibling API/dashboard/miniapp infrastructure: GHCR
images and manual SSH deployment to the shared Linux amd64 host. Deploy has two
methods: **source** (default) sends a small commit archive and builds on the host;
**image** transfers the tested CI image over SSH as before. Neither needs GHCR
credentials or a GitHub checkout key on the server.

CI and deployment orchestration use GitHub-hosted `ubuntu-latest` runners;
source-mode image builds run on the production host. No self-hosted runner is required. Node 24 is installed
by `actions/setup-node`; deployment connects to production using the configured
SSH secrets.

### Faster source deployment

Run **Deploy** on `main` after CI passes, leaving `delivery=source`. This builds
that workflow run's exact commit, not a moving branch; `image_tag` is ignored.
Only committed source is uploaded. Local edits, `.git`, `node_modules`, and local
env files are excluded. Runtime secrets are uploaded separately, outside the
Docker build context. No server-side `git pull` or repository key is needed.

The host needs Docker with BuildKit, Compose v2, Bash, tar/gzip, enough CPU/RAM
and disk for a Next.js build, and access to Docker Hub and the npm registry.
The first build downloads the base image and dependencies. Later builds reuse
Docker layers, the npm download cache, and the Next.js build cache. Keep Docker's
build cache between releases; pruning it makes the next build cold. Source
transfer, server build, and activation durations are logged separately. This
removes the large runner-to-server image upload; actual speed depends on the
host's build resources and registry connectivity.

The existing container serves traffic during upload/build. A failed build does
not activate a release. Successful builds use the existing health check and
rollback. Each build has a unique release tag, preserving previous images for
rollback. Source mode rebuilds the commit on the host rather than deploying the
identical CI image. Choose `delivery=image` when that identity is required or
the host cannot build. For a source rollback, select image mode with an earlier
successful CI image tag. Deploy remains manual; no release is triggered by this
configuration change.

### CI image delivery (fallback)

Install `rsync` on both the runner and production host (`apt install rsync` on
Ubuntu/Debian) to enable incremental image transfers. The first deployment seeds
`/opt/marketbot-frontend/.image-cache` (under `FRONTEND_DEPLOY_PATH` if overridden);
later deployments transfer changed image content only. Logs show transfer
statistics and separate transfer/load and activation durations. Image saving,
checksum scans and Docker loading still run locally on every deployment.
Without `rsync` on either machine, deployment logs a warning and sends a full
gzip archive. Leave space for the extracted cache as well as Docker images;
removing the cache makes the next deployment transfer all content again.

CI runs for PRs and pushes to `main`: Node 24, locked dependency installation,
typecheck, unit tests, real gateway integration tests, deployment syntax checks,
and a standalone Docker build with a `/login` smoke test. Only successful main
builds publish `sha-<full commit SHA>` and `latest`. PRs receive no deployment
secrets and do not publish. External actions are SHA-pinned; Dependabot proposes
updates to actions, Docker and npm dependencies.

Telegram notifications match the other MarketBot projects: pushes to `main` report
CI and image results, and manual deployments report success, failure, or cancellation.
Configure repository secrets `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID_CICD`
(the numeric destination chat ID) to enable them. Missing secrets skip sending;
Telegram errors produce warnings without failing CI or deployment.

Configure the GitHub `production` environment with these secrets:

| Secret | Value |
| --- | --- |
| `SSH_HOST` | Production hostname or IPv4 address |
| `SSH_USER` | Deployment user with Docker and deployment-directory access |
| `SSH_PRIVATE_KEY` | Dedicated SSH private key |
| `SSH_KNOWN_HOSTS` | Host key verified through a trusted channel |
| `FRONTEND_ENV` | Runtime dotenv configuration, example below |

Set environment variable `FRONTEND_DEPLOY_PATH` to an absolute dedicated directory
such as `/opt/marketbot-frontend`; optional `SSH_PORT` defaults to `22`.
`GITHUB_TOKEN` supplies GHCR access automatically. Allow this repository to read
its package if package access settings require it. Set branch protection to
require both CI jobs, restrict the production environment to `main`, and configure
reviewers there if your release process requires them.

Example `FRONTEND_ENV` (no build-time secrets needed):

```dotenv
FRONTEND_PORT=3001
MARKETBOT_API_URL=http://127.0.0.1:8080
MARKETBOT_APP_ORIGIN=https://portal.example.com
MARKETBOT_TRUST_INGRESS=true
```

Deploy the API first. The host needs Bash, gzip, Docker Engine and Compose v2
supporting `up --wait --wait-timeout`. The service uses host networking and binds
only to loopback; configure your HTTPS reverse proxy separately to forward the
portal domain to `127.0.0.1:3001`, overwrite `X-Real-IP`, and preserve the public
Host. The sibling API's dashboard `WEB_DOMAIN` is a different app; this workflow
does not change that proxy or provision a portal certificate. Set ingress trust
to false unless the trusted proxy is configured. Demo mode is forced off.

For image delivery, run **Deploy** on `main` with `delivery=image`, selecting
`sha-<full commit SHA>` from a successful CI run. `latest` is supported but explicit commit tags make releases
easier to audit. Each deployment stores a private release directory and activates
a content-specific release tag that survives transfer between Docker image stores.
Compose waits for `/login` health before updating
`current`; failed activation restores the previous release and reports failure.
First-deployment failure stops the failed service. This checks frontend readiness;
it does not verify live SMS, payments, or all upstream API features. A single
container restart can briefly interrupt traffic.

Image delivery retains the 360-minute (6-hour) job allowance for slow uploads
over SSH, the maximum execution time for a GitHub-hosted runner. This replaces the earlier
180-minute cutoff; GitHub still enforces its 6-hour limit. For
example, transferring 235 MB at 40 kB/s takes about 98 minutes before image
loading and activation. If a run ends with `The operation was canceled` during
upload, check the job conclusion for a timeout or manual cancellation. Install
rsync on both runner and host to reuse unchanged layers and retain partial
uploads under `.image-cache` for the next run. Rerun with the same explicit image
tag to reuse that content; activation only starts after the image is loaded.

For a deliberate rollback, run Deploy with an earlier successful image tag.
Retain previous release directories and Docker images for automatic rollback;
do not run image pruning during deployment. Runtime secrets remain in mode-600
files under mode-700 release directories. No live deployment is triggered by
adding these workflows.

## Rial peer payments

`/p2p` (also linked from Wallet) opens a responsive market of available requests, with amount filtering, sorting and explicit reservation of a chosen request. Separate sections contain request creation and personal payment/order history. Deploy the API with `GET /v1/p2p/market` support before this frontend.

The flow supports funded receive requests, exclusive
2-minute payment selections across one or several requests, separate bank receipts,
receiver confirmation, disputes and 30-minute escalation to the existing admin
queue. This market shares the Mini App's orders, balances and reservation lock.
Run the API's `006_customer_p2p` migration with `npm run migrate` before deploying
the updated frontend. Customer API routes and operational details are documented
in `marketbot-api/docs/customer-p2p.md`. Demo mode stays read-only.

Bank deposits use the API's provider-neutral `/v1/payments` routes. The wallet
form loads gateway availability/limits, sends a durable customer-scoped retry
key, and opens the checkout URL. Returning to `/wallet?payment=<local UUID>`
verifies the owned payment through the API. Bank deposit history supports status
checks and resuming checkout. Demo mode sends no payment requests. Set payment
credentials and `PAYMENT_RETURN_URL` only on marketbot-api; see its
`docs/customer-payments.md` for migration 007 and webhook setup. The frontend
needs no payment gateway credentials.

Trading uses the customer API's `/v1/orders`, `/v1/trades`, and `/v1/auction/*`
endpoints. Exchange orders go through the existing Kafka exchange bridge and
matching engine. `/api/live` proxies the authenticated WebSocket to
`/v1/market/ws` using the server's runtime `MARKETBOT_API_URL`; the session stays
in its HttpOnly cookie. The ingress must allow WebSocket upgrades on `/api/live`.
Polling remains enabled to reconcile disconnects.

Deploy the matching `marketbot-api` changes and run its `npm run migrate` before
using trading. Migration `011_customer_trading` keeps the Mini App's existing
auction tables and adds commit notifications. The Mini App hub change consumes
those notifications too, so auction changes from either service reach both
clients. Both services must use the same exchange database and Kafka topics.
