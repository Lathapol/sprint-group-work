# Lab 5 release and persistence evidence

## Release procedure

The `Deploy approval app` workflow in `.github/workflows/deploy.yml` runs when a reviewed release PR reaches `main`. It reruns the existing build, database-backed API tests, browser workflow and Docker build through the reusable PR CI workflow. Only a successful quality job can proceed to deployment.

The deploy job uses environment `demo` and exchanges a GitHub OIDC token for the configured GCP deployer identity. It builds and pushes separate runtime and migration images tagged with the full release commit. `deploy/release.sh` resolves their immutable digests, updates and executes the migration job, then updates the service. The migration job runs only Prisma migrations, so releases preserve existing account passwords and demo data.

Every run creates a fresh Cloud Run revision, including when reusing an image. `/api/version` reports the full commit supplied as RELEASE_COMMIT. The workflow summary records the commit, immutable runtime image, serving revision and public URL. The read-only smoke test verifies that the public UI loads, PostgreSQL health succeeds and the commit matches.

To repeat a normal release, use a feature branch, teammate-reviewed PR into `sprint-1-staging`, and teammate-reviewed release PR into `main`. The required `test-and-docker` check and up-to-date branch policy apply on both branches. Merge main into the working branch as needed before review. Authors cannot approve their own PRs.

For rollback or roll-forward, open Actions, select Deploy approval app, choose Run workflow on branch main, and enter the full SHA of a previously built pipeline image in image_tag. This reuses the stored digest and skips build, tests and migration. It preserves the current database schema. Use images from releases that provide `/api/version`. Leave image_tag empty to rerun the full quality/build/migrate/release path for current main.

## Evidence still to collect

Issue #41 requires the reviewed feature PR, reviewed release PR, successful workflow run, image digest, matching Cloud Run revision/commit, and the visible Team approvals / Cloud release label on the public app. Federation authentication is configured but its first live workflow execution remains to be verified.

For issue #42, create a uniquely named synthetic request on the public app and record its ID and fields. Capture the page and commit before the restart, after a fresh application revision using the same image, and after a separate pipeline build/redeploy. Reuse the same signed-in session to check that PostgreSQL-backed sessions persist as well. Record the revisions, workflow links, commit and observation at each stage. Keep the record as grading evidence. A database backup, schema migration or successful health check alone does not establish application-data persistence.

The initial manual deployment is recorded in deployment.md. This file will receive the actual release and persistence observations after verification.
