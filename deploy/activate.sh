#!/usr/bin/env bash
# Runs on the host inside the uploaded release directory.
set -euo pipefail
release=$(pwd)
root=$(dirname "$(dirname "$release")")
previous=$(readlink -f "$root/current" || true)
compose() { docker compose --project-name marketbot-frontend --env-file .env -f docker-compose.yml "$@"; }
compose config -q
if compose up -d --remove-orphans --wait --wait-timeout 120; then
  ln -sfn "$release" "$root/current.next"
  mv -Tf "$root/current.next" "$root/current"
  compose ps
else
  echo 'Deployment startup/readiness failed; collecting diagnostics before rollback' >&2
  compose ps -a || true
  compose logs --tail 100 || true
  # Compose logs omit healthcheck output, which is often the only failure detail.
  while IFS= read -r container; do
    [[ -n "$container" ]] || continue
    docker inspect --format 'Container {{.Name}} state: {{json .State}}' "$container" || true
  done < <(compose ps -a -q || true)
  if [[ -n "$previous" && "$previous" != "$release" && -f "$previous/docker-compose.yml" ]]; then
    echo 'Restoring previous release'
    cd "$previous"
    compose up -d --remove-orphans --wait --wait-timeout 120
  else
    echo 'No previous release available; stopping failed first deployment'
    compose down
  fi
  exit 1
fi
