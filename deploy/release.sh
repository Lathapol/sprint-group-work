#!/usr/bin/env bash
set -euo pipefail

: "${GCP_PROJECT_ID:?Set GCP_PROJECT_ID}"
: "${GCP_REGION:?Set GCP_REGION}"
: "${IMAGE_TAG:?Set IMAGE_TAG}"
[[ "$IMAGE_TAG" =~ ^[0-9a-f]{40}$ ]] || { echo 'A full commit SHA is required.' >&2; exit 1; }
[[ "${REUSE_IMAGE:-false}" =~ ^(true|false)$ ]] || { echo 'REUSE_IMAGE must be true or false.' >&2; exit 1; }
IMAGE_BASE="${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/approvals"
APP_DIGEST="$(gcloud artifacts docker images describe "${IMAGE_BASE}/app:${IMAGE_TAG}" --project="$GCP_PROJECT_ID" --format='value(image_summary.digest)')"
[[ "$APP_DIGEST" =~ ^sha256:[0-9a-f]{64}$ ]] || { echo 'Runtime image not found.' >&2; exit 1; }

if [[ "${REUSE_IMAGE:-false}" == false ]]; then
  MIGRATION_DIGEST="$(gcloud artifacts docker images describe "${IMAGE_BASE}/migration:${IMAGE_TAG}" --project="$GCP_PROJECT_ID" --format='value(image_summary.digest)')"
  [[ "$MIGRATION_DIGEST" =~ ^sha256:[0-9a-f]{64}$ ]] || { echo 'Migration image not found.' >&2; exit 1; }
  gcloud run jobs update approvals-migrate --image="${IMAGE_BASE}/migration@${MIGRATION_DIGEST}" --command=./node_modules/.bin/prisma --args=migrate,deploy --remove-secrets=SEED_PASSWORD --region="$GCP_REGION" --project="$GCP_PROJECT_ID" --quiet
  gcloud run jobs execute approvals-migrate --wait --region="$GCP_REGION" --project="$GCP_PROJECT_ID" --quiet
fi

APP_IMAGE="${IMAGE_BASE}/app@${APP_DIGEST}"
gcloud run services update approvals --image="$APP_IMAGE" --revision-suffix="r${GITHUB_RUN_ID:-$(date +%s)}-${GITHUB_RUN_ATTEMPT:-1}" --update-env-vars="RELEASE_COMMIT=${IMAGE_TAG}" --update-labels="commit-sha=${IMAGE_TAG}" --region="$GCP_REGION" --project="$GCP_PROJECT_ID" --quiet
SERVICE_URL="$(gcloud run services describe approvals --region="$GCP_REGION" --project="$GCP_PROJECT_ID" --format='value(status.url)')"
SERVICE_REVISION="$(gcloud run services describe approvals --region="$GCP_REGION" --project="$GCP_PROJECT_ID" --format='value(status.latestReadyRevisionName)')"
[[ "$SERVICE_URL" == https://* && -n "$SERVICE_REVISION" ]] || { echo 'Release metadata is missing.' >&2; exit 1; }
if [[ -n "${GITHUB_ENV:-}" ]]; then
  printf 'APP_IMAGE=%s\nSERVICE_URL=%s\nSERVICE_REVISION=%s\n' "$APP_IMAGE" "$SERVICE_URL" "$SERVICE_REVISION" >> "$GITHUB_ENV"
fi
printf 'Released commit %s as %s at %s\n' "$IMAGE_TAG" "$SERVICE_REVISION" "$SERVICE_URL"
