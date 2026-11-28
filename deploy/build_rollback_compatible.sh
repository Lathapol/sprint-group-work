#!/usr/bin/env bash
set -euo pipefail

SOURCE_COMMIT="${1:-}"
[[ "$SOURCE_COMMIT" =~ ^[0-9a-f]{40}$ ]] || { echo 'Pass a full 40-character source commit SHA.' >&2; exit 1; }
: "${GCP_PROJECT_ID:?Set GCP_PROJECT_ID}"
: "${GCP_REGION:?Set GCP_REGION}"
git cat-file -e "${SOURCE_COMMIT}^{commit}" || { echo 'Source commit is not available in this checkout.' >&2; exit 1; }
IMAGE_BASE="${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/approvals"
IMAGE_TAG="rollback-${SOURCE_COMMIT}"
if gcloud artifacts docker images describe "${IMAGE_BASE}/app:${IMAGE_TAG}" --project="$GCP_PROJECT_ID" >/dev/null 2>&1; then
  echo "Refusing to overwrite immutable rollback image ${IMAGE_TAG}." >&2
  exit 1
fi
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT
git archive "$SOURCE_COMMIT" | tar -x -C "$TMP_DIR"
python3 deploy/patch_rollback_schema.py "$TMP_DIR/prisma/schema.prisma"
gcloud auth configure-docker "${GCP_REGION}-docker.pkg.dev" --quiet
docker build \
  --label "org.opencontainers.image.revision=${SOURCE_COMMIT}" \
  --label 'com.lathapol.rollback-compatible=true' \
  -t "${IMAGE_BASE}/app:${IMAGE_TAG}" "$TMP_DIR"
docker push "${IMAGE_BASE}/app:${IMAGE_TAG}"
APP_DIGEST="$(gcloud artifacts docker images describe "${IMAGE_BASE}/app:${IMAGE_TAG}" --project="$GCP_PROJECT_ID" --format='value(image_summary.digest)')"
[[ "$APP_DIGEST" =~ ^sha256:[0-9a-f]{64}$ ]] || { echo 'Published rollback image digest is missing.' >&2; exit 1; }
printf 'Published rollback image %s@%s for source commit %s\n' "${IMAGE_BASE}/app" "$APP_DIGEST" "$SOURCE_COMMIT"
