---
phase: 6
slug: electrostatics-sandbox-point-charges-fields
status: approved
nyquist_compliant: false
wave_0_complete: true
created: 2026-06-10
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual browser UI verification |
| **Config file** | none |
| **Quick run command** | `npm run dev` |
| **Full suite command** | `npm run verify` |
| **Estimated runtime** | ~120 seconds |

---

## Sampling Rate

- **After every task commit:** Run manual visual verification in browser
- **After every plan wave:** Run full manual verification checklist
- **Before `/gsd-verify-work`:** Manual checklist must be fully verified
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | EM-01 | — | N/A | manual | `npm run dev` | ✅ | ✅ green |
| 06-01-02 | 01 | 1 | EM-01 | — | N/A | manual | `npm run dev` | ✅ | ✅ green |
| 06-01-03 | 01 | 1 | EM-01 | — | N/A | manual | `npm run dev` | ✅ | ✅ green |
| 06-02-01 | 02 | 2 | EM-02 | — | N/A | manual | `npm run dev` | ✅ | ✅ green |
| 06-02-02 | 02 | 2 | EM-03 | — | N/A | manual | `npm run dev` | ✅ | ✅ green |
| 06-02-03 | 02 | 2 | EM-04 | — | N/A | manual | `npm run dev` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| **Add, Select, Drag Charges** | EM-01 | Interactive pointer and touch Canvas drag physics is best verified visually in a browser to check responsiveness, selection offset, and bounds. | 1. Spawn positive and negative charges to confirm they appear at center (0, 0).<br>2. Click a charge, verify it displays a dashed outline and sidebar controls.<br>3. Drag charge to verify bounds constraints `[-8, 8]` x `[-6, 6]`. Adjust sliders. Click Delete to remove charge. |
| **Electric Field Vector Grid** | EM-02 | Vector grid arrows rotation and intensity scaling are best verified visually to check clamped arctan sizing and opacity fading in weak regions. | 1. Load dipole preset.<br>2. Confirm arrows point away from positive charge and toward negative charge.<br>3. Verify arrows scale down near edges and fade in opacity in weak field regions without overlapping charges. |
| **Field Lines RK2 Tracing** | EM-03 | Field line tracing paths are graphical curves rendered in real-time on Canvas. | 1. Load quadrupole preset.<br>2. Verify exactly 8 field lines emerge per 1nC of charge magnitude.<br>3. Observe lines terminating smoothly at negative charges or flowing off-screen bounds. |
| **Equipotential Isolines** | EM-04 | Isolines contour rendering is verified visually to check shape correctness and interface rendering performance during drag actions. | 1. Drag a charge around the canvas.<br>2. Verify that green/teal contours reshape instantly and smoothly without screen lag. |

---

## Validation Sign-Off

- [x] All tasks have manual verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 120s
- [x] `nyquist_compliant: false` set in frontmatter (manual validation only)

**Approval:** approved 2026-06-10
