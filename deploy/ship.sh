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
echo 'Uploading release configuration…'
ssh target "umask 077; mkdir -p '$release'"
scp docker-compose.prod.yml "target:$release/docker-compose.yml"
scp env.out deploy/activate.sh "target:$release/"
ssh target "mv '$release/env.out' '$release/.env'; chmod 600 '$release/.env'"
SECONDS=0
# Send the inspected image ID so a concurrent tag update cannot change it.
if [ -n "${LOCAL_REGISTRY:-}" ]; then
  # Pin the runner's resolved digest so a moving tag cannot change the release.
  digest_ref=$(docker image inspect --format '{{index .RepoDigests 0}}' "$IMAGE")
  [[ "$digest_ref" =~ ^[a-zA-Z0-9][a-zA-Z0-9._/:@-]+$ ]] || exit 1
  ssh target "docker pull '$digest_ref' && docker image inspect '$image_id' >/dev/null"
else
  DEPLOY_PATH="$FRONTEND_DEPLOY_PATH" IMAGE="$image_id" bash deploy/ship-images.sh
fi
echo "Image preparation, transfer and loading took ${SECONDS}s"
SECONDS=0
echo 'Activating release and checking readiness…'
ssh target "cd '$release'; bash activate.sh"
echo "Release activation took ${SECONDS}s"
printf 'Deployed image %s\n' "$image_id"
