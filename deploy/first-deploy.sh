#!/usr/bin/env bash
set -euo pipefail

# Preview is the default. Execute only after reviewing the printed resource plan.
PROJECT_ID=vertical-set-514506-g8
REGION=asia-southeast1
SERVICE=approvals
INSTANCE=approvals-pg
REGISTRY=approvals
RUNNER="approvals-runner@${PROJECT_ID}.iam.gserviceaccount.com"
IMAGE_BASE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REGISTRY}"
TAG="$(git rev-parse HEAD)"

if [[ "${1:-}" != --execute ]]; then
  printf '%s\n' \
    "Project: ${PROJECT_ID}; region: ${REGION}; source commit: ${TAG}" \
    'Enable Cloud Run, Cloud SQL, Artifact Registry, Cloud Build and Secret Manager APIs.' \
    'Create registry approvals and service account approvals-runner if absent.' \
    'Create PostgreSQL 16 Enterprise db-f1-micro instance approvals-pg, 10 GB, no storage auto-increase.' \
    'Create approvals database/user and generated credentials in Secret Manager.' \
    'Grant the runtime account Cloud SQL Client and access to the application secrets.' \
    'Build runtime and migration images in Cloud Build, tagged with the source commit.' \
    'Run the schema migration and demo seed job before deploying the service.' \
    'Expose approvals over HTTPS, minimum 0 / maximum 3 instances, 512 MiB memory.' \
    'Cloud SQL incurs usage charges while running. The budget is an alert, not a cap.' \
    'Run bash deploy/first-deploy.sh --execute after reviewing this plan.'
  exit 0
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo 'Commit all changes before building a release.' >&2
  exit 1
fi
if [[ "$(gcloud billing projects describe "$PROJECT_ID" --format='value(billingEnabled)')" != True ]]; then
  echo 'Project billing must be enabled before deployment.' >&2
  exit 1
fi
gcloud services enable run.googleapis.com sqladmin.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com secretmanager.googleapis.com --project="$PROJECT_ID"

if ! gcloud artifacts repositories describe "$REGISTRY" --location="$REGION" --project="$PROJECT_ID" >/dev/null 2>&1; then
  gcloud artifacts repositories create "$REGISTRY" --repository-format=docker --location="$REGION" --project="$PROJECT_ID"
fi
if ! gcloud iam service-accounts describe "$RUNNER" --project="$PROJECT_ID" >/dev/null 2>&1; then
  gcloud iam service-accounts create approvals-runner --project="$PROJECT_ID"
fi
gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:${RUNNER}" --role=roles/cloudsql.client --condition=None >/dev/null

if ! gcloud sql instances describe "$INSTANCE" --project="$PROJECT_ID" >/dev/null 2>&1; then
  gcloud sql instances create "$INSTANCE" --database-version=POSTGRES_16 --edition=ENTERPRISE --tier=db-f1-micro --region="$REGION" --storage-size=10GB --no-storage-auto-increase --deletion-protection --project="$PROJECT_ID"
fi
if ! gcloud sql databases describe approvals --instance="$INSTANCE" --project="$PROJECT_ID" >/dev/null 2>&1; then
  gcloud sql databases create approvals --instance="$INSTANCE" --project="$PROJECT_ID"
fi

create_random_secret() {
  if ! gcloud secrets describe "$1" --project="$PROJECT_ID" >/dev/null 2>&1; then
    openssl rand -hex 24 | tr -d '\n' | gcloud secrets create "$1" --replication-policy=automatic --data-file=- --project="$PROJECT_ID"
  fi
}
create_random_secret approvals-db-password
create_random_secret approvals-seed-password
DB_PASSWORD="$(gcloud secrets versions access latest --secret=approvals-db-password --project="$PROJECT_ID")"
if ! gcloud sql users list --instance="$INSTANCE" --project="$PROJECT_ID" --format='value(name)' | grep -qx approvals; then
  gcloud sql users create approvals --instance="$INSTANCE" --password="$DB_PASSWORD" --project="$PROJECT_ID"
fi
CONNECTION="$(gcloud sql instances describe "$INSTANCE" --project="$PROJECT_ID" --format='value(connectionName)')"
if ! gcloud secrets describe approvals-database-url --project="$PROJECT_ID" >/dev/null 2>&1; then
  printf 'postgresql://approvals:%s@localhost/approvals?host=/cloudsql/%s' "$DB_PASSWORD" "$CONNECTION" | gcloud secrets create approvals-database-url --replication-policy=automatic --data-file=- --project="$PROJECT_ID"
fi
unset DB_PASSWORD
for secret in approvals-database-url approvals-seed-password; do
  gcloud secrets add-iam-policy-binding "$secret" --member="serviceAccount:${RUNNER}" --role=roles/secretmanager.secretAccessor --project="$PROJECT_ID" >/dev/null
done

gcloud builds submit . --config=deploy/cloudbuild.yaml --substitutions="_IMAGE_BASE=${IMAGE_BASE},_TAG=${TAG}" --project="$PROJECT_ID"
MIGRATION_DIGEST="$(gcloud artifacts docker images describe "${IMAGE_BASE}/migration:${TAG}" --project="$PROJECT_ID" --format='value(image_summary.digest)')"
APP_DIGEST="$(gcloud artifacts docker images describe "${IMAGE_BASE}/app:${TAG}" --project="$PROJECT_ID" --format='value(image_summary.digest)')"
[[ "$MIGRATION_DIGEST" == sha256:* && "$APP_DIGEST" == sha256:* ]] || { echo 'Image digest lookup failed.' >&2; exit 1; }
gcloud run jobs deploy approvals-migrate --image="${IMAGE_BASE}/migration@${MIGRATION_DIGEST}" --region="$REGION" --service-account="$RUNNER" --set-cloudsql-instances="$CONNECTION" --set-secrets=DATABASE_URL=approvals-database-url:latest,SEED_PASSWORD=approvals-seed-password:latest --command=/bin/sh --args='-c,./node_modules/.bin/prisma migrate deploy && node prisma/seed.cjs' --tasks=1 --max-retries=0 --project="$PROJECT_ID"
gcloud run jobs execute approvals-migrate --wait --region="$REGION" --project="$PROJECT_ID"
gcloud run deploy "$SERVICE" --image="${IMAGE_BASE}/app@${APP_DIGEST}" --region="$REGION" --service-account="$RUNNER" --add-cloudsql-instances="$CONNECTION" --set-secrets=DATABASE_URL=approvals-database-url:latest --set-env-vars=NODE_ENV=production --port=3000 --min-instances=0 --max-instances=3 --memory=512Mi --allow-unauthenticated --project="$PROJECT_ID"
URL="$(gcloud run services describe "$SERVICE" --region="$REGION" --project="$PROJECT_ID" --format='value(status.url)')"
curl --fail --silent --show-error "${URL}/api/health"
curl --fail --silent --show-error --output /dev/null "$URL"
printf '\nLive URL: %s\nCommit: %s\n' "$URL" "$TAG"
