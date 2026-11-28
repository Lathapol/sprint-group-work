#!/usr/bin/env bash
set -euo pipefail

: "${GCP_PROJECT_ID:?Set GCP_PROJECT_ID}"
: "${GCP_REGION:?Set GCP_REGION}"
: "${IMAGE_TAG:?Set IMAGE_TAG}"
[[ "${REUSE_IMAGE:-false}" =~ ^(true|false)$ ]] || { echo 'REUSE_IMAGE must be true or false.' >&2; exit 1; }
if [[ "$IMAGE_TAG" =~ ^rollback-([0-9a-f]{40})$ ]]; then
  SOURCE_COMMIT="${BASH_REMATCH[1]}"
  RELEASE_MODE="rollback-compatible"
  [[ "$REUSE_IMAGE" == true ]] || { echo 'Rollback compatibility images must be reused without migrations.' >&2; exit 1; }
elif [[ "$IMAGE_TAG" =~ ^[0-9a-f]{40}$ ]]; then
  SOURCE_COMMIT="$IMAGE_TAG"
  RELEASE_MODE="standard"
  [[ "$REUSE_IMAGE" == false ]] || { echo 'Bare historical images are blocked; use a published rollback-<source-sha> compatibility image.' >&2; exit 1; }
else
  echo 'IMAGE_TAG must be a full commit SHA or rollback-<full-source-sha>.' >&2
  exit 1
fi
IMAGE_BASE="${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/approvals"
APP_DIGEST="$(gcloud artifacts docker images describe "${IMAGE_BASE}/app:${IMAGE_TAG}" --project="$GCP_PROJECT_ID" --format='value(image_summary.digest)')"
[[ "$APP_DIGEST" =~ ^sha256:[0-9a-f]{64}$ ]] || { echo 'Runtime image not found.' >&2; exit 1; }
APP_IMAGE="${IMAGE_BASE}/app@${APP_DIGEST}"
if [[ "$RELEASE_MODE" == rollback-compatible ]]; then
  docker pull "$APP_IMAGE" >/dev/null
  COMPATIBLE_LABEL="$(docker image inspect "$APP_IMAGE" --format='{{ index .Config.Labels "com.lathapol.rollback-compatible" }}')"
  IMAGE_SOURCE="$(docker image inspect "$APP_IMAGE" --format='{{ index .Config.Labels "org.opencontainers.image.revision" }}')"
  [[ "$COMPATIBLE_LABEL" == true && "$IMAGE_SOURCE" == "$SOURCE_COMMIT" ]] || { echo 'Rollback image compatibility/source labels do not match the requested target.' >&2; exit 1; }
fi

if [[ "${REUSE_IMAGE:-false}" == false ]]; then
  MIGRATION_DIGEST="$(gcloud artifacts docker images describe "${IMAGE_BASE}/migration:${IMAGE_TAG}" --project="$GCP_PROJECT_ID" --format='value(image_summary.digest)')"
  [[ "$MIGRATION_DIGEST" =~ ^sha256:[0-9a-f]{64}$ ]] || { echo 'Migration image not found.' >&2; exit 1; }
  gcloud run jobs update approvals-migrate --image="${IMAGE_BASE}/migration@${MIGRATION_DIGEST}" --command=./node_modules/.bin/prisma --args=migrate,deploy --remove-secrets=SEED_PASSWORD --region="$GCP_REGION" --project="$GCP_PROJECT_ID" --quiet
  gcloud run jobs execute approvals-migrate --wait --region="$GCP_REGION" --project="$GCP_PROJECT_ID" --quiet
fi

gcloud run services update approvals --image="$APP_IMAGE" --revision-suffix="r${GITHUB_RUN_ID:-$(date +%s)}-${GITHUB_RUN_ATTEMPT:-1}" --update-env-vars="RELEASE_COMMIT=${SOURCE_COMMIT}" --update-labels="commit-sha=${SOURCE_COMMIT},release-mode=${RELEASE_MODE}" --region="$GCP_REGION" --project="$GCP_PROJECT_ID" --quiet
SERVICE_URL="$(gcloud run services describe approvals --region="$GCP_REGION" --project="$GCP_PROJECT_ID" --format='value(status.url)')"
SERVICE_REVISION="$(gcloud run services describe approvals --region="$GCP_REGION" --project="$GCP_PROJECT_ID" --format='value(status.latestReadyRevisionName)')"
[[ "$SERVICE_URL" == https://* && -n "$SERVICE_REVISION" ]] || { echo 'Release metadata is missing.' >&2; exit 1; }
if [[ -n "${GITHUB_ENV:-}" ]]; then
  printf 'APP_IMAGE=%s\nSERVICE_URL=%s\nSERVICE_REVISION=%s\nRELEASE_COMMIT=%s\nRELEASE_MODE=%s\n' "$APP_IMAGE" "$SERVICE_URL" "$SERVICE_REVISION" "$SOURCE_COMMIT" "$RELEASE_MODE" >> "$GITHUB_ENV"
fi
printf 'Released image tag %s (source commit %s) as %s at %s\n' "$IMAGE_TAG" "$SOURCE_COMMIT" "$SERVICE_REVISION" "$SERVICE_URL"
