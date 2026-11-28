# Lab 7 rollback compatibility and selected data-equivalence - 2026-11-28

## Published compatible target

- Registry image tag: `asia-southeast1-docker.pkg.dev/vertical-set-514506-g8/approvals/app:rollback-0334c966c396912dfaf2e309e044753f11d4e47c`
- Immutable digest: `sha256:a01e2edf25c473a1082da316725683128dc91c8635cdb004516945e4b7cfb44a`
- Source application commit: `0334c966c396912dfaf2e309e044753f11d4e47c`.
- Image labels were verified after pulling by digest: `com.lathapol.rollback-compatible=true` and `org.opencontainers.image.revision=0334c966c396912dfaf2e309e044753f11d4e47c`.
- Image is rebuilt from historical app source with only the Prisma `RequestState` enum addition `WITHDRAWN` (`rollback-compatible-schema.patch`). It includes no migration image; rollback selection must skip migrations.

## Rehearsal environment and fixture

- Fresh disposable Docker PostgreSQL 18 database and private network; no production DB or Cloud Run traffic changes.
- Applied current migrations, seeded synthetic accounts only, then inserted synthetic request ID 5 in `WITHDRAWN` state with two history events (PENDING, WITHDRAWN).
- Ran the exact published image digest against that DB. Synthetic `requester1` login returned HTTP 200, list HTTP 200, and detail HTTP 200. The request remained `WITHDRAWN`, amount 25.50, reviewer unassigned.
- Earlier test with the unmodified historical image (same source commit without enum compatibility patch) returned HTTP 500 on `GET /api/requests` for a DB containing a WITHDRAWN row. Do not use that image.

## Acceptance results

| Check | Result |
|---|---|
| Unmodified old image rollback | FAIL: request list returned HTTP 500 when a WITHDRAWN row existed. |
| Published enum-compatible image | PASS: verified label/source SHA; authenticated list and detail returned 200 and read WITHDRAWN. |
| Selected data equivalence | PASS: SHA-256 over serialized all `Request` and `RequestHistory` rows before/after the published-image read was identical: `53F8209CC4A674F322E6AB332C75D01136DC5C37652C2BCD00FC96F48ED9B5CA`. Synthetic row 5 and both events were retained. |
| Existing live selected-record comparison | PASS for synthetic requests #22-#24 across revisions #14/#15, as recorded in `live-checks-2026-11-28.md`; this is not a full database-wide comparison. |
| Release selection guard | Local release tests: 5 passed. New deployment rejects bare historical image tags, accepts only `rollback-<sha>`, validates compatibility/source labels, reuses the exact digest, skips migrations, and records original source SHA. |

## Remaining operational step

The compatible image is published. Release/build workflow changes are implemented locally and covered by five targeted release tests. They are not yet merged into the repository's main deployment workflow, and no Cloud Run revision was created for the rollback candidate. After the code change is reviewed/merged, run the rollback deployment as a no-traffic revision and verify health/version before marking operational rollback readiness accepted. One rollback-compatible image was added to Artifact Registry. No production Cloud Run service/traffic or database was changed.
