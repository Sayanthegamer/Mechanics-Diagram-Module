---
phase: 8
slug: circuits-engine-resistors-caps-inductors-solver
status: approved
nyquist_compliant: false
wave_0_complete: true
created: 2026-06-10
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual browser UI verification & TypeScript unit tests |
| **Config file** | none |
| **Quick run command** | `npm run dev` |
| **Full suite command** | `npm run verify` |
| **Estimated runtime** | ~120 seconds |

---

## Sampling Rate

- **After every task commit:** Run manual visual verification or build check
- **After every plan wave:** Run full verification build check
- **Before `/gsd-verify-work`:** Build must be green, with verified solver outputs
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | 1 | EM-07 | — | N/A | build | `npm run verify` | ❌ | ⬜ pending |
| 08-01-02 | 01 | 1 | EM-07 | — | N/A | build | `npm run verify` | ❌ | ⬜ pending |
| 08-02-01 | 02 | 2 | EM-07 | — | N/A | manual | `npm run dev` | ❌ | ⬜ pending |
| 08-02-02 | 02 | 2 | EM-07 | — | N/A | build | `npm run verify` | ❌ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| **Real-time Solver Stepping** | EM-07 | Interactive stepping and transient responses (like RC charging, switch toggling) require running simulation loops. | 1. Load a pre-configured linear RC/RL circuit preset.<br>2. Confirm the simulation runs at 60fps and calculates node voltages dynamically.<br>3. Verify that changing a switch state from open to closed updates loop voltages instantly. |

---

## Validation Sign-Off

- [x] All tasks have manual verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 120s
- [x] `nyquist_compliant: false` set in frontmatter (manual/build validation only)

**Approval:** approved 2026-06-10
