# AI Use Declaration

**Project:** CPE 334 Workflow and Approval System | **Last updated:** 25 November 2026

This file lists the AI tools used on the project and the tasks they assisted. It is updated whenever a new kind of AI assistance is used. Full transcripts are not kept in the repository.

## Tools

| Tool | Used for |
|---|---|
| Claude (Anthropic, chat) | Planning, explaining the course documents, drafting documents (see task log) |
| VS Code built-in chat agent | Read-only review of repository documents |
| Codex (OpenAI desktop coding agent) | Repository/document inspection, issue/PR preparation, application/test implementation, executed local/CI/cloud verification, deployment assistance, evidence and report drafting under the user's direction |

## Task log

| Date | Issue | Tool | Task | Human work and review |
|---|---|---|---|---|
| 5 Nov 2026 | #1 | VS Code chat agent | Read-only review of `docs/sprints/sprint-1/proposed-scope.md` against the Sprint 1 requirements; listed gaps and options. No files were changed. | The team chose the answer to each gap. |
| 5 Nov 2026 | #1 | Claude | Listed the scope questions to decide and formatted the resulting decisions table (D-01 to D-14). | The team made every decision and recorded it in Issue #1. |
| 5 Nov 2026 | #2 | Claude | Drafted `docs/srs.md`, `docs/features.md` and `docs/traceability.md` from the Issue #1 decisions. | The team reviewed the drafts, changed the reviewer-visibility rule (D-14) and approved the rest. |
| 5 Nov 2026 | #3 | Claude | Drafted `docs/system-sds.md` and `docs/sprints/plan.md` from the team's design choices (session design, hashing, enforcement, concurrency, API conventions, deployment plan). | The team chose the options; the drafts are reviewed in the pull request. |
| 5 Nov 2026 | #1 to #3 | Claude | Explained Git, GitHub and VS Code steps (clone, branches, pull requests). | The team ran the commands. |

## Subsequent Codex assistance (November 2026)

The earlier 5 November entries above describe their historical workflow. They do not imply that students manually typed every later command or independently executed every later test. Codex executed commands and automated browser checks and drafted code/documents for Labs5/6 and Deliverable 2 at the user's request, including F-06/F-07/F-08/F-10, contracts, genuine RED/GREEN suites, CI/release checks and controlled synthetic live verification. Evidence identifies the actual source and tool-executed results; this is developer/agent verification, not independent human UAT.

On 24 November the user chose same-Reviewer Returned resubmission and an inclusive THB 50,000 second-approval threshold. Codex recorded those decisions and implemented the authorized Sprint 2 work and F-10. Kittakorn's actual GitHub approvals/merges are retained in the corresponding PR history (#77/#78/#79/#81/#82/#84/#85/#86/#87). Brief approvals are not expanded into invented substantive review discussions. The AI did not independently accept the product on behalf of either student or the partner testers.

On 25 November, #74 refreshes the SRS, inventory, System SDS, full requirement/AC result mapping, source audit and finish plan against actual source/tests/deployment records. Codex found and explicitly retained absent F-09, performance, human clean-setup and other verification gaps. These documents remain a draft for teammate PR review until merged. No new application test run is claimed simply because this documentation changed.

## Team responsibility

Both team members are responsible for the correctness of every document and every line of code in this repository, whether or not AI assisted. AI output is a draft: it is read, changed where needed and reviewed by the teammate in the pull request before it is merged. Test results and completion are shown by executed tests and reviewed pull requests, never by an AI statement.
