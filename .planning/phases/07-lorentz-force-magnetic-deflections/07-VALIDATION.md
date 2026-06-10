---
phase: 7
slug: lorentz-force-magnetic-deflections
status: approved
nyquist_compliant: false
wave_0_complete: true
created: 2026-06-10
---

# Phase 7 — Validation Strategy

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
| 07-01-01 | 01 | 1 | EM-05 | — | N/A | manual | `npm run dev` | ❌ | ⬜ pending |
| 07-01-02 | 01 | 1 | EM-05 | — | N/A | manual | `npm run dev` | ❌ | ⬜ pending |
| 07-02-01 | 02 | 2 | EM-06 | — | N/A | manual | `npm run dev` | ❌ | ⬜ pending |
| 07-02-02 | 02 | 2 | EM-06 | — | N/A | manual | `npm run dev` | ❌ | ⬜ pending |
| 07-02-03 | 02 | 2 | EM-05, EM-06 | — | N/A | manual | `npm run dev` | ❌ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| **Particle Gun Aiming & Position** | EM-05 | Interactive drag and manual controls are best verified visually. | 1. Drag the particle gun launcher on the canvas to reposition its base.<br>2. Click and drag the turret tip to adjust aiming angle/speed.<br>3. Adjust the sidebar speed and angle sliders to confirm the turret graphic rotates and points correctly. |
| **Firing Test Particles** | EM-05 | Launches are triggered by user actions (clicking Fire) and generate real-time paths. | 1. Press "Fire" in the sidebar controls.<br>2. Confirm a test particle launches from the muzzle of the gun with the configured speed and angle. |
| **Lorentz Force Paths** | EM-06 | Particles tracing circles, helices, and cycloids are complex dynamic shapes. | 1. Configure a non-zero magnetic field (e.g. $B = 3\text{T}$) and launch a charged particle.<br>2. Confirm it traces a perfect circle (or helix/cycloid if electric fields from static charges are present).<br>3. Verify path shape updates correctly for positive vs negative charges. |
| **Contact Absorption & Reset** | EM-05, EM-06 | Collisions and reset actions are interactive state transitions. | 1. Aim the particle gun directly at a static point charge and fire.<br>2. Verify that the moving particle is absorbed (annihilated) instantly upon contact.<br>3. Click the Reset button and verify all trails and active particles are cleared. |

---

## Validation Sign-Off

- [x] All tasks have manual verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 120s
- [x] `nyquist_compliant: false` set in frontmatter (manual validation only)

**Approval:** approved 2026-06-10
