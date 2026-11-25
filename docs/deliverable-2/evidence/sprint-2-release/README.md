# Sprint 2 deployed release evidence — 25 November 2026

F-06 history, F-07 return/edit/resubmit to the same reviewer and F-08 authorized filters/search are integrated into main and deployed. This record identifies the actual Sprint 2 release and developer verification. It does not assert whole-product independent UAT acceptance, two-student manual execution or completion of Deliverable 2/Sprint 3.

## Exact release identity

| Item | Observed value |
|---|---|
| Main source | `f9a0d2f704c868e4a0b2048f4cc85c2bf8949997` |
| Identifying annotated tag | [`sprint-2-2026-11-25`](https://github.com/Lathapol/sprint-group-work/tree/sprint-2-2026-11-25) points to that main source |
| Release PR | [#82](https://github.com/Lathapol/sprint-group-work/pull/82), merged after history-only sync #83 |
| Deployment | [GitHub run 45629268302](https://github.com/Lathapol/sprint-group-work/actions/runs/45629268302), success |
| GCP | Project `vertical-set-514506-g8`, region `asia-southeast1`, service `approvals` |
| Actual ready revision | `approvals-r45629268302-1`, Ready/Active, 100% traffic |
| Service URL | https://approvals-ia5ybuqdoq-as.a.run.app |
| Also tested service URL | https://approvals-389973748230.asia-southeast1.run.app |
| Service image manifest-list digest | `sha256:ade77e71305f67b5d1bc34ce7de7fec7ab17a064461d82ab93dea3a52799044a` |
| Resolved revision image manifest digest | `sha256:19bd5a1fbd82f633167eda850f31149bda989e3f99e965ec1cd20fbf68baa510` |
| Migration execution | `approvals-migrate-kl55b`, Completed True, one success, completed `2026-11-25T14:05:07.080627Z` |

These two image digests are deliberately distinguished: Docker's actual build log exports manifest `19bd…` and manifest list `ade77…`; the service template references the manifest list, while the immutable Cloud Run revision resolves to the image manifest. See `image-digest-excerpts.log`, `service-release.json` and `revision.json`. The revision's commit-sha label and public `/api/version` both report the exact source above.

`deployment-run.json` records actual jobs/steps. The quality job built/tested the main release: **22 Node/API tests passed, 0 failed/skipped; all 4 browser tests passed; Docker build passed**. Actual main-run excerpts include meaningful F-07 same-reviewer and F-08 combination assertions in `ci-result-excerpts.log`; detailed earlier RED/GREEN remains in sibling F06/F07/F08 evidence folders. No fresh local test counts are invented for this evidence-only change.

The existing pipeline migrated before switching the runtime image and passed read-only live UI/database/version smoke. An additional `python deploy/smoke_test.py <tested-url> f9a0d2f704c868e4a0b2048f4cc85c2bf8949997` execution also passed after release.

## Pre-existing data survived the deployment

Before any new migration, requester1's existing synthetic UAT request #13 was read at the previous source `3846a503893d6f5fc0fcfb602e79883fc7eab0d6`. The complete public request resource was saved at `2026-11-25T13:29:43.954Z` in `predeploy-request-13.json`.

After deployment, fresh authenticated reads compared every field and nested public actor projection with that snapshot. It remained **Pending, Purchase, THB25.5, Unassigned**, with the same title, justification, IDs, creation/update times and null decision fields. Its full resource SHA-256 remained:

`d0be45c5fbe92c5c79544af75176b6e379716a861f9c95b9f653d7ac8c3a2738`

The same comparison passed again after the new synthetic journeys. Live UI `ui-03-retained-13` also shows this existing record and its original Created -> Pending history. This is real persistence across the deployed revision/migration, not a claim that an in-process app instance was a container restart. It is one controlled existing-record comparison, not a whole-database backup/count comparison or pre/post history equality proof: the prior app had no history read endpoint. No existing request was edited by these checks.

## Actual live API verification — 43 recorded calls, PASS

`live-api-verification.json` contains actual request method/path, synthetic actor label, HTTP status and public response for **43 calls**, with assertions executed by `live-check.cjs`. Login/session values are not recorded. Requests #16 and #17 were created specifically for this verification and are retained.

| Scenario | Actual result |
|---|---|
| Original Sprint 1 journey, new #16 | Invalid zero amount 400, valid submission 201, reviewer1 claim 200, blank rejection reason 400, valid rejection 200; owner retrieved Rejected; terminal edit 409; history exactly Pending -> In Review -> Rejected. |
| F-07 return/edit/resubmit, new #17 | Submitted and claimed by reviewer1; blank return reason 400, valid return 200; Returned retained reviewer; amount edited from THB10.25 to THB17.75 with one same-state edit audit event; no-op edit did not append history or change the returned resource. |
| Negative edit/identity checks | requester2 edit 404; Reviewer edit 403; zero amount and protected state injection 400; before/after Returned resource unchanged. Forged reviewerId in resubmit body 400. |
| Actual competing resubmissions | Two simultaneous POSTs returned **200 and 409**; one resubmission history event. State In Review, same reviewer1; not in Pending Queue, present in Mine. |
| Final authorization and persisted retrieval | Unrelated reviewer2 approval 403; reviewer1 approval 200. Fresh requester1 login retrieved Approved, THB17.75 and saved literal justification. History exactly six entries: Created/Pending, claimed, returned, edited, resubmitted, approved; earlier return reason retained. |
| F-06 visibility/projection | Wrong owner #13 detail/history 404, anonymous list 401, Requester claim 403. Owner and unrelated Reviewer retrieved identical #17 history under the defined Reviewer read permission; actor keys limited to id/role/username. |
| F-08 filters | Approved + Purchase + same UTC creation day + literal `100%_\` search returned #17 within owner's data. requester2 unique-title search returned an empty set. Forged requesterId, malformed calendar date and repeated scalar state returned 400. |

New retained fixtures:

- #16: `Sprint2 release 2026-11-25T14:05:46.205Z original journey`, requester1 / reviewer1, Rejected, THB10.25.
- #17: `Sprint2 release 2026-11-25T14:05:46.205Z returned cycle`, requester1 / reviewer1, Approved after return/edit/resubmit, THB17.75; justification `Receipt 100%_\ verified; synthetic release only.`

No reset, reseed, request deletion or manual database rewrite was performed. These are synthetic demo requests, not purchases or financial transactions. All API sessions ended with logout.

## Live UI observations — 8 recorded captures

The actual deployed UI was inspected through the in-app browser as requester1 and reviewer1. Full accessibility snapshots and observation times accompany screenshots in `browser-observations.json` and matching `.txt` files. These UI checks read the saved API-created journeys; the full state-changing journeys above were API checks. They are not falsely labelled as independent human UI execution.

| Evidence | Actual observation |
|---|---|
| ui-01-owner-filtered | Approved/Purchase/literal text narrowed owner list to #17. Initial date-fill automation left dates blank; no date assertion is based on this capture. |
| ui-02-owner-cycle-history | Approved THB17.75 and saved justification; full text records all six ordered history entries, actors, UTC times and return reason. |
| ui-03-retained-13 | Original UAT fixture still Pending/Unassigned/THB25.5 with original creation history. |
| ui-04-reviewer-queue-empty | Unique release title filter in Queue shows no requests; state fixed/disabled at Pending. |
| ui-05-reviewer-mine | Same title filter in Mine shows only the two assigned final release fixtures. |
| ui-06-reversed-date-error | Native date controls populated with from 26 Nov / through 25 Nov; server field error appears, entered text/dates retained. |
| ui-07-mine-combined-valid | Correcting from to 25 Nov, through 25 Nov, Approved + Purchase + title under Mine shows only approved #17. Screenshot visually inspected, both dates actually populated. |
| ui-08-clear-keeps-mine | Clear empties all filter values and restores the assigned list while Mine remains selected. |

Capture limitations are recorded honestly: one full-page history screenshot failed, so its viewport screenshot and complete text snapshot were retained. Other later screenshots are viewport captures. Native date entry was used after the browser's Playwright date-fill wrapper did not populate those controls; populated values and the resulting validation/matching result were verified. This was an automation limitation, not a demonstrated application defect. Browser ended signed out and the task-created temporary credential file was removed. No desktop/second-monitor capture was used.

## Review, setup and remaining work

Issue -> reviewed contract #77 -> feature PRs #78/#79/#81 -> history sync #83 -> main release #82 -> actual run/revision/tag above is preserved. Kittakorn's approvals exist, but most comments are brief `Approve`; this report does not manufacture detailed review reasoning. Team review of this evidence and any required substantive walkthrough remains to be recorded.

Reproduction scripts are retained as executed, with credentials supplied only through `SEED_PASSWORD`. They originally ran from a private task directory and wrote its `sprint2-release-evidence` subdirectory. Do not run `predeploy.cjs` now over the historical baseline. A future rerun of the live verifier creates fresh synthetic records, so run only intentionally against the demo service and retain its separate evidence; it is not part of automatic CI. No credential, cookie, hash of a credential, database connection string or session file is included.

After Returned data exists, use only an F-07-compatible rollback image or reviewed roll-forward. The pre-Sprint-2 binary is not a general rollback target for the extended enum; no destructive down migration is proposed.

Technical deployment/verification is complete. Human evidence acceptance is separate. F-10 meaningful Sprint 3 summary, complete updated SRS/inventory/SDS and actual-result matrix, final integrated Deliverable 2 candidate/PDF, and remaining Lab 6/Lab 7/final-product work are not completed by this release.
