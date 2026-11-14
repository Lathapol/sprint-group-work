# Lab 5 deployment

The Workflow and Approval System uses React/Vite, Express, Prisma and PostgreSQL. The runtime image serves the UI and API from one port. PostgreSQL stores sessions, requests and their history. Local Compose keeps its database in a named volume.

| Variable | Purpose | Secret | Value source |
| --- | --- | --- | --- |
| DATABASE_URL | Application and migration database connection | Yes | Local environment, Compose, or GCP Secret Manager |
| PORT | HTTP port, defaults to 3000 | No | Local environment or Cloud Run |
| NODE_ENV | Use production to require HTTPS for session cookies | No | Runtime image; Compose uses development for local HTTP |
| SESSION_TTL_HOURS | Session lifetime, defaults to 8 | No | Runtime environment |
| BCRYPT_ROUNDS | Password hashing cost, defaults to 12 | No | Runtime or seed environment |
| SEED_PASSWORD | Password for synthetic demo accounts | Yes | Local environment, disposable CI fixture, or Secret Manager |
| TEST_DATABASE_URL | Isolated database for integration/browser tests | Yes | Local environment or disposable CI PostgreSQL service |

From a clean clone, run docker compose up --build and open http://localhost:3000. Compose runs migrations before starting the app. Check /api/health for database readiness. To seed demo accounts locally, set SEED_PASSWORD to a disposable value in your shell and run docker compose run --rm -e SEED_PASSWORD migrate node prisma/seed.cjs. Never point the demo seed at real user data. Use docker compose down to stop the stack and retain the volume.

For a native build, run npm ci, npx prisma generate, and npm run build. Set DATABASE_URL before npx prisma migrate deploy and npm start. Run npm test against a separate migrated TEST_DATABASE_URL. Seed that test database, install Chromium with npx playwright install chromium, and run npm run test:e2e with TEST_DATABASE_URL and SEED_PASSWORD set. The PR workflow performs these steps with a disposable database.

The lab release path is a reviewed feature PR into sprint-1-staging, followed by a reviewed release PR into main. Set test-and-docker as a required check once it has run on GitHub. Capture both a passing PR and a blocked temporary PR as evidence.

The team GCP project is `vertical-set-514506-g8`. Region is `asia-southeast1`, service and Artifact Registry repository `approvals`, SQL instance `approvals-pg`, database/user `approvals`, migration job `approvals-migrate`, and runtime account `approvals-runner`.

`deploy/first-deploy.sh` previews its resource plan by default. After signing into the Google Cloud CLI, reviewing the plan and committing the source, `bash deploy/first-deploy.sh --execute` checks billing, enables APIs, provisions resources, generates credentials directly into Secret Manager, builds both images with Cloud Build, executes migrations and seed, deploys by image digest, and checks the public UI and database health. Run from the repository root with Bash, OpenSSL and curl available. Do not enable shell tracing because commands handle secret values. The seed uses the same secret on reruns and restores the demo account passwords to that value.

SQL uses PostgreSQL 16 Enterprise db-f1-micro with 10 GB of storage, storage auto-increase disabled and deletion protection enabled. It incurs charges while running. Cloud Run uses minimum 0 and maximum 3 instances. The verified budget is THB250 for 12–22 November 2026 with email alert thresholds of 10%, 20%, 50% and 90%. Runtime DATABASE_URL and the seed job's SEED_PASSWORD come from Secret Manager. The database password has a separate secret for safe retries of initial user provisioning.

The initial setup requires project permissions to enable services, manage IAM, create secrets and provision SQL/Cloud Run. Cloud Build's selected build service account must be permitted to upload images, read the build source and write logs. Read any permission error before changing roles. Do not paste credentials or connection strings into chat.

On Windows Git Bash, the SDK shell launcher can fail when the installation path contains spaces. Invoke the SDK Python entry point through a shell function if needed, using the installed Windows Python executable and the absolute Windows path to `google-cloud-sdk/lib/gcloud.py`. Export that function before invoking the deploy script. Set MSYS_NO_PATHCONV=1 so Cloud SQL socket paths and the job's /bin/sh command are passed literally. Generated secret values must exclude both carriage returns and newlines. The script now checks that the database password is exactly 48 hexadecimal characters.

## First live deployment evidence, 12 November 2026

Public URL is https://approvals-389973748230.asia-southeast1.run.app . Runtime revision `approvals-00001-m64` serves 100% traffic from source commit `2c4ce6239a8888952ad4bba3b65e482bc26040aa`, the reviewed merge of PR #44. The initial Cloud Build run is https://console.cloud.google.com/cloud-build/builds/4a7e9544-835b-40e5-a259-cf318ab7103f?project=389973748230 . Both images built successfully. Successful migration/seed execution is `approvals-migrate-bk952`.

Verification against the public URL returned UI HTTP 200 and database health `ok`. A demo requester signed in and created synthetic request #5. A requester attempt to claim that request was rejected with HTTP 403. The reviewer signed in, claimed it, and rejected it with a reason. The requester then retrieved the same record with state REJECTED. Credentials were read directly from Secret Manager for this check and were not printed. The record remains as demonstration evidence.

The first migration execution failed authentication because the original generated password retained a Windows carriage return. Fresh clean secret versions were stored, the database user's password was updated to match, and the second execution passed. The local script fix removes both CR and LF from generated values and validates their format before use.

The later release workflow will build from main, run migrations, deploy the image digest and check the live URL. Restart/redeploy persistence evidence and the required failing-PR merge gate remain for the later issues.
