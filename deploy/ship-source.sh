#!/usr/bin/env bash
# Upload only the checked-out commit; build with the host's persistent Docker cache.
set -euo pipefail
: "${FRONTEND_DEPLOY_PATH:?}" "${FRONTEND_ENV:?}" "${GITHUB_SHA:?}" "${GITHUB_RUN_ID:?}" "${GITHUB_RUN_ATTEMPT:?}"
[[ "$FRONTEND_DEPLOY_PATH" =~ ^/[a-zA-Z0-9/_-]+$ && "$FRONTEND_DEPLOY_PATH" != / ]] || exit 1
[[ "$GITHUB_SHA" =~ ^[a-f0-9]{40}$ && "$GITHUB_RUN_ID" =~ ^[0-9]+$ && "$GITHUB_RUN_ATTEMPT" =~ ^[0-9]+$ ]] || exit 1
[[ "$(git rev-parse HEAD)" == "$GITHUB_SHA" ]] || { echo 'Checkout must match the deployment commit'; exit 1; }
release="$FRONTEND_DEPLOY_PATH/releases/$GITHUB_RUN_ID-$GITHUB_RUN_ATTEMPT"
image="marketbot-frontend-release:source-$GITHUB_SHA-$GITHUB_RUN_ID-$GITHUB_RUN_ATTEMPT"
umask 077
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
printf '%s\n' "$FRONTEND_ENV" > "$work/env.out"
sed -i '/^MARKETBOT_FRONTEND_IMAGE=/d' "$work/env.out"
printf '\nMARKETBOT_FRONTEND_IMAGE=%s\n' "$image" >> "$work/env.out"
FRONTEND_ENV_FILE="$work/env.out" docker compose --env-file "$work/env.out" -f docker-compose.prod.yml config -q
# git archive excludes local files, dependencies, build outputs and .git.
git archive --format=tar.gz --output="$work/source.tar.gz" "$GITHUB_SHA"
echo "Uploading source archive ($(du -h "$work/source.tar.gz" | cut -f1))…"
SECONDS=0
ssh target "umask 077; mkdir -p '$release/source'"
scp "$work/source.tar.gz" "$work/env.out" docker-compose.prod.yml deploy/activate.sh "target:$release/"
ssh target "set -eu; cd '$release'; mv env.out .env; chmod 600 .env; mv docker-compose.prod.yml docker-compose.yml; tar -xzf source.tar.gz -C source; rm source.tar.gz"
echo "Source transfer took ${SECONDS}s"
SECONDS=0
# A failed build never touches the running container. Runtime secrets stay outside context.
ssh target "set -eu; cd '$release'; DOCKER_BUILDKIT=1 docker build --tag '$image' source; docker image inspect '$image' >/dev/null; rm -rf source"
echo "Server build took ${SECONDS}s"
SECONDS=0
ssh target "cd '$release'; bash activate.sh"
echo "Release activation took ${SECONDS}s"
printf 'Deployed commit %s as %s\n' "$GITHUB_SHA" "$image"
