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

## Live zero-traffic Cloud Run rehearsal and current request/history comparison

PR #111 merged as `cc31823a1fbb9f9810790324e3a806e255e02633`. Actions run #46136439520 deployed main revision `approvals-r46136439520-1` with 100% traffic. The published enum-compatible image was deployed separately as revision `approvals-lab7rb28`, tagged `lab7rb28`, at 0% traffic. Cloud Run reported the revision Ready and ContainerHealthy. The main revision continued receiving all service traffic.

Read-only calls to the candidate returned HTTP 200 for health, version (source SHA `0334c966c396912dfaf2e309e044753f11d4e47c`), requester1 login, request list, request #22 detail, and request #22 history. Request #22 remained `WITHDRAWN`, reviewer unassigned, with both events intact (`null -> PENDING`, then `PENDING -> WITHDRAWN`).

Reviewer1 listed all 24 reviewer-visible requests and their complete API histories from both the current main revision and the tagged rollback candidate. Both returned 24 records with state counts APPROVED 8, IN_REVIEW 3, PENDING 5, REJECTED 6, WITHDRAWN 2. SHA-256 of the serialized request/history sets was identical on both: `729fcf1fc127970bb9c746d8ecf1853d3b0b241b22877cfda6719e7f8978c59e`. No mutations were performed during comparison. Machine-readable observations are in `rollback-live-revision-2026-11-28.json`.

## Acceptance disposition

Scoped operational rollback and current request/history equivalence acceptance **passed**: the compatible target passed isolated tests and a live zero-traffic Cloud Run rehearsal; the release guard was merged; and the complete reviewer-visible set of requests and histories matched across main and candidate. The exact unmodified historical image remains incompatible and must not be selected. Main stayed at 100% traffic and the candidate stayed at 0% during the rehearsal.

The comparison proves current equality across the two revisions for the 24 reviewer-visible records and their exposed histories, not equality for inaccessible database tables or a global pre/post-migration state. No complete database-wide pre-rollout export was retained. Preserve that limitation in the submission.
