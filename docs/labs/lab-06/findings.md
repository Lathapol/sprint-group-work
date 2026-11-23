# Findings and disposition records

Status updated 22 November 2026: a partial incoming partner report was supplied in a Discord screenshot. Its reported outcomes are not substituted for our execution, reproduction or acceptance records. Full original report and exact tested version/request details remain pending.

## Individual finding (copy for each real failure)

Issue ID/link; product owner/team; reporter/team/date; tested source and revision; case/AC reference; preconditions and synthetic record IDs; numbered reproduction steps; specified expected result; actual result; readable evidence ID; severity and user impact; partner notification and outcome.

Critical/major: blocks acceptance and requires correction and independent retest. Minor: fix or obtain explicit independent acceptance as a known limitation. Classify against the agreed contract, not developer preference.

## Incoming triage ledger

| Finding | Case/AC | Classification | Evidence-based reason | Severity/impact | Owner | Fix status/disposition | PR/CI/deployed version | Independent retest |
|---|---|---|---|---|---|---|---|---|

Allowed classifications: accepted defect, duplicate (link original), not-defect (explain contract/evidence), enhancement (identify out-of-scope requirement). Reproduce and clarify before dismissing.

## Correction evidence for each accepted defect

1. Defective source SHA and linked finding.
2. Reproducing test file/name, meaningful assertion/setup, command, actual failing output and counts (RED before implementation fix).
3. Fix SHA and relevant diff; same test command/output and counts GREEN; relevant existing regression command/results.
4. Fix branch from sprint staging, substantive teammate review text, required passing CI, integration, reviewed main release.
5. Deployed source SHA/revision, smoke check observations.
6. Independent named tester, date, original reproduction/affected cases, corrected version, actual results/evidence and closure.

Do not fabricate a bug if none is found. Instructor-approved controlled exercises must identify approval, isolated version and independent retest, separately from the healthy release.

## Incoming record IN-01 — reported 404 instead of 403

Tracking: https://github.com/Lathapol/sprint-group-work/issues/60. Product owner: our team. Reporter: partner report visible in user-supplied Discord screenshot; individual executor not visible. Observed screenshot received 22 Nov; original execution time and source/revision unknown.

Partner reports five of six scenarios passed and one low-priority status mismatch: requester2 received 404 when attempting another request claim, expected 403. Partner observed no unauthorized modification/disclosure. Six original case IDs and complete outgoing_report.md are not visible; do not infer these equal our eight draft cases.

Classification: pending exact reproduction/clarification. Preliminary severity minor/low per reported impact; not yet a confirmed accepted implementation defect or confirmed not-defect. Investigation owner: Lathapol / Product Team. Disposition: open, obtain exact URL/method/body/record ID/session role/tested SHA and full report.

Contract AC-01-04 and UAT6-03 distinguish forbidden-role POST (403) from cross-owner GET (404). Developer verification on live source 51b57adc1c51d57e23d047d628cf55966e268ad9: requester2 GET /api/requests/6 returned 404; POST /api/requests/6/claim returned 403; malformed-ID POST /api/requests/not-a-number/claim returned 404. Existing requester1 record #6 was exactly unchanged before/after. See evidence/claim-status-preflight.json for actual UTC timestamp/results. The script takes SEED_PASSWORD privately and outputs no cookie/password. Run from an evidence workspace with that environment variable; it creates lab6-evidence/claim-status-preflight.json. These are AI-assisted developer API checks, not independent manual retest.

Do not change expected 403 to 404 merely to match a reported failure: identify the actual route and input first. No code fix, RED/GREEN run, independent closure or acceptance is claimed. No message was sent to Discord or partner team. Partner must independently rerun the correctly formed forbidden claim and verify protected state is unchanged.

## Outgoing test dependency OUT-SETUP-01 — Macau678 TC-03 Part B

Tracking: https://github.com/Lathapol/sprint-group-work/issues/61. Pai's visible message suggests marking Fail because only one requester account was initially supplied. Record the missing prerequisite as BLOCKED; if a human report used FAIL retain that historical label with its setup reason, rather than invent a product authorization defect.

The screenshot now provides requester2@macau678.com. Account/role and private credential availability are not verified. Rerun TC-03 Part B using a known real record owned by the other requester, record both student testers' actual participation, full version, time and denial/no-disclosure/unchanged-state evidence. No rerun or PASS/FAIL is claimed here.

## Full report received and linked evidence reviewed — 22 November

Original received report is preserved as evidence/partner-outgoing-report.md. It identifies UAT6-01, 02, 04, 05, 06 as PASS and UAT6-03 as FAIL (Low). Preserve these as the PARTNER's reported labels; do not overwrite them using developer results. Its overall wording is “PASS with one low-priority finding.” This is a reported overall assessment, but not yet a complete exact-version independent acceptance record for all agreed cases.

Publicly accessible linked Google Doc: https://docs.google.com/document/d/15YZejPw8yIwcs4R5TKNnu7FhPABnV89XdWPvdhN5TMg/edit. PDF export inspected (30 pages). Cover names EN-004_P5, Punnapob Wirojwongchai/SaintCrois and Patcharak Plipat/bravefe; identifies our source 51b57adc1c51d57e23d047d628cf55966e268ad9. Per-case named executor, execution times and deployed revision still need confirmation. UAT6-07 and 08 are present as planned cases but not included in the six reported results; coverage must be resolved, not assumed complete.

Page 24 shows requester1 record #8 already Approved, then requester2's Request not found UI. Page 25 shows the console's failed resource /api/requests/8 with 404; no POST /api/requests/8/claim invocation is visible. This evidence supports the expected cross-owner READ denial, not a demonstrated wrong claim response. It also reuses an Approved normal-journey record rather than the fresh Pending record expected for UAT6-03; partner should rerun with correct preconditions. Preserved page images are evidence/partner-report-page-24.png and page-25.png.

Current disposition remains clarification/retest required: do not silently reclassify the partner FAIL as PASS or change expected POST 403 to 404. Request a fresh Pending record, exact valid numeric ID, actual POST fetch/method/URL/result and before/after state. If the rerun matches the contract and no legitimate defect remains, document not-defect/test-execution issue with partner confirmation; request the instructor-approved isolated exercise for the no-defect learning outcome as required. No instructor/partner communication has been sent by this review.

## Finding 60 resolution — evidence received 24 November

Partner follow-up now demonstrates actual requester2 POST /api/requests/13/claim -> 403 and requester1 view of the same Pending, Unassigned fixture with unchanged visible fields. Disposition: resolved, not a reproduced implementation defect; original evidence/request-method interpretation issue. Original FAIL history retained, expected POST 403 unchanged. See [retest evidence and attribution](retest-60.md). Only finding #60 closes; other UAT/acceptance dependencies remain open.
