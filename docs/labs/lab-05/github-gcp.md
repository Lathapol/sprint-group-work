# GitHub merge gate and GCP federation

## Branch protection

Ruleset `Lab 5 reviewed and tested releases` (ID 27124596) is active on `main` and `sprint-1-staging`, with an empty bypass list. Both branches require a PR, one approving teammate review, approval of the latest push, resolved review threads, an up-to-date branch and a passing `test-and-docker` status. Stale approvals are dismissed. Branch deletion and force pushes are blocked. The PR author cannot approve their own changes.

The setting is visible at https://github.com/Lathapol/sprint-group-work/settings/rules/27124596 . The normal release path remains reviewed feature PR into sprint-1-staging, then reviewed release PR into main. Merge main back into staging when necessary to keep the release branch up to date.

## Temporary failing-check evidence

PR https://github.com/Lathapol/sprint-group-work/pull/46 is an intentional C-02 / R-06 failure. Its temporary branch adds one assertion failure in `test/lab5-required-check.test.cjs`. Never merge it. Preserve its commit, PR and Actions history, and capture the required failed check plus blocked merge control before closing it.

The failing-check run is https://github.com/Lathapol/sprint-group-work/actions/runs/43235469556 . It completed with `test-and-docker` FAILURE at commit `91d7f2e34a343596f457d64018db692219c7f3cb`. GitHub reports the PR merge state as BLOCKED. The earlier successful CI run on reviewed PR #44 is https://github.com/Lathapol/sprint-group-work/actions/runs/43210326057 . The intentionally failing test exists only on its evidence branch. The signed-out in-app browser does not display merge controls, so capture the blocked merge screenshot from a signed-in collaborator session for the final PDF.

## GitHub deployment environment

Environment `demo` permits deployment only from branch `main`. It has four public configuration variables, with runtime credentials kept in GCP Secret Manager.

| Variable | Value |
| --- | --- |
| GCP_PROJECT_ID | vertical-set-514506-g8 |
| GCP_REGION | asia-southeast1 |
| WIF_PROVIDER | projects/389973748230/locations/global/workloadIdentityPools/github-actions/providers/github-main |
| WIF_SERVICE_ACCOUNT | approvals-deployer@vertical-set-514506-g8.iam.gserviceaccount.com |

## Workload Identity Federation

Pool `github-actions` and provider `github-main` use the GitHub OIDC issuer `https://token.actions.githubusercontent.com`. The provider maps the token subject and repository ID. Its trust condition requires all of the following claims.

- Repository ID `1446559361` and owner ID `186375007`.
- Ref `refs/heads/main`.
- Workflow ref `Lathapol/sprint-group-work/.github/workflows/deploy.yml@refs/heads/main`.
- Subject `repo:Lathapol/sprint-group-work:environment:demo`.

The repository principal set can impersonate `approvals-deployer` using `roles/iam.workloadIdentityUser`. The deployer has Artifact Registry Writer on the approvals repository, Cloud Run Developer on the project and Service Account User on approvals-runner. The runtime account retains its existing Cloud SQL and Secret Manager access. No service-account JSON key was created.

The deployment workflow will declare `environment: demo` and job permissions `contents: read` and `id-token: write`, then authenticate through the provider and service account above. Use the exact filename deploy.yml to match the trust condition. The first end-to-end OIDC authentication and automated release remain to be verified in issue #41 after that workflow reaches main.
