# Lab 5 release and persistence evidence

## Release procedure

The `Deploy approval app` workflow in `.github/workflows/deploy.yml` runs when a reviewed release PR reaches `main`. It reruns the existing build, database-backed API tests, browser workflow and Docker build through the reusable PR CI workflow. Only a successful quality job can proceed to deployment.

The deploy job uses environment `demo` and exchanges a GitHub OIDC token for the configured GCP deployer identity. It builds and pushes separate runtime and migration images tagged with the full release commit. `deploy/release.sh` resolves their immutable digests, updates and executes the migration job, then updates the service. The migration job runs only Prisma migrations, so releases preserve existing account passwords and demo data.

Every run creates a fresh Cloud Run revision, including when reusing an image. `/api/version` reports the full commit supplied as RELEASE_COMMIT. The workflow summary records the commit, immutable runtime image, serving revision and public URL. The read-only smoke test verifies that the public UI loads, PostgreSQL health succeeds and the commit matches.

To repeat a normal release, use a feature branch, teammate-reviewed PR into `sprint-1-staging`, and teammate-reviewed release PR into `main`. The required `test-and-docker` check and up-to-date branch policy apply on both branches. Merge main into the working branch as needed before review. Authors cannot approve their own PRs.

For rollback or roll-forward, open Actions, select Deploy approval app, choose Run workflow on branch main, and enter the full SHA of a previously built pipeline image in image_tag. This reuses the stored digest and skips build, tests and migration. It preserves the current database schema. Use images from releases that provide `/api/version`. Leave image_tag empty to rerun the full quality/build/migrate/release path for current main.

## Verified automated release (C-06)

- Issue: [#41](https://github.com/Lathapol/sprint-group-work/issues/41).
- Reviewed pipeline feature: [PR #48](https://github.com/Lathapol/sprint-group-work/pull/48), merged into sprint-1-staging.
- Reviewed staging-to-main release: [PR #49](https://github.com/Lathapol/sprint-group-work/pull/49).
- Release commit: `c502fa49faa9557af7c46b108095a9bb9249bc0c`.
- Successful [deployment run 43610712825](https://github.com/Lathapol/sprint-group-work/actions/runs/43610712825), attempt 2. Quality tests/build passed; GitHub-to-GCP federation, image publication, migration, deployment and live smoke test passed. Attempt 1 failed at OIDC before changing the live service; the subject-format correction is documented in github-gcp.md.
- Runtime image: `asia-southeast1-docker.pkg.dev/vertical-set-514506-g8/approvals/app@sha256:c08b0810cc9bad192315e3e9b8eb5b185bad748411246e650ceb798af3f85da3`.
- Serving revision: `approvals-r43610712825-2`, 100% traffic.
- Live app: https://approvals-ia5ybuqdoq-as.a.run.app/ . The numeric-project URL https://approvals-389973748230.asia-southeast1.run.app/ reaches the same service.
- Read-only /api/version returned the full release commit above. /api/health reported status ok.
- UI shows **Team approvals - Cloud release** (the actual UI uses a middle dot). See [live screenshot](evidence/live-release.jpg), [run screenshot](evidence/deployment-success.jpg) and [revision snapshot](evidence/after-redeploy-revision.json).

## Persistence across restart AND redeploy (C-05)

Issue [#42](https://github.com/Lathapol/sprint-group-work/issues/42) used synthetic request **#6**, created before either operation. Its title is Lab 5 persistence 2026-11-14T14:37:48.523Z, category PURCHASE, amount THB149.75 and state PENDING.

| Observation | Revision | Result |
| --- | --- | --- |
| Before restart | approvals-00001-m64 | Request #6 created; baseline fields recorded. |
| After same-image restart | approvals-restart-1794667103 | Same record and existing requester1 session persisted. |
| After independent pipeline build/redeploy | approvals-r43610712825-2 | Same record and original session persisted; running commit matches release. |

The automated comparison checked id, title, category, amount, justification, state, requesterId and createdAt against the original baseline. The after-redeploy API check reused the privately stored pre-restart requester1 session and did not log in again. The final UI capture was taken separately in the user's signed-in browser; it proves the record is visible, while the API comparison establishes survival of the original session.

Evidence: [before](evidence/before-restart.png), [after restart](evidence/after-restart.png), [after redeploy](evidence/after-redeploy.jpg), [baseline](evidence/baseline.json), [after-redeploy comparison](evidence/after-redeploy-api.json). No passwords, session cookies or federation credential files are included.

See [evidence index](evidence-index.md) for report assembly and the remaining whole-lab evidence scope.
