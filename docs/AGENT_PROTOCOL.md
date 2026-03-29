2-Agent Protocol (Copilot / Codex)

1) Task split
- Copilot: small->medium edits, test, fix.
- Codex: architecture, CI/CD, deploy hardening, refactor, review.

2) Single source
- Branch: main or feat/<name>
- Commit tags: cp: <msg>  /  cx: <msg>
- PR: include cp/cx log

3) Sync cycle
- Interval: 30-45m
- Sync block to paste:
[SYNC]
Goal:
Current branch:
Changed files:
Tests run:
Errors:
Next 1-2 steps:

4) Handoff format
[HANDOFF]
Owner: copilot|codex
Task:
Files allowed:
Constraints:
Done definition:
[/HANDOFF]

5) Conflict rules
- One owner per file
- Cross-file deps -> freeze interface first
- Merge order: cp -> cx review -> deploy

6) Report format
[REPORT]
What changed:
Why:
Risk:
Verification:
Pending:
[/REPORT]

7) Minimal ops (start)
- Codex: provide top-5 failures + fixes HANDOFF (done)
- Copilot: small fix + HANDOFF (ci.yml patch)
- After 1h: paste both REPORTs -> final deploy checklist

Sync coordinator: user (Codex) will review Copilot REPORT and give next actions.
