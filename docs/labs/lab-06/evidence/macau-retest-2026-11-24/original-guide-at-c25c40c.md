# Sprint 1 UAT Test Cases and Handoff

**Project:** Macau678 Purchase Approval System  
**Branch:** `docs/1-uat`  
**Release Commit:** `f9d6538` — "deploy-proof make visible change in home page"  
**Application Version:** Version 0.2 (displayed on home page)  
**Prepared by:** Macau678 Development Team  
**Date:** 2026-11-19

---

## 1. Sprint 1 UAT Scope

This UAT covers the **Sprint 1** delivered requirements only.

### In Scope (Sprint 1 — FEAT-01 to FEAT-09)

| Feature | Description | SRS Reference |
|---------|-------------|---------------|
| FEAT-01 | User authentication (sign in / sign out) | FR-01, AC-01 |
| FEAT-02 | Role-based access control (REQUESTER / REVIEWER) | FR-02, AC-02 |
| FEAT-03 | Submit new purchase request | FR-03, AC-03, AC-04 |
| FEAT-04 | Reviewer: Approve purchase request | FR-04, AC-05 |
| FEAT-05 | Reviewer: Return purchase request with reason | FR-05, AC-06, AC-07 |
| FEAT-06 | Requester: Edit and resubmit returned request | FR-06, AC-07 |
| FEAT-07 | Requester: View own requests (dashboard) | FR-07, AC-08, AC-09 |
| FEAT-08 | Reviewer: View assigned requests (dashboard) | FR-07, AC-08, AC-09 |
| FEAT-09 | Reject purchase request with reason (terminal state) | FR-04, AC-05, AC-06, BR-07 |

### Acceptance Criteria in Scope (AC-01 to AC-11)

| AC | Description |
|----|-------------|
| AC-01 | Only authenticated users can access the application |
| AC-02 | Users are assigned exactly one role (REQUESTER or REVIEWER) |
| AC-03 | A new purchase request requires item name, quantity, estimated cost, and justification |
| AC-04 | A submitted request transitions from DRAFT → SUBMITTED |
| AC-05 | A REVIEWER can Approve or Reject a SUBMITTED request |
| AC-06 | Reject and Return actions require a mandatory non-empty reason |
| AC-07 | A returned request can be edited and resubmitted by its owner |
| AC-08 | Each user sees only their own requests on their dashboard |
| AC-09 | Reviewers see only requests assigned to them |
| AC-10 | Access to another user's request is denied |
| AC-11 | Full audit history is maintained and displayed per request |

### Out of Scope (Sprint 2 / Sprint 3)

- FR-08 / AC-12: Email notifications (planned Sprint 2)
- FEAT-10, FEAT-11: Advanced filtering and reporting (Sprint 2/3)

---

## 2. Deployed Application

| Field | Value |
|-------|-------|
| **Application URL** | `https://macau678-<hash>-as.a.run.app` *(exact URL provided privately by the team)* |
| **Release Commit** | `f9d6538` |
| **Branch** | `main` (merged from `feature/deploy-proof`) |
| **Version Identifier** | "Macau678 Purchase Approval System Version 0.2" |
| **Hosting Platform** | Google Cloud Run (GCP) |

> [!IMPORTANT]
> The partner team will receive the exact deployed URL privately along with account credentials. Do **not** include production URLs or passwords in this document.

---

## 3. Test Accounts

Credentials for the following accounts will be shared **privately** with the partner UAT team (not documented here per security policy).

| Label | Email | Role | Use For |
|-------|-------|------|---------|
| **UAT-REQUESTER-01** | `requester1@macau678.com` | `REQUESTER` | Submit, edit, resubmit requests |
| **UAT-REVIEWER-01** | `reviewer1@macau678.com` | `REVIEWER` | Approve, reject, return requests |

> Passwords are stored in GCP Secret Manager and will be communicated to the partner team through a secure channel.

---

## 4. Synthetic Test Data

The database is pre-seeded with:
- One REQUESTER account (`requester1@macau678.com`)
- One REVIEWER account (`reviewer1@macau678.com`)
- Both accounts are linked so the reviewer can see the requester's submitted requests

### Data Notes

- **Test data accumulates** as UAT is performed — each test creates new requests.
- Accumulated requests do not affect login or access control tests.
- For a clean slate (optional), the development team can re-run the seed script.

### Data Reset (if requested)

Contact the development team to reset the database to its initial seed state:

```bash
# Run by the development team on the server if needed:
npm run db:seed
```

This restores both seed accounts and clears accumulated test requests.

---

## 5. Pre-Test Setup Checklist

Before executing any test case, verify the following:

- [ ] You have received the **application URL** and **account credentials** from the team.
- [ ] You can open the application URL in a modern browser (Chrome, Firefox, or Edge — latest version).
- [ ] You can reach the sign-in page (a login form is visible).
- [ ] No prior session is active — open an Incognito/Private window for each role switch.
- [ ] You have the email addresses for both UAT-REQUESTER-01 and UAT-REVIEWER-01.

---

## 6. UAT Test Cases

### UAT-TC-01 — Normal Domain Journey: Complete Purchase Approval Lifecycle

| Field | Detail |
|-------|--------|
| **Test Case ID** | UAT-TC-01 |
| **Category** | Normal Domain Journey |
| **Purpose** | Verify the end-to-end happy-path flow: a Requester submits a purchase request and a Reviewer approves it, with the full audit history preserved. |
| **User Roles** | REQUESTER (UAT-REQUESTER-01), REVIEWER (UAT-REVIEWER-01) |
| **SRS References** | FR-01, FR-02, FR-03, FR-04, AC-01, AC-02, AC-04, AC-05, AC-11 |
| **Preconditions** | Both accounts are active. No prior session. |

**Synthetic Inputs:**

| Field | Value |
|-------|-------|
| Item Name | `Office Chair - Ergonomic` |
| Quantity | `2` |
| Estimated Cost | `12500` |
| Justification | `Required for the new team members joining next month.` |
| Approval Reason | *(none required for Approve action)* |

**Steps:**

1. Open the application URL in an Incognito browser window.
2. Sign in as **UAT-REQUESTER-01** (`requester1@macau678.com`).
3. Verify the dashboard is displayed and your role is shown as `REQUESTER`.
4. Click **"New Request"** (or equivalent button) to open the request creation form.
5. Fill in the form with the synthetic inputs above.
6. Click **"Submit"** (or **"Save and Submit"**).
7. Verify that the new request appears on the dashboard with status **`SUBMITTED`**.
8. Note the **Request ID** (visible in the URL or on the card/row).
9. Sign out from UAT-REQUESTER-01.
10. Open a **new Incognito window** and sign in as **UAT-REVIEWER-01** (`reviewer1@macau678.com`).
11. Verify the dashboard shows the submitted request from UAT-REQUESTER-01.
12. Click on the request to open its detail page.
13. Verify the status badge shows **`SUBMITTED`** and all submitted fields are correct.
14. Click **"Approve"**.
15. Verify the status changes to **`APPROVED`** on the detail page.
16. Scroll down to the **Audit History / Timeline** section.
17. Verify that the history shows at minimum: `CREATED → SUBMITTED → APPROVED` entries with timestamps and actor names.

**Expected Results:**

- ✅ Requester can log in and access the dashboard.
- ✅ Request is created and transitions to SUBMITTED.
- ✅ Reviewer sees the request and can Approve it.
- ✅ Status changes to APPROVED.
- ✅ Full audit history (CREATED, SUBMITTED, APPROVED) is visible and correct.

---

### UAT-TC-02 — Business Rule / Boundary: Mandatory Reason Enforcement

| Field | Detail |
|-------|--------|
| **Test Case ID** | UAT-TC-02 |
| **Category** | Business-Rule / Boundary Case |
| **Purpose** | Verify that a Reviewer cannot Reject or Return a request without providing a non-empty reason. The submit action must be blocked until a valid reason is entered. |
| **User Roles** | REQUESTER (UAT-REQUESTER-01), REVIEWER (UAT-REVIEWER-01) |
| **SRS References** | BR-05, AC-06, FR-04, FR-05 |
| **Preconditions** | A request in **SUBMITTED** status exists (create one using the steps from UAT-TC-01 up to step 7, or use an existing one). |

**Synthetic Inputs:**

| Field | Value |
|-------|-------|
| Reject/Return Reason (attempt 1) | *(empty — do not type anything)* |
| Reject/Return Reason (attempt 2) | `   ` *(whitespace only — press Space 3 times)* |
| Reject/Return Reason (valid) | `Budget exceeded for this quarter.` |

**Steps:**

1. Sign in as **UAT-REVIEWER-01** in an Incognito window.
2. Open a request that is in **SUBMITTED** status.
3. Click the **"Reject"** button (or equivalent action button).
4. Observe whether a reason input field or dialog appears.
5. **Boundary test 1:** Leave the reason field empty and attempt to confirm/submit the rejection.
6. Verify that the action is **blocked** (button is disabled OR an error message is shown — the rejection does not proceed).
7. **Boundary test 2:** Type only whitespace (spaces) into the reason field and attempt to confirm.
8. Verify the action is still **blocked**.
9. **Valid input test:** Clear the field and type `Budget exceeded for this quarter.`
10. Confirm/submit the rejection.
11. Verify the request status changes to **`REJECTED`**.

**Repeat with the Return action:**

12. Find (or create) another SUBMITTED request.
13. Click **"Return"** on that request.
14. Attempt to submit with an empty reason → verify blocked.
15. Enter a valid reason → confirm → verify status changes to **`RETURNED`**.

**Expected Results:**

- ✅ Empty reason → action is blocked (button disabled or validation error shown).
- ✅ Whitespace-only reason → action is blocked.
- ✅ Valid non-empty reason → Reject succeeds, status becomes `REJECTED`.
- ✅ Valid non-empty reason → Return succeeds, status becomes `RETURNED`.

---

### UAT-TC-03 — Forbidden Role / Ownership: Cross-User Access Denied

| Field | Detail |
|-------|--------|
| **Test Case ID** | UAT-TC-03 |
| **Category** | Forbidden Role / Ownership Case |
| **Purpose** | Verify that users cannot access requests that do not belong to them or that they are not authorized to review. Direct URL manipulation must be denied. |
| **User Roles** | REQUESTER (UAT-REQUESTER-01), REVIEWER (UAT-REVIEWER-01) |
| **SRS References** | BR-09, AC-10, FR-02 |
| **Preconditions** | At least one request created by UAT-REQUESTER-01 exists (from UAT-TC-01). Note the Request ID (from the URL, e.g. `/requests/abc123`). |

**Synthetic Inputs:**

| Field | Value |
|-------|-------|
| Target URL | The direct URL of a request owned by UAT-REQUESTER-01 (e.g. `https://<app-url>/requests/<id>`) |

**Steps — Part A: Reviewer accessing Requester's draft/returned request**

1. Sign in as **UAT-REVIEWER-01** in an Incognito window.
2. Note the URL of a request created by UAT-REQUESTER-01 (use a **DRAFT** or **RETURNED** status request if available, as these are owned exclusively by the Requester).
3. Navigate directly to that URL (paste it in the address bar).
4. Verify the page shows an **access denied / unauthorized** message, or redirects to the dashboard.

**Steps — Part B: Requester attempting to access another user's request**

5. Sign out from UAT-REVIEWER-01.
6. Sign in as **UAT-REQUESTER-01** in a new Incognito window.
7. Manually construct a URL for a request ID that does **not** belong to UAT-REQUESTER-01 (e.g., one created in a different test run by another user, if any exist — otherwise note the result).
8. Navigate to that URL directly.
9. Verify an **access denied** message or redirect occurs.

**Steps — Part C: Requester cannot perform Reviewer actions**

10. While signed in as **UAT-REQUESTER-01**, open one of your own SUBMITTED requests.
11. Verify that **no Approve, Reject, or Return buttons** are visible or accessible.
12. Attempt to access the reviewer action URL directly (if known) — verify it is blocked.

**Expected Results:**

- ✅ Reviewer cannot access a request they are not assigned to review.
- ✅ Requester cannot access another user's request via direct URL.
- ✅ Requester does not see Approve/Reject/Return controls on any request.
- ✅ All unauthorized access attempts result in an access-denied response or redirect.

---

### UAT-TC-04 — State / History / Persistence: Return → Edit → Resubmit Cycle

| Field | Detail |
|-------|--------|
| **Test Case ID** | UAT-TC-04 |
| **Category** | State, History, and Persistence Case |
| **Purpose** | Verify the full return-edit-resubmit lifecycle, including that the audit timeline accurately records every state transition and that edited fields persist correctly. |
| **User Roles** | REQUESTER (UAT-REQUESTER-01), REVIEWER (UAT-REVIEWER-01) |
| **SRS References** | FR-05, FR-06, BR-06, BR-08, AC-07, AC-11 |
| **Preconditions** | A request in **SUBMITTED** status exists (create one first if needed — see UAT-TC-01 steps 1–7). |

**Synthetic Inputs:**

| Field | Original Value | Edited Value |
|-------|---------------|-------------|
| Item Name | `Office Chair - Ergonomic` | `Office Chair - Ergonomic (Updated)` |
| Quantity | `2` | `3` |
| Estimated Cost | `12500` | `18750` |
| Justification | `Required for the new team members joining next month.` | `Updated: Required for 3 new team members joining next month. Cost revised.` |
| Return Reason | *(N/A)* | `Please revise the quantity and cost estimate.` |

**Steps:**

1. Sign in as **UAT-REVIEWER-01** in an Incognito window.
2. Open the SUBMITTED request created in the precondition step.
3. Click **"Return"** and enter the return reason: `Please revise the quantity and cost estimate.`
4. Confirm the Return action.
5. Verify the request status changes to **`RETURNED`**.
6. Sign out from UAT-REVIEWER-01.
7. Sign in as **UAT-REQUESTER-01** in a new Incognito window.
8. Navigate to the RETURNED request on your dashboard.
9. Verify the status shows **`RETURNED`** and the return reason is visible.
10. Click **"Edit"** (or the edit action button on the returned request).
11. Verify the edit form is pre-populated with the original field values.
12. Update the fields with the **Edited Values** in the table above.
13. Click **"Resubmit"** (or **"Save and Resubmit"**).
14. Verify the request status changes to **`SUBMITTED`** (resubmitted).
15. Scroll to the **Audit History / Timeline** section.
16. Verify the following entries appear in order:
    - `CREATED` — by requester
    - `SUBMITTED` — by requester (first submission)
    - `RETURNED` — by reviewer (with the return reason visible)
    - `EDITED` — by requester *(if tracked separately)*
    - `RESUBMITTED` — by requester
17. Verify the edited field values are saved correctly on the request detail page.

**Expected Results:**

- ✅ Reviewer can return a submitted request with a reason.
- ✅ Requester can edit a returned request.
- ✅ Edit form is pre-populated with existing values.
- ✅ Requester can resubmit; status returns to SUBMITTED.
- ✅ Audit timeline shows the complete chain of state transitions.
- ✅ Updated field values are persisted correctly.

---

### UAT-TC-05 — Terminal State Immutability: Rejected Request Cannot Be Edited

| Field | Detail |
|-------|--------|
| **Test Case ID** | UAT-TC-05 |
| **Category** | Business Rule / Terminal State |
| **Purpose** | Verify that a request in the REJECTED terminal state cannot be edited by the Requester, even via direct URL manipulation to the edit page. |
| **User Roles** | REQUESTER (UAT-REQUESTER-01) |
| **SRS References** | BR-06, BR-07, AC-07 |
| **Preconditions** | A request in **REJECTED** status exists. (Create a new request, submit it, then have UAT-REVIEWER-01 reject it with reason `Test rejection for immutability check.`) |

**Steps:**

1. Sign in as **UAT-REQUESTER-01** in an Incognito window.
2. Navigate to the REJECTED request on your dashboard.
3. Verify the status badge shows **`REJECTED`**.
4. Verify that **no "Edit" button** is visible on the request detail or dashboard card.
5. Attempt to navigate directly to the edit URL by appending `/edit` to the request URL (e.g., `https://<app-url>/requests/<id>/edit`).
6. Verify the application responds with an **"Editing Not Allowed"** message, error page, or redirect — the edit form must NOT be accessible.

**Expected Results:**

- ✅ No Edit button is shown for REJECTED requests.
- ✅ Direct URL navigation to the edit page is blocked.
- ✅ Application shows an appropriate error or redirect (not the edit form).

---

## 7. Test Execution Instructions for the Partner Team

### Browser Requirements

- Use **Google Chrome**, **Mozilla Firefox**, or **Microsoft Edge** (latest stable version).
- Use **Incognito / Private Browsing** mode when switching between roles to avoid session conflicts.
- JavaScript must be enabled.

### Session Management

- Only one role session should be active at a time.
- After completing a Requester step, **sign out** before signing in as the Reviewer (and vice versa).
- If you encounter unexpected behavior, sign out, clear cookies, and sign in again.

### Execution Order

It is recommended to execute test cases in order (UAT-TC-01 → UAT-TC-05) as later test cases may depend on data created in earlier ones.

### Recording Results

For each test case, record:

| Field | Your Entry |
|-------|-----------|
| Test Case ID | (e.g., UAT-TC-01) |
| Executed By | (tester name) |
| Date Executed | (YYYY-MM-DD) |
| Pass / Fail | (Pass / Fail / Partial) |
| Observations | (any deviations, bugs, or notes) |
| Screenshot / Evidence | (attach if applicable) |

### Reporting Issues

If any test case fails or produces unexpected results:
1. Note the exact step that failed.
2. Capture a screenshot.
3. Record the request ID and browser used.
4. Report to the Macau678 development team.

---

## 8. Cleanup Instructions

After UAT execution:

- **Test data** (requests created during testing) can be left in place — they do not affect the system.
- **Accounts** are shared test accounts and should not be deleted or have their passwords changed.
- If a database reset is needed, contact the development team to re-run the seed script.

---

## 9. Handoff Checklist

The following items are delivered to the partner UAT team:

- [x] This document: `document/lab-6/UAT_TEST_CASES.md`
- [x] UAT PDF assignment: `document/lab-6/Lab_6_Sprint_1_UAT.pdf`
- [x] Playwright automated demo script: `tests/e2e/sprint1-demo.video.spec.ts`
- [x] Video walkthrough guide: `document/lab-6/VIDEO_WALKTHROUGH.md`
- [ ] Deployed application URL *(provided privately)*
- [ ] Account credentials *(provided privately via secure channel)*

---

*End of Sprint 1 UAT Test Cases Document*


---

## 10. UAT Reviewer Checklist

Use this checklist while executing the test cases above. Check off each item as you confirm it in the live application.

### 🔐 Authentication & Access

- [ ] Sign-in page loads at the app URL without being logged in
- [ ] `requester1@macau678.com` can log in → lands on the **Requester** dashboard
- [ ] `reviewer1@macau678.com` can log in → lands on the **Reviewer** queue
- [ ] Dashboard header shows the logged-in user's name and their role label (`REQUESTER` / `REVIEWER`)
- [ ] Clicking **Sign Out** ends the session and redirects to the login page
- [ ] After signing out, pressing the browser Back button does **not** return to the dashboard
- [ ] Navigating directly to a protected URL (e.g. `/requests`) while logged out redirects to login

---

### 📋 Requester — Create & Submit

- [ ] **"New Request"** button is visible on the Requester dashboard
- [ ] The request form has all four required fields: Item Name, Quantity, Estimated Cost, Justification
- [ ] Submitting with all fields filled → request status becomes **SUBMITTED**
- [ ] The new request appears on the Requester dashboard immediately after submission
- [ ] The status badge on the dashboard card reads **SUBMITTED** (not DRAFT or PENDING)

---

### 🔍 Reviewer — Queue & Decision

- [ ] After the Requester submits, the Reviewer's dashboard shows that request
- [ ] The Reviewer can open the request detail page and see all submitted field values
- [ ] The detail page shows **Approve**, **Return**, and **Reject** action buttons for SUBMITTED requests
- [ ] Clicking **Approve** → status changes to **APPROVED**
- [ ] Clicking **Reject** without entering a reason → action is **blocked** (button disabled or error shown)
- [ ] Clicking **Return** without entering a reason → action is **blocked**
- [ ] Entering whitespace-only in the reason field → action is still **blocked**
- [ ] Entering a valid reason and clicking **Reject** → status changes to **REJECTED**
- [ ] Entering a valid reason and clicking **Return** → status changes to **RETURNED**

---

### ✏️ Requester — Edit & Resubmit

- [ ] A **RETURNED** request shows the reviewer's return reason on the detail page
- [ ] An **Edit** button is visible for RETURNED requests
- [ ] The edit form opens pre-populated with the original field values (not blank)
- [ ] The Requester can update the fields and click **Resubmit**
- [ ] After resubmit → status changes back to **SUBMITTED**
- [ ] No **Edit** button is visible for **SUBMITTED**, **APPROVED**, or **REJECTED** requests
- [ ] Navigating directly to the edit URL for a REJECTED request (e.g. `/requests/<id>/edit`) → blocked with an error or redirect (edit form is NOT shown)

---

### 📜 Audit History / Timeline

- [ ] The request detail page has an audit history / timeline section
- [ ] After the full return → edit → resubmit → approve cycle, the timeline shows entries in order:
  - `CREATED`
  - `SUBMITTED`
  - `RETURNED` (with return reason visible)
  - `RESUBMITTED` (or `EDITED` + `RESUBMITTED`)
  - `APPROVED`
- [ ] Each timeline entry shows the actor's name and a timestamp
- [ ] History entries cannot be deleted or modified by either role

---

### 🔒 Access Control & Security

- [ ] The Requester's dashboard shows **only their own requests** — not other users' requests
- [ ] The Reviewer's queue shows **only requests assigned to them**
- [ ] Navigating directly to another user's request URL → access denied or redirect (not the request detail)
- [ ] No **Approve / Reject / Return** buttons are visible to the Requester on any request
- [ ] No **New Request** or **Edit** button is visible to the Reviewer

---

### 🧾 General Quality Checks

- [ ] All status badges display the correct label for each state (SUBMITTED, APPROVED, RETURNED, REJECTED)
- [ ] No console errors or broken UI elements during normal use
- [ ] Switching roles (sign out as Requester, sign in as Reviewer) works cleanly without session bleed-over
- [ ] The application version displayed on the home page matches the documented release (Version 0.2)
