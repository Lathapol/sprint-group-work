# Independent partner rerun for issue #60

Prepared 23 November 2026. Not executed by the partner; no message has been sent by this document.

## Exact baseline and prepared fixture

- App: https://approvals-389973748230.asia-southeast1.run.app
- Full source: 51b57adc1c51d57e23d047d628cf55966e268ad9. Check /api/version before and after; confirm deployed revision separately.
- Fresh synthetic requester1-owned record: **#13**, PURCHASE, THB 25.50, Pending, reviewer null as of 2026-11-23T13:56:33.788Z.
- Exact title: UAT6-03 independent rerun fixture 2026-11-23T13:56:33.386Z.
- Developer verification POST /api/requests/13/claim as requester2 returned 403; owner business record unchanged. This is corroboration, not your independent result. The fixture was retained for your rerun; verify it is still Pending before starting. If another tester changes it, create a NEW Pending record and substitute its actual numeric ID.

## Partner user-facing steps

1. Record your full name/team, actual timestamp/timezone, browser, full source and Cloud Run revision. Both partner members must record their actual participation across the agreed cases; do not sign for one another.
2. Sign in as requester1 with privately supplied synthetic credentials. Open /requests/13; capture its Pending state, amount and null reviewer. Sign out.
3. Sign in as requester2; open My requests and verify record #13 is absent. Visit /requests/13. Expected: Request not found; no private record values disclosed. The GET /api/requests/13 returning **404 is correct**.
4. While still requester2, open browser DevTools Console and execute this exact same-origin request (no cookie/password/token needs to be pasted):

```javascript
const response = await fetch('/api/requests/13/claim', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({})
});
console.log({ status: response.status, body: await response.json() });
```

Expected: **403**, error code FORBIDDEN. Capture the actual POST method, complete valid numeric path and response. A console line showing only GET /api/requests/13 or a missing/malformed ID is not this step. If the browser requires enabling pasted console input, do not bypass its warning through automation; the human tester can type the short command directly.

5. Sign out. Sign in again as requester1; reopen SAME record. Expected Pending, reviewer null, THB 25.50, same title/justification. Capture comparison. Retain this record for grading; no edit/delete/reset.
6. Record actual observations for each step and PASS/FAIL/BLOCKED. Preserve the earlier reported FAIL (Low) as history, then document whether the exact rerun supports a product defect or test-execution mismatch. If it is still 404, retain the Network request method/path, response body, version and role; do not change the contract to accept it without investigation.
7. Review remaining UAT6-07 and UAT6-08: they were part of the shared handoff but absent from the six-result summary. Arrange the restart window and two-reviewer claim check, or record why required coverage remains blocked. No product restart is authorized by this document alone.
8. Supply final exact-version decision and explicitly accepted minor limitations, if any. The existing overall PASS summary is retained, but unresolved required cases and missing retest cannot be silently treated as complete.

## Response fields (partner completes)

Tester names and actual participation: pending.
Execution date/time/timezone: pending.
Full source / deployed revision: pending.
Actual POST path/method/status/body: pending.
Before/after protected state: pending.
Evidence IDs: pending.
Disposition agreement for #60: pending.
UAT6-07/08 actual results or dependency: pending.
Final decision, conditions, confirmation identity/date: pending.
