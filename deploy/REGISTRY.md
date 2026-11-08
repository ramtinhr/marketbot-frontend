# GitHub Container Registry

CI publishes the tested frontend image only to GitHub Container Registry (GHCR):
`ghcr.io/<GitHub owner>/<repository>:sha-<full commit SHA>` and `:latest`.
Publishing uses the built-in `GITHUB_TOKEN`; no private registry credentials are
required.

Source delivery (the default) builds an uploaded commit archive on the host and
skips GHCR entirely. See the README for host requirements and caching.

For `delivery=image`, run CI on main to publish an image before deploying.
Production deployments remain manual and use the selected GHCR tag. The
deployment runner authenticates with `GITHUB_TOKEN`, pulls the image, and transfers it over SSH to the server.
The server does not need GHCR credentials. Existing health checks still apply.

The workflows ignore the old `LOCAL_REGISTRY` variable and `LOCAL_REG_USER` /
`LOCAL_REG_PASS` secrets. These can be removed from the repository and production
environment settings if no other workflows use them.
