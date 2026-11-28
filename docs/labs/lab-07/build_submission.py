from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import PageBreak, Paragraph, Preformatted, SimpleDocTemplate, Spacer, Table, TableStyle


ROOT = Path(__file__).resolve().parents[3]
OUTPUT = ROOT / "docs/labs/lab-07/output/pdf/lab7_sec31_EN-004_P5.pdf"
OUTPUT.parent.mkdir(parents=True, exist_ok=True)

INK = colors.HexColor("#18212f")
BLUE = colors.HexColor("#145b8c")
PALE = colors.HexColor("#eaf2f8")
TEAL = colors.HexColor("#167b78")
GOLD = colors.HexColor("#f3c969")
RED = colors.HexColor("#9d2d2d")
LIGHT_RED = colors.HexColor("#fff0ef")
MID = colors.HexColor("#596779")
GRID = colors.HexColor("#c7d0d9")
WHITE = colors.white

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="CoverTitle", parent=styles["Title"], fontName="Helvetica-Bold", fontSize=25, leading=31, textColor=INK, alignment=TA_CENTER, spaceAfter=11))
styles.add(ParagraphStyle(name="CoverSub", parent=styles["Normal"], fontName="Helvetica", fontSize=14, leading=20, textColor=BLUE, alignment=TA_CENTER, spaceAfter=8))
styles.add(ParagraphStyle(name="H1x", parent=styles["Heading1"], fontName="Helvetica-Bold", fontSize=16, leading=20, textColor=BLUE, spaceAfter=8))
styles.add(ParagraphStyle(name="H2x", parent=styles["Heading2"], fontName="Helvetica-Bold", fontSize=10.5, leading=13, textColor=TEAL, spaceBefore=5, spaceAfter=4))
styles.add(ParagraphStyle(name="Bodyx", parent=styles["BodyText"], fontName="Helvetica", fontSize=8.6, leading=12, textColor=INK, spaceAfter=5))
styles.add(ParagraphStyle(name="Smallx", parent=styles["BodyText"], fontName="Helvetica", fontSize=7.4, leading=9.4, textColor=INK, spaceAfter=2))
styles.add(ParagraphStyle(name="Tinyx", parent=styles["BodyText"], fontName="Helvetica", fontSize=6.6, leading=8, textColor=INK, spaceAfter=0))
styles.add(ParagraphStyle(name="Captionx", parent=styles["BodyText"], fontName="Helvetica-Oblique", fontSize=7, leading=9, textColor=MID, spaceBefore=3, spaceAfter=5))
styles.add(ParagraphStyle(name="Codex", parent=styles["Code"], fontName="Courier", fontSize=6.8, leading=8.2, textColor=INK, backColor=colors.HexColor("#f1f4f7"), borderColor=GRID, borderWidth=0.5, borderPadding=6, leftIndent=0, rightIndent=0, spaceBefore=3, spaceAfter=5))
styles.add(ParagraphStyle(name="Centerx", parent=styles["BodyText"], fontName="Helvetica", fontSize=9, leading=13, alignment=TA_CENTER, textColor=INK))


def P(text, style="Bodyx"):
    return Paragraph(text, styles[style])


def link(url, label):
    return f'<link href="{url}" color="#145b8c">{label}</link>'


def cap(eid, action, result, when, source):
    return P(f"{eid} | Action: {action} | Expected/actual: {result} | Time: {when} | Source: {source}", "Captionx")


def T(rows, widths, header=True, font=7.2, padding=4, repeat=1):
    data = []
    for row_index, row in enumerate(rows):
        cells = []
        for x in row:
            if isinstance(x, Table):
                cells.append(x)
                continue
            if isinstance(x, Paragraph):
                source_text, source_style = x.text, x.style
            else:
                source_text, source_style = str(x), styles["Smallx"]
            cell_style = ParagraphStyle(
                name=f"TableCell{row_index}_{len(cells)}",
                parent=source_style,
                textColor=WHITE if header and row_index == 0 else INK,
                fontName="Helvetica-Bold" if header and row_index == 0 else source_style.fontName,
            )
            cells.append(Paragraph(source_text, cell_style))
        data.append(cells)
    tbl = Table(data, colWidths=widths, repeatRows=repeat if header else 0, hAlign="LEFT")
    commands = [
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.35, GRID),
        ("LEFTPADDING", (0, 0), (-1, -1), padding),
        ("RIGHTPADDING", (0, 0), (-1, -1), padding),
        ("TOPPADDING", (0, 0), (-1, -1), padding),
        ("BOTTOMPADDING", (0, 0), (-1, -1), padding),
    ]
    if header:
        commands += [("BACKGROUND", (0, 0), (-1, 0), BLUE), ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
                     ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold")]
        if len(data) > 1:
            commands.append(("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, colors.HexColor("#f5f8fa")]))
    tbl.setStyle(TableStyle(commands))
    return tbl


def box(text, fill=PALE, stroke=BLUE):
    tbl = Table([[P(text, "Bodyx")]], colWidths=[503])
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), fill), ("BOX", (0, 0), (-1, -1), 0.8, stroke),
        ("LEFTPADDING", (0, 0), (-1, -1), 9), ("RIGHTPADDING", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 8), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    return tbl


def on_page(canvas, doc):
    canvas.saveState()
    w, h = A4
    if doc.page > 1:
        canvas.setFillColor(MID)
        canvas.setFont("Helvetica-Bold", 7)
        canvas.drawString(48, h - 26, "CPE 334  |  LAB 7 MAINTENANCE")
        canvas.setFillColor(RED)
        canvas.drawRightString(w - 48, h - 26, "LAB 7 SUBMISSION COPY - REVIEWED 28 NOV 2026")
        canvas.setStrokeColor(GRID)
        canvas.line(48, h - 31, w - 48, h - 31)
    canvas.setStrokeColor(GRID)
    canvas.line(48, 29, w - 48, 29)
    canvas.setFillColor(MID)
    canvas.setFont("Helvetica", 7)
    canvas.drawString(48, 18, "Lathapol/Sprint-group-work  |  Evidence refreshed 28 Nov 2026, Asia/Bangkok; metrics cutoff 27 Nov")
    canvas.drawRightString(w - 48, 18, f"Page {doc.page}")
    canvas.restoreState()


story = []
W = 503

# Page 1 - cover
story += [Spacer(1, 35 * mm), P("CPE 334  |  LAB 7", "CoverSub"),
          P("Sprint 1 Maintenance", "CoverTitle"),
          P("Software maintenance metrics and release readiness", "CoverSub"), Spacer(1, 8 * mm),
          box('<b>STUDENT REVIEW CONFIRMED</b><br/>Both students approved the contribution table and retrospective as written, per Lathapol\'s confirmation on 28 Nov 2026. The report records a NOT READY release assessment and preserves the limits of the available data evidence.', PALE, BLUE),
          Spacer(1, 8 * mm),
          T([["Team member", "Student ID", "GitHub"],
             ["Lathapol Srikhiao", "67070503475", "Lathapol"],
             ["Kittakorn Poungpien", "67070503401", "Kittakorn-P"]], [235, 110, 158]),
          Spacer(1, 8 * mm),
          P("Project: Workflow and Approval System (CPE 334, Section 31)", "Centerx"),
          P(f"Repository: {link('https://github.com/Lathapol/sprint-group-work','Lathapol/sprint-group-work')}", "Centerx"),
          P(f"Deployed service: {link('https://approvals-389973748230.asia-southeast1.run.app','approvals-389973748230.asia-southeast1.run.app')}", "Centerx"),
          Spacer(1, 7 * mm),
          P("Accepted Sprint 1 baseline: 51b57adc1c51d57e23d047d628cf55966e268ad9 (Lab 6 record; no baseline tag recorded).", "Smallx"),
          P("Pre-change test parent: ab21f356ad66622ba9f9a2f05085b3438858e7cb; preserved test-only commit: 236163715d7b3979be7d2d1a2a2f99180ff0da95.", "Smallx"),
          P("Current main/application commit: 1a514748d930a90a864f180696bea284fc64c289; deployed revision: approvals-r46129131935-1 (run #46129131935). No Lab 7 submission tag has been created.", "Smallx"),
          Spacer(1, 5 * mm), P("Prepared 28 November 2026 | Due 29 November 2026, 23:59 Asia/Bangkok", "Centerx"), PageBreak()]

# Page 2 - contents/status
story += [P("Contents and review status", "H1x"),
          T([["Part", "Pages", "Evidence IDs"],
             ["A - Change impact and updated contract", "3-4", "A-01 to A-04"],
             ["B - Implementation, regression and delivery", "5-10; supplemental evidence p. 18", "B-01 to B-12"],
             ["C - Objective metrics and action", "11-13", "C-01 to C-06"],
             ["D - Readiness, debt and retrospective", "14-16; supplemental evidence p. 18", "D-01 to D-05; B-11/B-12"],
             ["Evidence index and limits", "17", "E-01"]], [190, 65, 248]),
          Spacer(1, 6), P("Executive status", "H2x"),
          box("<b>FINAL SUBMISSION COPY; release readiness is NOT READY.</b> The maintained Sprint 1 behavior is deployed and selected UI/API checks passed. Synthetic requests #22/#23/#24 retained their recorded fields/state/history across revisions #14 and #15; direct revision #15 denial calls returned 409/404/403 and the 24-request/history fingerprint remained unchanged across those attempts. A complete production-wide export was not retained, and selected data equivalence passed for the controlled fixture. The unmodified pre-withdrawal image returns HTTP 500 on GET /api/requests when WITHDRAWN data exists. The enum-compatible rollback image is now published at digest sha256:a01e2edf25c473a1082da316725683128dc91c8635cdb004516945e4b7cfb44a. Release selection/guard changes pass 5 targeted tests but await review/merge and a no-traffic Cloud Run rehearsal. Timestamped UI/API logs are included; no screenshot files were retained. Both students approved the contribution table and retrospective as written, per Lathapol's report on 28 Nov.", LIGHT_RED, RED),
          Spacer(1, 5), P("Scope boundary", "H2x"),
          P("This report covers the adopted change to existing Sprint 1 behavior: a Requester may withdraw their own unclaimed Pending request. Later Sprint 2/3 features coexist in the codebase but are not claimed as Lab 7 maintenance. The release pipeline deploys the whole maintained application.", "Bodyx"),
          P("Current instructor instruction", "H2x"),
          P(f"The professor's later Lab 7 Spec Sheet Change announcement says students may make a Sprint 1 change without instructor/TA approval, provided the selected change is substantial. That announcement is the current instruction for this work. The requester-withdrawal change is substantial because it changes persisted state, authorization, audit history, race behavior, UI, filtering and summary counts. The announcement was shared with the team on 26 Nov 2026; its instruction is also recorded in {link('https://github.com/Lathapol/sprint-group-work/issues/94','Issue #94')} and {link('https://github.com/Lathapol/sprint-group-work/issues/95','Issue #95')}.", "Bodyx"),
          P("Dates in the metrics snapshot are Asia/Bangkok unless explicitly marked UTC. CI and deployment excerpts are automated evidence; no agent-operated check is labeled as student manual UAT.", "Smallx"), PageBreak()]

# Page 3 - A old/new
story += [P("Part A | Change request and old/new behavior", "H1x"),
          P("Evidence A-01 | Issue #94 proposed a bounded change to an already implemented Sprint 1 request lifecycle. The contract was reviewed in PR #100 before the implementation PR #101.", "Bodyx"),
          T([["Before (accepted rule)", "After (adopted CR-L7-01 rule)"],
             ["A valid Requester submission creates an unassigned PENDING request. There is no owner withdrawal action or API route; it remains Pending until a Reviewer claims it.",
              "A Requester may withdraw only their own unclaimed PENDING request. Success makes it final WITHDRAWN, retains request fields and prior history, and appends one PENDING -> WITHDRAWN event."],
             ["Reviewers claim Pending requests. Ownership and role checks protect private request records.",
              "The server requires matching owner, PENDING state and reviewerId IS NULL. Reviewer role receives 403; another owner receives non-disclosing 404; an owned but ineligible state receives 409. Failures must not mutate."],
             ["Lists, histories and summary report the states already defined in Sprint 1.",
              "WITHDRAWN is visible in state filters and all-state totals, but is not an Approved/Rejected decision. Reviewer queue remains Pending-only; Reviewers can read history but have no withdrawal control."]], [251, 252]),
          Spacer(1, 5), P("Why this is a maintenance change", "H2x"),
          P("The pre-change behavior was implemented and deployed; the new requirement changes what owners may do while a request is Pending. It is not a new subsystem or a correction of a broken existing rule. The change has a meaningful business effect and crosses the API, persistence, authorization, UI, audit history, state filters, summary and release migration boundary.", "Bodyx"),
          P("Boundaries", "H2x"),
          P("No user-supplied withdrawal reason is accepted. No request fields, decisionReason, decidedAt or prior history are erased. WITHDRAWN is terminal. A conditional database update and history insert share one transaction so a simultaneous claim and withdrawal cannot both win.", "Bodyx"),
          cap("A-01", "Compare implemented old rule with adopted new rule", "Only the new owner withdrawal transition is added; existing claim/decision flows stay", "Contract approved 26 Nov 2026", "Issue #94; PR #100; Sprint 1 contract"), PageBreak()]

# Page 4 - impact/contract/review
story += [P("Part A | Impact map and reviewed contract", "H1x"),
          T([["Requirement / feature", "Revised test contract", "Affected modules and preserved rule"],
             ["FR-04/05, BR-02/03: submission starts Pending and unassigned", "AC-12-01 / TEST-12-01", "src/requests.ts; fields and initial state stay unchanged"],
             ["FR-07/08, BR-03/04: reviewer queue and atomic claim", "AC-12-03/04 / TEST-12-03/04", "src/requests.ts; claim remains atomic; race allows one transition only"],
             ["FR-11/13, BR-10: append-only history", "AC-12-01/05 / TEST-12-01/05", "Prisma history, detail/history API and UI; retain old events and fields"],
             ["FR-16: authorized lists and filters", "AC-12-05 / TEST-12-05", "src/request-filters.ts and web/main.tsx; queue remains Pending-only"],
             ["FR-18: summary totals", "AC-12-06 / TEST-12-06", "src/reports.ts and summary UI; WITHDRAWN is a state, not a reviewer decision"],
             ["BR-09/15: transition and terminal-state guards", "AC-12-02/03 / TEST-12-02/03", "role and owner guards remain authoritative; terminal rows cannot be withdrawn"]], [128, 125, 250]),
          Spacer(1, 4), P("API contract excerpt", "H2x"),
          Preformatted("POST /api/requests/:id/withdraw with {}\n200 -> state WITHDRAWN; keep request fields and prior history\n401 unauthenticated | 403 Reviewer | 404 other owner's record\n409 owned request not eligible | failures write nothing", styles["Codex"]),
          P("Persistence and rollout", "H2x"),
          P("Add WITHDRAWN through a forward-only enum migration and update the reviewer/state constraint so Pending and Withdrawn remain unassigned. No historical-row rewrite or backfill is required. Rollback compatibility was tested in an isolated database: the pre-withdrawal image returned HTTP 500 on GET /api/requests when a WITHDRAWN record existed. A compatibility rebuild of the old app with only the Prisma enum extended returned 200 for list/detail and read the row as WITHDRAWN. The image is published; automated selection/guard changes are prepared locally but not merged, and no Cloud Run rollback revision has been rehearsed. See D-06.", "Bodyx"),
          P("Review before implementation", "H2x"),
          P(f"PR {link('https://github.com/Lathapol/sprint-group-work/pull/100','#100')} was approved by Kittakorn-P on 26 Nov 2026 at 18:23 Asia/Bangkok; review body: 'Approve'. The contract PR was docs-only. PR {link('https://github.com/Lathapol/sprint-group-work/pull/101','#101')} was then approved by Lathapol at 21:49: 'Looks good - CI passes, and withdrawal stays limited to unclaimed requests with history kept. Approved.'", "Smallx"),
          cap("A-02 to A-04", "Trace requirements to six acceptance criteria and teammate review", "Six criteria define owner success, guards, terminal states, race, UI/history/list, and totals", "26 Nov 2026", "PR #100; docs/sprints/sprint-1/contracts.md; PR #101 review"), PageBreak()]

# Page 5 - version table
story += [P("Part B | Version chain and test-first sequence", "H1x"),
          T([["Stage", "Version / evidence", "Meaning"],
             ["Accepted Sprint 1 baseline", "51b57adc1c51d57e23d047d628cf55966e268ad9; revision approvals-r44500910145-1", "Lab 6 acceptance record identifies this as the app baseline; no separate Sprint 1 tag recorded."],
             ["Pre-change deployed candidate", "0334c966c396912dfaf2e309e044753f11d4e47c; tag deliverable2-candidate-2026-11-25; revision approvals-r45650095303-1", "Preserved before the maintenance rollout. This candidate includes later-sprint project work; it is not relabeled as a Sprint 1-only build."],
             ["Approved contract", "PR #100 merge ab21f356ad66622ba9f9a2f05085b3438858e7cb", "Docs-only contract before implementation; exact parent of the preserved test-only commit."],
             ["Pre-change test", "236163715d7b3979be7d2d1a2a2f99180ff0da95", "Test-only commit; parent ab21f356ad66622ba9f9a2f05085b3438858e7cb. It runs tests against the old application behavior."],
             ["Implementation / feature integration", "26ecd060debd1921a929ca12302b8f95f83a46cb; UI fix 38e08dc54627f1079e48b17c1a6c048b5b4fe9ef; PR #101 merge b2e43aaee533d965651f9886608c32a24d746329", "Feature route, transaction, migration and UI; merged to sprint-1-staging after review."],
             ["Regression integration", "PR #102 head 9bb739c96c9e4ceae192b7ace6614ec82a330d35; staging merge 1980773c63e568b77dbe6a168b7998898487a888", "Adds no-mutation coverage and withdrawal CI evidence."],
             ["Maintenance release", "PR #103 merge eb0734a50f06e8f94f8644fe66404c6418e8f913; run #8; revision approvals-r45865530232-1", "Reviewed staging-to-main integration and first deployment of the maintenance code."],
              ["Current main/deployment", "SHA 1a514748d930a90a864f180696bea284fc64c289; run #46129131935; revision approvals-r46129131935-1", "PR #110 added documentation/evidence only; application source is unchanged. No Lab 7 submission tag exists." ]], [118, 205, 180]),
          Spacer(1, 4), P("The main merge SHAs differ from PR heads because GitHub creates merge commits. PRs #104-#110 added release evidence and workflow/PDF documentation; each deployment can create a new main SHA even when application source is unchanged. The current main revision is recorded separately from the earlier revision used for most authenticated checks.", "Smallx"),
          cap("B-01", "Trace accepted baseline through pre-change, tests, staging and main deployment", "The application version is separated from docs-only main commits", "Refreshed 28 Nov 2026; metrics cutoff 27 Nov 16:45", "Lab 6 acceptance; PRs #100-#110; deployment runs #8, #12-#15"), PageBreak()]

# Page 6 - RED
story += [P("Part B | RED on actual pre-change code", "H1x"),
          P(f"Evidence B-02 | Workflow {link('https://github.com/Lathapol/sprint-group-work/actions/runs/45943255486','run #1')} was manually dispatched by Kittakorn-P on 27 Nov at 12:01 Asia/Bangkok. It checked out test-only commit 2361637, installed dependencies, generated Prisma Client, applied pre-change migrations to isolated CI PostgreSQL 18.7, then ran npm test.", "Bodyx"),
          T([["Command/result", "Actual evidence"],
             ["Build within npm test", "Passed; test execution reached the withdrawal assertions."],
             ["npm test", "Exit code 1. TAP: 32 total, 27 passed, 5 failed, 0 skipped."],
             ["Workflow result", "Success means the workflow confirmed and retained the expected RED failure. It does not mean the historical npm test passed."],
             ["Raw output", "Artifact lab7-red-2361637 is attached to run #1; retained through 25 Feb 2027."]], [140, 363]),
          Spacer(1, 4), P("Observed failures", "H2x"),
          T([["Assertion group", "Expected", "Actual", "Interpretation"],
             ["TEST-12-01", "HTTP 200", "HTTP 404", "Withdrawal route did not exist."],
             ["TEST-12-02/03", "Reviewer denial HTTP 403", "HTTP 404", "The route/role guard path was absent in pre-change code."],
             ["TEST-12-04", "Concurrent outcomes [200, 409]", "[200, 404]", "No withdrawal transition existed to return the specified conflict."],
             ["TEST-12-05/06", "WITHDRAWN filter HTTP 200", "HTTP 400", "The old enum/filter rejected the new state."]], [102, 117, 100, 184]),
          P("The failing assertions point to missing behavior, not a compile error, invalid fixture or unavailable login. The RED run used test-only commit 2361637, whose parent is the reviewed contract merge ab21f35.", "Bodyx"),
          cap("B-02", "Execute the new behavior assertion on pre-change source", "Missing endpoint, guard, race conflict and filter behavior produced 27 pass / 5 fail", "27 Nov 2026 12:01 Asia/Bangkok", "Actions run #1, job 140322082516, artifact lab7-red-2361637"), PageBreak()]

# Page 7 - diff
story += [P("Part B | Bounded implementation diff", "H1x"),
          P("Evidence B-03 | The implementation adds one Requester-only route, constrains the transition to the matching owner and unclaimed Pending state, and writes the state change and history event in one transaction.", "Bodyx"),
          Preformatted("router.post('/:id/withdraw', requesterOnly, requireJson, async (req, res) => {\n  // Reject a reason or any other request body field.\n  const result = await db.$transaction(async tx => {\n    const update = await tx.request.updateMany({\n      where: { id, requesterId: ownerId, state: 'PENDING', reviewerId: null },\n      data: { state: 'WITHDRAWN' },\n    });\n    if (update.count === 1) {\n      await tx.requestHistory.create({ data: {\n        requestId: id, actorId: ownerId, fromState: 'PENDING',\n        toState: 'WITHDRAWN', reason: 'Requester withdrew the request.',\n      }});\n      return { data: await tx.request.findUniqueOrThrow({ where: { id } }) };\n    }\n    // Other-owner/missing -> 404; owned but ineligible -> 409.\n  });\n});", styles["Codex"]),
          T([["Change area", "Implementation outcome"],
             ["API and database", "Conditional update enforces owner + PENDING + no reviewer. History is appended in the same transaction."],
             ["UI", "Show confirmation and Withdraw action only to the owning Requester on Pending; prevent repeat while busy; send {}."],
             ["State and migration", "Add WITHDRAWN and preserve the reviewer constraint: both PENDING and WITHDRAWN remain unassigned."],
             ["Lists and summary", "Expose the state in filters and totals; do not add it to reviewer decision counts."],
             ["Boundaries", "Reject body fields; hide other owners with 404; reject ineligible owned records with 409; final state is immutable."]], [118, 385]),
          P("The code excerpt is from src/requests.ts at the reviewed feature implementation. It is an excerpt, not the complete application source. The complete change remains available in PR #101 and the commit history.", "Smallx"),
          cap("B-03", "Inspect route and transaction change", "Only eligible owner can make one append-only PENDING -> WITHDRAWN transition", "Feature PR #101, 26 Nov 2026", "src/requests.ts; PR #101 diff"), PageBreak()]

# Page 8 - green and CI sequence
story += [P("Part B | GREEN, regression and CI history", "H1x"),
          T([["Run / version", "Observed result", "How it was handled"],
             ["PR #101 run #47, head 26ecd06", "Failure: browser TEST-12-05 sent a reason field; API correctly rejected it. API test/build passed, but the browser check failed.", "Corrected the UI request body to {} in commit 38e08dc; kept the API input contract strict."],
             ["PR #101 run #48, head 38e08dc", "Passed: npm test, seed, Playwright 6 and Docker build.", "Same feature suite after the UI request fix."],
             ["PR #102 run #49, head 6d679fa", "Failure: approved-state fixture contributed one reviewer decision; assertion expected zero.", "Retained the failing attempt and corrected the test oracle."],
             ["PR #102 run #50, head 5c6cb83", "Passed: 32 API tests, 6 browser tests, migration, seed and Docker build.", "Correct expected reviewer decision count to one and zero unattributed decisions."],
             ["PR #102 run #51, head 9bb739c", "Passed on final PR head and integrated staging: 32 API + 6 browser tests.", "Added no-mutation checks for returned/approved states and evidence."],
             ["Main run #14, SHA ee4652bb", "Successful: automated tests, migration, seed, Docker build, deployment and read-only smoke.", "Historical release; current run #15 is shown on page 9."]], [137, 215, 151]),
          Spacer(1, 5), P("Relevant regression assertions", "H2x"),
          P("CI exercises auth/session, health, request ownership and concurrent claim, return/edit/resubmit, history persistence, filters, decision summary, the CR-L7-01 API cases, the withdrawal browser confirmation/history case and the existing reviewer queue. TEST-12-01 through TEST-12-06 cover success/retention, role and owner guards, ineligible states, the claim race, filters and decision counts.", "Bodyx"),
          P("Automated browser testing is Playwright in CI. It is not described as a student manual UI session. The CI run uses synthetic fixtures and an isolated disposable PostgreSQL service.", "Bodyx"),
          cap("B-04 to B-06", "Run the same changed behavior green and protect related workflow behavior", "Current run #13 reports 32/32 API and 6/6 browser tests passed", "Run #13 completed 27 Nov 18:03 Asia/Bangkok", "Actions runs #47-#51 and #13"), PageBreak()]

# Page 9 - deployment
story += [P("Part B | Reviewed release and deployment", "H1x"),
          T([["Release evidence", "Value"],
             ["Reviewed feature and test chain", "PR #101 merged to sprint-1-staging; PR #102 added final no-mutation coverage; staging CI run #51 passed."],
             ["Main integration", "PR #103 merged staging to main at eb0734a50f06e8f94f8644fe66404c6418e8f913; Lathapol approved after confirming no partner session was expected to be active."],
              ["Latest main snapshot", "1a514748d930a90a864f180696bea284fc64c289, deployed by Actions run #46129131935 on 28 Nov. PR #110 is documentation-only; application code is unchanged."],
              ["Cloud Run", "Revision approvals-r46129131935-1; 100% traffic; service URL https://approvals-389973748230.asia-southeast1.run.app"],
              ["App image", "asia-southeast1-docker.pkg.dev/vertical-set-514506-g8/approvals/app@sha256:8c49051a56fe52424526a7060f6f988a468dc78914bbb84dfcd8d9a5802427ee"],
              ["Migration image/job", "Migration image digest sha256:85746d7969515bc4ac56d244ed4baa565c3c2cfea272d61e8a4f11dc417b9b9c; execution approvals-migrate-b78zk succeeded before rollout."],
              ["Health/version", "After deployment on 28 Nov: /api/health -> data.status=ok; /api/version -> data.commit=1a514748d930a90a864f180696bea284fc64c289. Read-only; it confirms release identity, not feature behavior."],
              ["Smoke", "Run #46129131935: live UI, database and release commit checks passed."],
             ["Tag", "No Lab 7 submission tag is recorded. The named deliverable2-candidate-2026-11-25 tag is the preserved pre-change candidate, not the maintenance release."]], [142, 361]),
          Spacer(1, 4), P("What deployment proves and does not prove", "H2x"),
          P("Actions run #46129131935 deployed commit 1a514748d930a90a864f180696bea284fc64c289 as revision approvals-r46129131935-1. Smoke, /api/health and /api/version checks passed. The controlled records #22/#23/#24 were observed on revision #14 and reloaded on revision #15 with expected fields, state, reviewer assignment and history unchanged. Direct deployed API calls against claimed request #24 returned HTTP 409 for owner requester1, 404 for requester2 and 403 for reviewer1; a final GET showed #24 still In review. A SHA-256 fingerprint of all 24 reviewer-visible requests and histories, before and after these denials, was identical. This proves the denied attempts did not mutate the current dataset; it is not a full database-wide rollout comparison. No complete pre-rollout export was found in retained evidence; Cloud SQL currently reports no available backups and automatic backups are disabled. See Issue #97 and the sanitized JSON evidence.", "Bodyx"),
          cap("B-07/B-08", "Deploy current main and check live release", "Run #46129131935 deployed 1a514748 as approvals-r46129131935-1; health=ok; version matched; #22-#24 preserved after redeploy", "28 Nov 2026 09:15-09:23 UTC; read-only owner page reloads", "Actions run #46129131935; /api/health; /api/version; Issue #97; request evidence #22-#24"), PageBreak()]

# Page 10 - AC coverage/manual limit
story += [P("Part B | Acceptance coverage and evidence limits", "H1x"),
          T([["Acceptance criterion", "Test / observed result", "Status"],
             ["AC-12-01 owner withdraws once; fields/history retained", "Live request #22: REQUESTER owner withdrew Pending; fields retained; one Pending -> Withdrawn event at 05:44:15 UTC. No repeat action available after final state.", "Observed in authenticated UI on target revision; tool-assisted, not independent student execution."],
             ["AC-12-02 auth, role and ownership", "CI TEST-12-02/03 passed reviewer 403 and other-owner 404. Live UI check #24: requester2 saw Request not found; revision #15 API returned reviewer 403 and requester 404.", "Automated CI and deployed API checks returned the expected role/owner denials."],
             ["AC-12-03 claimed/returned/final/withdrawn are not eligible", "CI TEST-12-03 passed owner-after-claim 409 and no-mutation assertions. Live request #24: owner saw no withdrawal control after claim; revision #15 direct POST returned HTTP 409 and final state remained IN_REVIEW.", "Automated and deployed denial checks passed; no pre-rollout data baseline is retained."],
             ["AC-12-04 claim/withdraw race", "TEST-12-04: one 200, one 409, one state-consistent event.", "CI GREEN in isolated DB."],
             ["AC-12-05 lists, history and UI scope", "CI TEST-12-05 plus live request #22 and #23 histories; submit -> claim -> approve events recorded.", "CI GREEN; live flow observed with synthetic accounts."],
             ["AC-12-06 summary counts state without reviewer decision", "TEST-12-06: WITHDRAWN totals reconcile; reviewer decision totals unchanged.", "CI GREEN in isolated DB."]], [151, 251, 101]),
          Spacer(1, 6), box("<b>Evidence limitation:</b> A pre-rollout full data baseline could not be recovered from retained files or current Cloud SQL backups; automatic backups are currently disabled. Targeted UI checks are transcribed in the evidence log, and direct deployed API responses plus a no-mutation fingerprint are included. These checks do not establish full rollout-wide equality. This report attributes live checks to Codex-assisted testing, not independent student UAT. Preserve all data; do not reset/reseed or delete shared data.", colors.HexColor("#fff8e5"), GOLD),
          Spacer(1, 6), P("Relevant status", "H2x"),
           P("Issue #96 is closed with RED/GREEN and regression evidence. Issue #97 remains open: direct deployed API denials and a no-mutation fingerprint are recorded. The retained evidence lacks a complete pre-rollout snapshot, so full data preservation across deployment cannot be established. Live UI results are transcribed; no screenshot files were retained.", "Bodyx"),
           cap("B-09/B-10", "Reconcile contract criteria and live-check evidence", "Live owner/normal UI paths and request #24 restrictions observed; isolated API guards passed; full production data comparison pending", "Latest deployment run #46129131935", "PR #102 CI; current main run #46129131935; issue #97; requests #22-#24; CI run #46125181878"), PageBreak()]

# Page 11 - metrics 1 and 2
story += [P("Part C | Dated metrics and embedded source lists", "H1x"),
          P("Evidence C-01 | Snapshot window: 25 Nov 2026 00:00 through 27 Nov 2026 16:45, Asia/Bangkok. Collected at 16:45; source lists are embedded below. The current source and later deployment outcomes are reported separately from this dated snapshot.", "Bodyx"),
          P("Metric 1 - Completed Lab 7 issues", "H2x"),
          P("Definition: lab7-labeled issues #94-#99 whose closed_at timestamp falls in the window. Value: 3. This counts repository workflow state, not acceptance completion.", "Smallx"),
          T([["Issue", "Closed Asia/Bangkok", "Context"],
             ["#94", "26 Nov 22:15:04", "Change request"],
             ["#95", "26 Nov 22:15:07", "Contract review"],
             ["#97", "27 Nov 00:11:08", "Closed by release PR #103; closure does not prove every post-deploy check"],
             ["Open at snapshot", "#96, #98, #99", "Not counted"]], [82, 120, 301]),
          Spacer(1, 4), P("Metric 2 - Merged Lab 7 PRs", "H2x"),
          P("Definition: PRs #100-#106 with merged_at within the same window, counted once; PRs are not counted as issues. Value: 7.", "Smallx"),
          T([["PR", "Merged Asia/Bangkok", "Base", "Work"],
             ["#100", "26 Nov 18:23", "staging", "Contract"],
             ["#101", "26 Nov 21:49", "staging", "Implementation"],
             ["#102", "26 Nov 23:27", "staging", "State tests/evidence"],
             ["#103", "27 Nov 00:11", "main", "Release"],
             ["#104", "27 Nov 11:18", "main", "Release record"],
             ["#105", "27 Nov 11:54", "main", "RED workflow"],
             ["#106", "27 Nov 16:42", "main", "RED result record"]], [55, 117, 70, 261]),
          cap("C-01/C-02", "Count closed Lab 7 issues and merged Lab 7 PRs", "3 issue closures; 7 merged PRs in the explicit window", "Window ends 27 Nov 2026 16:45 Asia/Bangkok", "GitHub issue and PR REST snapshots; raw IDs/times above"), PageBreak()]

# Page 12 - metrics 3 and 5
story += [P("Part C | Current suite and CI outcome source rows", "H1x"),
          P("Metric 3 - One current-main automated suite run", "H2x"),
          P("Run #11 on main SHA ae5180d6e8c6fbb33cd40b65e5205844aa502be6 was the current main test/deploy run at the 16:45 metric cutoff. Its quality job later passed; this is one run, not a mix of older snapshots. Run #12 later deployed the same application code; run #13 then redeployed it at the PR #108 merge commit.", "Smallx"),
          T([["Command", "Run #11 actual result"],
             ["npm test", "32 tests: 32 pass, 0 fail, 0 cancelled, 0 skipped, 0 todo"],
             ["npm run test:e2e", "6 passed (12.0s)"],
             ["npx prisma migrate deploy / seed / Docker", "Passed in the same job; isolated PostgreSQL; Docker build passed"]], [190, 313]),
          Spacer(1, 5), P("Metric 5 - Lab 7 pull-request CI outcomes", "H2x"),
          P("Definition: completed Pull request CI runs for PRs #100-#106 in the window, one per Actions run ID. Failed attempts remain counted. Value: 10 runs = 8 success, 2 failure, 0 cancelled, 0 skipped, 0 in progress.", "Smallx"),
          T([["Run ID", "PR", "Result", "Head"],
             ["45805719043", "#100", "success", "609d433"],
             ["45840358544", "#101", "failure", "26ecd06"],
             ["45842057791", "#101", "success", "38e08dc"],
             ["45849838613", "#102", "failure", "6d679fa"],
             ["45851133784", "#102", "success", "5c6cb83"],
             ["45858041658", "#102", "success", "9bb739c"],
             ["45861158990", "#103", "success", "1980773"],
             ["45927258336", "#104", "success", "cc112c0"],
             ["45940764536", "#105", "success", "f708eec"],
             ["45943962967", "#106", "success", "93eb470"]], [125, 55, 78, 245]),
          P("Separate runs excluded from this PR-only count: workflow_dispatch RED run #1 is expected-failure evidence; current main deployment run #11 is a push event. After the snapshot cutoff, run #12 deployed 843d14d, run #13 deployed b1a74ad, and run #14 deployed ee4652bb after PR #109. Runs #13 and #14 succeeded after the historical cutoff.", "Tinyx"),
          cap("C-03/C-05", "Report one suite snapshot and list every in-scope PR CI run", "32/32 API and 6/6 browser pass on the historical suite snapshot; 8 pass / 2 fail in the PR-run window", "Metrics cutoff 27 Nov 2026 16:45 Asia/Bangkok", "Actions run #11 and run IDs above"), PageBreak()]

# Page 13 - UAT + action
story += [P("Part C | UAT status and evidence-based action", "H1x"),
          P("Metric 4 - UAT finding status at snapshot", "H2x"),
          T([["Direction/product", "Count and recorded status"],
             ["Incoming: our approval app", "Issue #60: one partner-reported forbidden-claim status mismatch, originally labelled FAIL/Low. Final record classifies it as not a reproduced implementation defect: supplied evidence attributes POST claim -> 403 and unchanged owner state to the partner retest; no code fix. This is not a new manual test of current revision."],
             ["Outgoing: Macau678 partner app", "Issue #64/report #65: three findings F-01 to F-03. The AI-assisted retest records F-01 and F-02 as PASS for executed cases; F-03 is partly resolved because old guide wording/references remained. Exact live SHA binding, partner disposition and human whole-product acceptance remain pending."]], [142, 361]),
          Spacer(1, 6), box("Snapshot value: one incoming report dispositioned not-defect, plus three outgoing partner-product findings (two AI-retest passes, one partly resolved). This does not support 'zero UAT defects' or whole-product acceptance. The two products and finding directions are kept separate.", PALE, BLUE),
          Spacer(1, 7), P("Interpretation and action (95 words)", "H2x"),
          P("Two PR-CI attempts failed before corrected commits passed, and the pre-change test run recorded the missing behavior as RED. The current main quality job is green, but its deployment and live smoke were not complete at the 16:45 metrics cutoff. A green test run alone does not establish live release acceptance or data continuity. Before Part D is frozen, Kittakorn-P and Lathapol should peer-check the final deployment revision and record authenticated owner withdrawal, a preserved submit/claim/decision journey, forbidden-role/owner denial, and unchanged existing data against that exact revision. Do not report these checks as completed until observed.", "Bodyx"),
          P("The recommendation is evidence-based: the recorded gaps are specifically the missing authenticated post-deployment checks in Issue #97/release evidence. The action has a named team owner and a milestone (before Part D freeze).", "Smallx"),
          cap("C-04/C-06", "Separate incoming and outgoing finding ledgers, then select a concrete action", "No new human UAT is claimed; live checks are assigned before Part D freeze", "Snapshot 27 Nov 2026 16:45 Asia/Bangkok", "Issues #60/#64/#97; Lab 6 retest records"), PageBreak()]

# Page 14 - readiness
story += [P("Part D | Release readiness checklist", "H1x"),
          box("<b>NOT READY for operational rollback acceptance; selected data-equivalence checks passed.</b> Current main SHA 1a514748 is deployed and run #46129131935 passed. Live owner withdrawal and normal journey were recorded on revision #14; revision #15 reload preserved #22/#23/#24 fields/state/history. Direct API attempts against #24 returned owner 409, other requester 404, reviewer 403; the hash of all 24 requests/histories matched before and after these denied attempts. A complete database-wide pre-rollout snapshot is unavailable. Unmodified old-image rollback failed (HTTP 500); a schema-compatible rebuild of that app returned 200 and read WITHDRAWN. The compatible image is published; rollback tag selection and label checks are implemented locally, with 5 targeted tests passing, but await review/merge and a no-traffic Cloud Run rehearsal. Both students approved the contribution/reflection text as written, per Lathapol's 28 Nov confirmation.", LIGHT_RED, RED),
          Spacer(1, 6), T([["Readiness item", "Evidence/status", "Outstanding action"],
              ["Submitted/deployed version", "Main SHA 1a514748d930a90a864f180696bea284fc64c289; run #46129131935; revision approvals-r46129131935-1; 100% traffic; no Lab 7 tag.", "Retain this exact release identity unless another deployment occurs before submission."],
             ["Defects by severity/status", "No confirmed open Lab 7 implementation defect in these records. Issue #60 was dispositioned not-defect; this is not proof no defects exist.", "Record and classify any new failure before the final report freeze."],
              ["Automated checks", "Run #46129131935 succeeded: npm test, Playwright, migration, seed, Docker, deploy and smoke steps passed.", "Retain failed historical runs (#47/#49 and CI failures) in metrics and chronology."],
              ["Selected user tests", "On revisions #14/#15, #22 Withdrawn/2 events, #23 Approved/3 events, and #24 In review/2 events retained expected fields/state/history. Revision #15 API denials returned 409/404/403; the 24-row hash was unchanged across denials.", "Selected-record checks passed; full database snapshot unavailable. Isolated fixture equivalence and compatible-image read passed; production rollback workflow changes are implemented locally and await review/merge and rehearsal."],
             ["Technical debt", "Unmodified old image returns HTTP 500; enum-compatible rollback rebuild works in isolation but is not yet an Artifact Registry target.", "Block the exact old image; publish and select the tested enum-compatible rebuild, then rehearse the deployment rollback path."],
             ["Config/secrets", "No credential values included. CI used isolated synthetic DB; deployment uses secret-backed configuration.", "Use private course handoff for any demo credentials; never commit them."],
             ["Docs/run instructions", "Repo contains deployment/setup instructions, contract, tests and evidence records.", "Teammate verify the linked run/setup instructions against final candidate."],
              ["Deploy/smoke", "Run #46129131935 deployed 1a514748 as approvals-r46129131935-1; read-only smoke passed, /api/health=ok, /api/version matched.", "Smoke is separate from authenticated feature/data evidence; see request #22/#23 observations."]], [122, 215, 166]),
          Spacer(1, 4), P("This status is for the maintained Sprint 1 behavior and CR-L7-01 only. It is not a claim that the entire three-sprint application is complete or incomplete.", "Smallx"),
          cap("D-01", "Assess readiness from the exact deployed revision and stated scope", "Release is NOT READY for full rollback/data-equivalence acceptance; report review is confirmed", "28 Nov 2026", "Actions run #46129131935; API denial JSON; requests #22-#24; issue #97"), PageBreak()]

# Page 15 - debt / retrospectives
story += [P("Part D | Deferred engineering risk and retrospective", "H1x"),
          P("Technical debt / risk table", "H2x"),
          T([["Item and type", "Impact", "Priority", "Disposition / action"],
              ["Operational rollback workflow review and rehearsal (pending)", "The exact pre-withdrawal image returns HTTP 500; the published enum-compatible rebuild reads the row successfully in isolation. Workflow changes to select and verify it are prepared locally, await review/merge, and need a no-traffic Cloud Run rehearsal.", "High until verified", "Old image read test failed; compatible schema rebuild passed list/detail and retained WITHDRAWN. Merge the reviewed workflow guard, deploy the published image as a no-traffic revision, and verify health/version before accepting operational rollback readiness."],
              ["Full-database snapshot not retained (evidence limitation, not known defect)", "Controlled synthetic records #22/#23/#24 and their histories were compared across revisions #14/#15; all 24 visible records also had an unchanged hash before/after the denied API calls. No full database-wide pre-rollout export is available.", "Medium; bounds preservation claim", "Report the selected-record checks and limitation; preserve a full baseline for future releases."],
              ["No Lab 7-specific release tag", "A stable named reference is less convenient; immutable commit and revision are still recorded.", "Low", "Current main SHA 1a514748d930a90a864f180696bea284fc64c289 and revision are recorded. Team may tag only after freezing the submitted version."]], [150, 135, 83, 135]),
          Spacer(1, 5), P("The operational rollback incompatibility is confirmed for the unmodified historical image; the enum-compatible rebuild is published and passed in isolation. Release workflow changes remain under review. The full-database snapshot gap is an evidence limitation. Other known/observed feature test failures are retained in Part B and were corrected before merge.", "Smallx"),
          P("Three retrospective answers - student-reviewed", "H2x"),
          T([["Question", "Evidence-based answer (approved as written per team report)"],
             ["What helped?", "Keeping the test-only commit let CI demonstrate a genuine failure against the pre-change route, and the isolated database avoided changing shared requests. The teammate review caught both the UI request-body mismatch and the incorrect summary-test expectation before merge."],
             ["What hurt?", "The first feature and test CI attempts failed, and the pre-change RED result was not captured until a separate workflow was added. The deployment issue closed on merge before authenticated live checks were recorded; the team added follow-up evidence afterward."],
             ["What changes for final release?", "Add an explicit release-evidence gate for authenticated role/state checks and before/after data comparison, then require a second student to reconcile the exact deployed revision before closing the release checklist."]], [125, 378]),
          P("These responses were drafted from repository evidence by Codex and approved as written by both students, as reported by Lathapol on 28 Nov 2026. They are not represented as independent student-written text.", "Smallx"),
          cap("D-02/D-03", "Separate deferred risk from actual defects and record three short reflections", "Technical limits are explicit; both students' approval is reported", "28 Nov 2026", "Release record; CI run history; Lathapol's team confirmation"), PageBreak()]

# Page 16 - contributions/AI
story += [P("Part D | Contributions, AI use and final review", "H1x"),
          T([["Member", "Recorded contribution in this evidence chain", "Review attribution"],
              ["Kittakorn Poungpien (Kittakorn-P)", "Authored feature PR #101 (3 commits, 10 files), regression/evidence PR #102 (3 commits, 2 files), main release PR #103, PDF/release-evidence PRs #108-#110. Approved contract PR #100. Pair work outside Git is not inferred.", "Approved PR #100. Authored PRs #101-#103 and #108-#110. Contribution wording approved as written per Lathapol's 28 Nov report."],
              ["Lathapol Srikhiao (Lathapol)", "Authored contract PR #100 and reviewed feature/test/release changes. Authored evidence PRs #104-#107 and follow-up commits in PR #110; reviewed PDF PRs #108-#110. Do not treat docs/CI activity as manual app UAT.", "Approved PR #101; requested changes then approved #102/#103 and #108-#110; merged #110. Contribution wording approved as written per Lathapol's 28 Nov report."],
             ["Codex AI assistance", "Drafted/edited code, tests, workflow/evidence docs and this report; inspected repository/API/Actions; executed tool-assisted authenticated UI checks with synthetic accounts on the deployed app. No independent student execution or acceptance is claimed.", "AI output is not student review. Both students own the submitted work and must verify every claim."]], [134, 226, 143]),
          Spacer(1, 5), P("Limitations and sign-off", "H2x"),
          T([["Before submission", "Status"],
              ["Authenticated live checks on revisions #14 and #15", "#24 requester2/reviewer UI checks were on #14; #22/#23/#24 reloads on #15 retained states/history. Deployed POST attempts on #15 returned owner 409, other requester 404, reviewer 403; final #24 GET remained In review."],
             ["Existing-data before/after comparison", "Controlled synthetic requests #22/#23/#24 were recorded on revision #14 and reloaded on #15 with fields, states, assignment and history unchanged. The 24-row/history hash was also unchanged across denied API calls. No full database-wide pre-rollout export was found; current Cloud SQL backup list is empty and automatic backups are disabled now."],
              ["Screenshots/log excerpts", "No screenshot files were retained. Timestamped UI observations are transcribed in the evidence log; direct API statuses and no-mutation fingerprint are captured in the evidence JSON and summarized on page 18."],
              ["Lathapol review of release update; confirm contribution/retrospective text", "Approved as written per Lathapol's chat confirmation on 28 Nov 2026."],
             ["Kittakorn-P review of complete PDF and confirm contribution/retrospective text", "Approved as written per Lathapol's chat confirmation on 28 Nov 2026."],
             ["Both students confirm actual pair work and approve the contribution table", "Approved as written per Lathapol's chat confirmation on 28 Nov 2026."],
              ["Freeze the deployed main SHA/revision for the report", "Recorded: 1a514748 / approvals-r46129131935-1; no later app code change is included."]], [294, 209]),
          Spacer(1, 5), box("Release readiness is reported as NOT READY for full rollback/data-equivalence acceptance; this is an explicit assessed conclusion, not a claim that the report is unfinished. The controlled cross-revision checks, limitations, contribution attribution and both students' reported approval are included. Recheck release metadata if the deployed app changes before upload.", PALE, BLUE),
          cap("D-04/D-05", "Record actual attributed work, AI assistance and student review", "Tool-assisted tests are attributed; both students' approval is reported, and no independent student execution is claimed", "28 Nov 2026", "PR history; docs/ai_use.md; live-check record; Lathapol's 28 Nov confirmation"), PageBreak()]

# Page 17 - index
story += [P("Evidence index and reproduction references", "H1x"),
          T([["ID", "Evidence / source", "Supports"],
             ["A-01..04", "Issue #94; PR #100; docs/sprints/sprint-1/contracts.md; PR #101 review.", "Old/new rule, impact and pre-implementation review."],
             ["B-01", "Lab 6 acceptance record; PRs #100-#110; commits 2361637, 26ecd06, 38e08dc; deployment runs #8/#12-#15.", "Baseline and source/version trace."],
             ["B-02", "Actions run #1, job 140322082516; artifact lab7-red-2361637.", "Actual pre-change RED command/output/counts."],
             ["B-03..06", "src/requests.ts; test/withdrawals.test.cjs; test/browser/withdrawal.spec.ts; Actions runs #47-#51 and #13.", "Code diff, criteria and current green/regression results."],
             ["B-07..12", "PR #103/#110; Actions run #46129131935; revision approvals-r46129131935-1; issue #97; requests #22-#24; deployed-api-denials-2026-11-28.json.", "Current main release, image/migration identity, smoke, live observations, direct API denials and denial-interval hash."],
             ["C-01..06", "GitHub REST issue/PR/Actions snapshots; metrics-2026-11-27.md; issues #60/#64/#97.", "Five dated metrics, source lists and action."],
             ["D-01..06", "Current deployment run #15; rollback-data-equivalence-2026-11-28.md; release record; PR reviews; docs/ai_use.md; this final report copy.", "Readiness/debt, retrospective proposals, contribution and AI-use limits."]], [78, 252, 175]),
          Spacer(1, 6), P("Reproducible source queries for the metrics snapshot", "H2x"),
          Preformatted("GET /repos/Lathapol/sprint-group-work/issues?state=all&per_page=100\nGET /repos/Lathapol/sprint-group-work/pulls?state=all&per_page=100\nGET /repos/Lathapol/sprint-group-work/actions/runs?per_page=100\nFilter closed_at / merged_at / run created_at to the stated Asia/Bangkok window.\nCount one per issue, PR or Actions run ID; preserve failures and exclude workflow_dispatch from PR CI.", styles["Codex"]),
          P("Repository and deployment references", "H2x"),
          P(f"Repository: {link('https://github.com/Lathapol/sprint-group-work','github.com/Lathapol/sprint-group-work')} | Current main: 1a514748 | Current revision: approvals-r46129131935-1 | App: https://approvals-389973748230.asia-southeast1.run.app", "Smallx"),
          P("This PDF embeds the relevant summaries and source lists so issue/PR/Actions links are corroboration, not the only evidence. No passwords, tokens or real user data are included.", "Smallx"),
          cap("E-01", "Locate each included claim by evidence ID", "Every section identifies the actual source and remaining limitations", "27 Nov 2026", "This self-contained report draft")]


# Page 18 - additional authenticated live observations and automated API results
story += [PageBreak(), P("Part D | Additional live checks and API regression evidence", "H1x"),
          box("FINAL SUBMISSION COPY - RELEASE READINESS: NOT READY FOR FULL ROLLBACK/DATA-EQUIVALENCE ACCEPTANCE", LIGHT_RED, RED),
          Spacer(1, 5), P("Authenticated app observations on 28 Nov 2026", "H2x"),
          T([["Case", "Observed result"],
             ["#24 owner-after-claim", "requester1 created the synthetic Purchase request (THB 1) at 07:35:01 UTC; reviewer1 claimed it at 07:58:53 UTC. In review page showed no withdrawal control."],
             ["#24 other requester", "requester2 opening /requests/24 saw Request not found."],
             ["#24 reviewer UI", "On revision #14, reviewer1 saw In review, assigned reviewer1, and Approve/Reject/Return controls; no withdrawal control."],
             ["#24 post-deployment reload", "On revision #15 after docs-only PR #110 deployment, requester1 reloaded the request: it remained In review, reviewer1 assigned, same two history events, and no withdrawal control."],
             ["#22/#23 post-deployment reloads", "On revision #15, requester1 read #22 as Withdrawn with unchanged fields and two events; #23 as Approved with reviewer1 and the expected three events. No actions were performed."],
             ["#21 retained history", "requester1 saw Withdrawn, Purchase, THB 25, Unassigned. History remained Created -> Pending (13:26:14 UTC) and Pending -> Withdrawn (13:26:22 UTC), reason Requester withdrew the request."]], [125, 378]),
          Spacer(1, 5), P("Deployed and isolated API results", "H2x"),
          T([["Test", "Assertion and recorded result"],
             ["Revision #15 direct denial checks", "requester1 (owner after claim) -> HTTP 409 INVALID_TRANSITION; requester2 -> HTTP 404 NOT_FOUND; reviewer1 -> HTTP 403 FORBIDDEN. Final GET confirmed #24 remains IN_REVIEW, assigned reviewer1."],
             ["Current denial-interval no-mutation check", "Reviewer-visible 24-request + history snapshot: state counts and SHA-256 42b2d4bc4a72b8b6085017df8554f666b8c955e1580f7794037ba5355c1fc1ea matched before/after all three denied calls. This does not compare across deployment."],
             ["TEST-12-02/03; test/withdrawals.test.cjs", "Reviewer -> HTTP 403; unrelated requester -> HTTP 404; owner after claim -> HTTP 409. The test asserts state remains IN_REVIEW and history count is unchanged."],
             ["TEST-12-01; test/withdrawals.test.cjs", "Eligible owner -> HTTP 200; original request fields retained; exactly one withdrawal history row; repeat attempt -> HTTP 409."],
             ["CI run #46125181878", "Passed on commit 56d4b653168b8bd4bd45620c521a3bbcf3c14914. npm test, Playwright end-to-end tests, and Docker build passed. This is isolated CI evidence, not an API call to the deployed database."]], [125, 378]),
          Spacer(1, 5), P("Release limitation and evidence scope", "H2x"),
          P("The controlled synthetic records #22-#24 were compared across revisions #14/#15, and the current 24-request/history snapshot was unchanged across the denied API calls. A complete database-wide pre-rollout export was not retained; the report therefore makes no global equality claim. Timestamped UI observations and direct API log data are included, although screenshots were not retained. Both students approved the contribution table and retrospective as written, per Lathapol's report on 28 Nov 2026. The unmodified pre-withdrawal image returns HTTP 500 with a WITHDRAWN row. The published compatibility image `rollback-0334c966c396912dfaf2e309e044753f11d4e47c` at digest `sha256:a01e2edf25c473a1082da316725683128dc91c8635cdb004516945e4b7cfb44a` returned HTTP 200 for login, list, and detail on the same WITHDRAWN fixture. The request/history fingerprint stayed unchanged. Isolated data-equivalence and published-image read acceptance passed; operational rollback readiness remains pending because workflow selection/guard changes await review/merge and a no-traffic deployment rehearsal.", "Bodyx"),
          P(f"Evidence log: {link('https://github.com/Lathapol/sprint-group-work/issues/97#issuecomment-7237170655','Issue #97 post-deployment update')} | CI: {link('https://github.com/Lathapol/sprint-group-work/actions/runs/46125181878','run #46125181878')}", "Smallx"),
          cap("B-11/B-12", "Record post-deployment checks, direct denial responses and no-mutation fingerprint", "Controlled UI and deployed API checks passed; no full-database pre-rollout export is claimed; student approvals are reported", "28 Nov 2026; run #46129131935", "Requests #21-#24; Issue #97; deployed-api-denials-2026-11-28.json; test/withdrawals.test.cjs; Actions runs #46125181878/#46129131935; PR #110")]


# Page 19 - rollback and selected data-equivalence acceptance
story += [PageBreak(), P("Part D | Rollback and data-equivalence acceptance", "H1x"),
          box("ISOLATED COMPATIBILITY AND DATA-EQUIVALENCE: PASSED. OPERATIONAL ROLLBACK: PENDING WORKFLOW REVIEW AND NO-TRAFFIC REHEARSAL.", LIGHT_RED, RED),
          Spacer(1, 6), P("Isolated rollback rehearsal - 28 Nov 2026", "H2x"),
          T([["Check", "Acceptance criterion", "Observed result"],
             ["Pre-withdrawal image rollback", "Old code path must read the new enum value; use an explicitly compatible target.", "FAIL as-is: historical app commit 0334c966 logged in (200) but GET /api/requests returned HTTP 500 PrismaClientUnknownRequestError with WITHDRAWN data."],
             ["Compatible rollback rebuild", "Pre-change feature code plus Prisma enum awareness reads the new row.", "PASS in isolation: login 200; list 200; detail 200; state WITHDRAWN. Published image digest tag rollback-0334c966c396912dfaf2e309e044753f11d4e47c, digest sha256:a01e2edf25c473a1082da316725683128dc91c8635cdb004516945e4b7cfb44a; labels verified."],
             ["Current app read", "Current image must read the same fixture state.", "PASS: login 200, request list 200, detail 200; state returned as WITHDRAWN."],
             ["No-mutation/equivalence check", "A failed read must leave request and history rows unchanged.", "PASS for isolated data: before/after SHA-256 over all Request and RequestHistory rows matched: 53F8209CC4A674F322E6AB332C75D01136DC5C37652C2BCD00FC96F48ED9B5CA. Fixture ID 5 stayed WITHDRAWN with its two history transitions." ]], [112, 172, 219]),
          Spacer(1, 7), P("Interpretation", "H2x"),
          P("The exact historical image cannot serve the request list. A rebuild of its application code with only the Prisma enum extended read list/detail successfully and preserved WITHDRAWN. Request/history rows were unchanged across the rehearsal. This compatibility target is published but not selected by the current main deployment workflow; the live database was not compared database-wide. The earlier live comparison of synthetic requests #22-#24 across revisions #14/#15 remains selected-record evidence, not a full database-wide snapshot.", "Bodyx"),
          P("Acceptance disposition", "H2x"),
          P("The compatible image is published, selected fixture data-equivalence passed, and the release script/workflow now gate selection on rollback-compatible tag/image labels; 5 targeted tests passed locally. Keep operational rollback readiness pending until these workflow changes are reviewed/merged and the deployment path is rehearsed as a no-traffic Cloud Run revision. Do not reuse the unmodified historical image after WITHDRAWN records exist. One rollback-compatible image was published to Artifact Registry. No production database or Cloud Run service/traffic was changed for this rehearsal.", "Bodyx"),
          P("Reproduction: disposable Docker PostgreSQL 18, historical migrations through 20261124000200_returned_reason, synthetic accounts and request fixture, then migrations 20261126000100_withdrawn_state and 20261126000200_withdrawn_reviewer_invariant. The test evidence is retained in docs/labs/lab-07/evidence/rollback-data-equivalence-2026-11-28.md. Container network and database were isolated from the live service.", "Smallx"),
          cap("D-06", "Rehearse old-image rollback with a withdrawn synthetic row and compare request/history fingerprint", "Old image failed; enum-compatible rebuild and selected data-equivalence passed; workflow review/merge and no-traffic Cloud Run rehearsal remain pending", "28 Nov 2026", "rollback-data-equivalence-2026-11-28.md; rollback-compatible-schema.patch; pre-change commit 0334c966; published compatible image digest sha256:a01e2edf25c473a1082da316725683128dc91c8635cdb004516945e4b7cfb44a") ]

doc = SimpleDocTemplate(str(OUTPUT), pagesize=A4, leftMargin=48, rightMargin=48, topMargin=43, bottomMargin=39, title="CPE 334 Lab 7 - Sprint 1 Maintenance - Section 31 Submission 28 Nov 2026", author="Workflow and Approval System Team", subject="Self-contained Lab 7 evidence report")
doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
print(OUTPUT)
