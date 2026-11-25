# Retest Request - Lab 6, Issue #60

## Corrected Release

| Field                   | Value                                                                                                     |
| ----------------------- | --------------------------------------------------------------------------------------------------------- |
| App URL                 | https://macau678-purchase-approval-gfn7poakkq-as.a.run.app/                                               |
| Displayed app version   | 0.2.2                                                                                                     |
| Image/source commit tag | `8f21c3252e72db1a17c9976701582fd21dc73cf5`                                                                |
| Cloud Run revision      | Not supplied in the release details; record it before testing if it is visible in the deployment metadata |

Before testing, record the app version, source commit, and Cloud Run revision. Do not reset the shared test data. Use new synthetic requests where a case needs a fresh request.

## F-01 - High: Draft privacy (UAT-TC-03)

**Change made:** Reviewer list queries and queue rendering hide `DRAFT` requests. The API denies Reviewer access to draft detail and history. The Requester can still access their own draft.

**Retest using the existing UAT-TC-03 ownership flow:**

1. As `requester1`, create a DRAFT assigned to `reviewer1` and note its URL.
2. As assigned Reviewer `reviewer1`, verify the draft is absent from the Reviewer Queue. Open the URL and request its history directly; both must be denied or redirected without showing request details.
3. Repeat the queue and direct-URL checks as unassigned Reviewer `reviewer2`.
4. As `requester1`, open the same draft and verify its details and `CREATED` history are visible.
5. Continue the original UAT-TC-03 checks: `requester2` cannot open `requester1`'s request, and a Requester has no Approve, Reject, or Return actions.

**Expected result:** Only the owning Requester can discover and open the DRAFT. Both assigned and unassigned Reviewers are denied.

## F-02 - Medium: History visibility and resubmission notes (UAT-TC-01 and UAT-TC-04)

**Change made:** Every request creation records `CREATED`, including direct submission. Reviewers do not see `CREATED`; their direct-submit timeline starts with `SUBMITTED` and `None → Pending Review`. Requesters see both events. Reviewer history also hides individual requester-generated `EDITED` entries. On resubmission, the Reviewer-facing `RESUBMITTED` note combines the Requester's edit notes since the latest return, in order, without repeating the final note. The Requester retains each separate history entry.

**Retest the original UAT-TC-01 direct-submit and approval flow:**

1. Create and submit the request directly, as in the original case. The displayed status should be **Pending Review**.
2. As the Requester, verify the timeline shows `CREATED` followed by `SUBMITTED`, with actor and timestamp for each.
3. As the Reviewer, verify `SUBMITTED` shows `None → Pending Review`, `CREATED` is hidden, and `APPROVED` appears after approval.
4. As the Requester, verify the full history after approval still shows `CREATED`, `SUBMITTED`, and `APPROVED`.

**Expected result:** Requester history shows `CREATED`, `SUBMITTED`, and `APPROVED`. Reviewer history shows `SUBMITTED` and `APPROVED` but omits `CREATED`.

**Retest the original UAT-TC-04 return/edit/resubmit flow:**

1. Have the Reviewer return a Pending Review request with a reason, then sign in as its Requester.
2. Edit and save the returned request several times with a different revision note for each save. Make a final field change and resubmit.
3. Verify the Requester timeline retains every `EDITED` entry with its actor, timestamp, `Returned → Returned` transition, and note, followed by `RESUBMITTED`.
4. Sign in as the Reviewer. Verify the individual `EDITED` entries are hidden and the `RESUBMITTED` reason combines all revision notes in chronological order without repeating the final note.

**Expected result:** The Requester sees each edit record. The Reviewer sees the combined edit summary on `RESUBMITTED`, but no individual `EDITED` entries.

## F-03 - Low: UAT wording

**Change made:** The guide now uses the website's labels and the correct SRS references.

Keep the same test data, mapping it to the form as follows:

| Original handoff term | Website label / handling                                                    |
| --------------------- | --------------------------------------------------------------------------- |
| Item Name             | Request Title                                                               |
| Quantity              | Put the quantity in Description; there is no separate Quantity field.       |
| Estimated Cost        | Estimated Amount ($)                                                        |
| Justification         | Business Justification                                                      |
| Reviewer              | Assign Reviewer                                                             |
| `SUBMITTED` status    | The status badge reads **Pending Review**. `SUBMITTED` is a timeline event. |

Please return the result for each original case, any request IDs or evidence, and the tested release details. Keep F-01, F-02, and F-03 results separate in the retest report.
