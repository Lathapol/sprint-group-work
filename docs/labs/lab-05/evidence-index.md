# Lab 5 release evidence index

Scope: issues #41 and #42 and supporting configuration corrections. The PDF is a release/persistence evidence supplement, not a claim that every whole-lab rubric item is complete.

| Rubric part / check | Direct artifact | Verification |
| --- | --- | --- |
| Part 1 / C-01 | [PR #48 CI](https://github.com/Lathapol/sprint-group-work/actions/runs/43605752881) and [release CI](https://github.com/Lathapol/sprint-group-work/actions/runs/43610712825) | Tests and build passed. |
| Part 1 / C-02 | [Temporary failing PR #46](https://github.com/Lathapol/sprint-group-work/pull/46), [failed run](https://github.com/Lathapol/sprint-group-work/actions/runs/43235469556) | Preserved failure; a signed-in blocked-merge screenshot is still a separate whole-lab submission item. |
| Part 2 / C-03 | [Docker/config instructions](deployment.md), [CI workflow](https://github.com/Lathapol/sprint-group-work/blob/c502fa49faa9557af7c46b108095a9bb9249bc0c/.github/workflows/ci-docker.yml) | CI Docker build passed. This supplement does not rerun or claim a new fresh-clone Compose demonstration. |
| Part 3 / C-04 | [First deployment/business workflow](deployment.md#first-live-deployment-evidence-12-november-2026) | Earlier record #5 sign-in, requester 403 and reviewer rejection are documented; not newly exercised here. |
| Part 3 / C-05 | [Before](evidence/before-restart.png), [restart](evidence/after-restart.png), [redeploy](evidence/after-redeploy.jpg), [API comparison](evidence/after-redeploy-api.json) | Request #6 and the original requester session survived both operations. |
| Part 4 / C-06 | [Issue #41](https://github.com/Lathapol/sprint-group-work/issues/41), [PR #48](https://github.com/Lathapol/sprint-group-work/pull/48), [release #49](https://github.com/Lathapol/sprint-group-work/pull/49), [run](https://github.com/Lathapol/sprint-group-work/actions/runs/43610712825), [revision](evidence/after-redeploy-revision.json) | Released c502fa49; visible UI label, immutable digest, 100% serving revision and /api/version match. |

## Team contributions in this evidence trail

- Lathapol Srikhiao (67070503475; Lathapol): authored the pipeline/release PRs and performed the release and persistence verification.
- Kittakorn Poungpien (67070503401; Kittakorn-P): reviewed the release PR; GitHub review history is the source for approval attribution. No equal commit-count claim is made.

No credential values or private browser state are included in this folder. Keep the live service available for grading.
