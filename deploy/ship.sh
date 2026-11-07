#!/usr/bin/env bash
set -euo pipefail
: "${FRONTEND_DEPLOY_PATH:?}" "${IMAGE:?}" "${FRONTEND_ENV:?}"
[[ "$FRONTEND_DEPLOY_PATH" =~ ^/[a-zA-Z0-9/_-]+$ && "$FRONTEND_DEPLOY_PATH" != / ]] || { echo 'Use an absolute deployment path without spaces or shell characters'; exit 1; }
release="$FRONTEND_DEPLOY_PATH/releases/$GITHUB_RUN_ID-$GITHUB_RUN_ATTEMPT"
umask 077
trap 'rm -f env.out' EXIT
printf '%s\n' "$FRONTEND_ENV" > env.out
sed -i '/^MARKETBOT_FRONTEND_IMAGE=/d' env.out
# Use the exact local image ID: loading it on the host needs no registry access,
# and a mutable remote tag cannot change which image is activated.
image_id=$(docker image inspect --format '{{.Id}}' "$IMAGE")
printf '\nMARKETBOT_FRONTEND_IMAGE=%s\n' "$image_id" >> env.out
FRONTEND_ENV_FILE=env.out MARKETBOT_FRONTEND_IMAGE="$image_id" docker compose --env-file env.out -f docker-compose.prod.yml config -q
ssh target "umask 077; mkdir -p '$release'"
scp docker-compose.prod.yml "target:$release/docker-compose.yml"
scp env.out deploy/activate.sh "target:$release/"
ssh target "mv '$release/env.out' '$release/.env'; chmod 600 '$release/.env'"
docker save "$IMAGE" | gzip -1 | ssh target 'gunzip | docker load'
ssh target "cd '$release'; bash activate.sh"
printf 'Deployed image %s\n' "$image_id"
