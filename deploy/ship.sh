#!/usr/bin/env bash
set -euo pipefail
: "${FRONTEND_DEPLOY_PATH:?}" "${IMAGE:?}" "${FRONTEND_ENV:?}"
[[ "$FRONTEND_DEPLOY_PATH" =~ ^/[a-zA-Z0-9/_-]+$ && "$FRONTEND_DEPLOY_PATH" != / ]] || { echo 'Use an absolute deployment path without spaces or shell characters'; exit 1; }
release="$FRONTEND_DEPLOY_PATH/releases/$GITHUB_RUN_ID-$GITHUB_RUN_ATTEMPT"
umask 077
trap 'rm -f env.out' EXIT
printf '%s\n' "$FRONTEND_ENV" > env.out
sed -i '/^MARKETBOT_FRONTEND_IMAGE=/d' env.out
# Resolve once, then save a private tag for this content. Docker image IDs can
# differ between containerd and classic stores after save/load; tags survive.
image_id=$(docker image inspect --format '{{.Id}}' "$IMAGE")
release_image="marketbot-frontend-release:${image_id#sha256:}"
docker tag "$image_id" "$release_image"
printf '\nMARKETBOT_FRONTEND_IMAGE=%s\n' "$release_image" >> env.out
FRONTEND_ENV_FILE=env.out MARKETBOT_FRONTEND_IMAGE="$release_image" docker compose --env-file env.out -f docker-compose.prod.yml config -q
echo 'Uploading release configuration…'
ssh target "umask 077; mkdir -p '$release'"
scp docker-compose.prod.yml "target:$release/docker-compose.yml"
scp env.out deploy/activate.sh "target:$release/"
ssh target "mv '$release/env.out' '$release/.env'; chmod 600 '$release/.env'"
SECONDS=0
# Send the content-specific tag so a concurrent source-tag update cannot change it.
if [ -n "${LOCAL_REGISTRY:-}" ]; then
  # Pin the runner's resolved digest so a moving tag cannot change the release.
  digest_ref=$(docker image inspect --format '{{index .RepoDigests 0}}' "$image_id")
  [[ "$digest_ref" =~ ^[a-zA-Z0-9][a-zA-Z0-9._/:@-]+$ ]] || exit 1
  ssh target "docker pull '$digest_ref' && docker tag '$digest_ref' '$release_image'"
else
  DEPLOY_PATH="$FRONTEND_DEPLOY_PATH" IMAGE="$release_image" bash deploy/ship-images.sh
fi
ssh target "docker image inspect '$release_image' >/dev/null"
echo "Image preparation, transfer and loading took ${SECONDS}s"
SECONDS=0
echo 'Activating release and checking readiness…'
ssh target "cd '$release'; bash activate.sh"
echo "Release activation took ${SECONDS}s"
printf 'Deployed image %s\n' "$release_image"
