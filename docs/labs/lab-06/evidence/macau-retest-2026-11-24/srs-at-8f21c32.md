# Software Requirements Specification (SRS)

## 1. Introduction

The Macau678 Purchase Approval System is a web-based application designed to manage and control purchase requests within Macau678.

The system allows Macau678 staff to submit purchase requests and authorized reviewers to review, approve, reject, or return requests with reasons. It aims to provide a structured approval process, role-based permissions, request history, and reporting.

---

## 2. Stakeholder Request

An organization needs controlled approval of funding, purchases, travel, reimbursement, or similar requests. Users submit requests; reviewers approve, reject, or return them with reasons. The finished product should provide role permissions, state transitions, history, and reporting. Define reviewer assignment, editing rules after submission, and any multi-stage approval.

For this project, the team focuses on Macau678 purchase requests.

---

## 3. Scope

### 3.1 Included

- User authentication and role-based access.
- Requesters can create and submit purchase requests.
- Requesters can view the status and history of their own requests.
- Reviewers can view requests assigned to them.
- Reviewers can approve, reject, or return requests with reasons.
- The system records request status changes and review decisions.
- The system prevents unauthorized users from accessing or modifying requests.
- The system provides basic request filtering and reporting.

### 3.2 Explicitly Excluded

- Actual payment processing.
- Direct integration with Macau678 accounting or procurement systems.
- Purchasing products from external vendors.
- Automatic supplier selection or price comparison.
- Mobile application.
- Electronic signatures.
- Complex multi-stage approval workflows in the initial version.

---

## 4. Functional Requirements

**FR-01: User Authentication**
- The system shall allow users to log in and log out.
- The system shall identify the authenticated user's role.

**FR-02: Request Submission**
- The system shall allow Requesters to create purchase requests.
- The system shall allow Requesters to provide a request title, description, amount, and justification.
- The system shall allow Requesters to submit their requests for review.

**FR-03: Request Viewing**
- The system shall allow Requesters to view their own submitted requests.
- The system shall allow Reviewers to view requests assigned to them.
- A saved `DRAFT` request shall be visible only to its owning Requester; it shall not appear in any Reviewer queue or be accessible to Reviewers through direct request or history URLs.
- The system shall display the current status of each request.

**FR-04: Request Review**
- The system shall allow assigned Reviewers to approve requests.
- The system shall allow assigned Reviewers to reject requests with a reason.
- The system shall allow assigned Reviewers to return requests with a reason.

**FR-05: Request Updates**
- The system shall allow Requesters to edit requests that have been returned to them.
- The system shall prevent Requesters from editing requests that are pending review or have been approved or rejected.

**FR-06: Request History**
- The system shall record request creation and submission.
- The system shall record review decisions, reasons, timestamps, and the user responsible.
- The system shall allow authorized users to view request history.
- Requester history shall include `CREATED`, `SUBMITTED`, and Requester-generated `EDITED` records. This applies to direct submission as well as saving a draft first. For direct submission, `CREATED` records request creation and `SUBMITTED` records the transition to review; the Reviewer history omits `CREATED` and requester-generated `EDITED` records while retaining `SUBMITTED` and review events.
- When a Requester resubmits a returned request, the `RESUBMITTED` note shown to the Reviewer shall combine the Requester's edit notes recorded since the latest `RETURNED` event, in chronological order. The final note entered during the resubmit must not be duplicated. Individual `EDITED` records remain in Requester history and stay hidden from Reviewers.
- Submission of a draft shall be shown to Reviewers as `SUBMITTED` with the transition `None → Pending Review`; `PENDING_REVIEW` shall be displayed as “Pending Review”.

**FR-07: Request Assignment**
- The system shall assign each submitted request to an authorized Reviewer.
- The system shall prevent Reviewers from reviewing requests that are not assigned to them.

**FR-08: Reporting**
- The system shall provide a basic overview of requests by status.
- The system shall allow authorized users to filter requests by status and date.

---

## 5. Business Rules

**BR-01:** Every purchase request must be submitted by an authenticated Requester.

**BR-02:** Every submitted request must be assigned to an authorized Reviewer.

**BR-03:** A Requester cannot approve or review their own request.

**BR-04:** A Reviewer can only review requests assigned to them.

**BR-05:** A Reviewer must provide a reason when rejecting or returning a request.

**BR-06:** A Requester can only edit a request when it has been returned.

**BR-07:** A request must follow valid status transitions:
- Draft → Pending Review
- Pending Review → Approved
- Pending Review → Rejected
- Pending Review → Returned
- Returned → Pending Review

**BR-08:** Every review decision and status change must be recorded in the request history.

**BR-09:** Users must not access requests outside their assigned permissions.

**BR-10:** The initial version uses a single-reviewer approval process.

---

## 6. Non-Functional Requirements

**NFR-01: Security**
- The system shall require authentication before users access protected features.
- The system shall enforce role-based authorization on the server.
- The system shall prevent unauthorized access to request information.

**NFR-02: Usability**
- The system shall provide a clear and understandable interface.
- The system shall display request statuses clearly.
- The system shall provide understandable error messages.

**NFR-03: Performance**
- The system should respond to normal user operations within 3 seconds under expected usage.

**NFR-04: Reliability**
- The system shall preserve submitted requests and review history in the database.
- The system shall prevent invalid status changes.

**NFR-05: Maintainability**
- The system should use a modular architecture.
- The system should allow future features to be added without major restructuring.

---

## 7. Assumptions and Decisions

**AD-01:** The system is designed for Macau678 purchase request approval.

**AD-02:** The initial system has two main roles: Requester and Reviewer.

**AD-03:** Each submitted request is assigned to one Reviewer.

**AD-04:** A Reviewer cannot approve or review their own request.

**AD-05:** Requesters can edit requests only after they have been returned.

**AD-06:** Rejection and return decisions require a reason.

**AD-07:** The initial version uses a single approval stage.

**AD-08:** Actual payment and purchasing activities take place outside the system.

**AD-09:** The team may revise these assumptions as requirements become clearer during development.

---

## 8. Acceptance Criteria

**AC-01:** A user can log in and access features according to their role.

**AC-02:** A Requester can create and submit a purchase request.

**AC-03:** A Requester can view their own requests and their current statuses.

**AC-04:** An assigned Reviewer can view and review a purchase request.

**AC-05:** A Reviewer can approve a request.

**AC-06:** A Reviewer must provide a reason to reject or return a request.

**AC-07:** A Requester can edit and resubmit a returned request.

**AC-08:** A Requester cannot approve their own request.

**AC-09:** A Reviewer cannot review a request assigned to another Reviewer.

**AC-10:** Users cannot access requests they are not authorized to view.

**AC-11:** The system records review decisions and status changes in the request history.

**AC-12:** Authorized users can filter requests and view basic request summaries.
