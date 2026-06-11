---
phase: 10
slug: oscilloscope-graph-integration-verification
status: approved
nyquist_compliant: false
wave_0_complete: true
created: 2026-06-11
---

# Phase 10 — Validation Strategy

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
| 10-01-01 | 01 | 1 | EM-09 | — | N/A | manual | `npm run dev` | ✅ | ✅ green |
| 10-01-02 | 01 | 1 | EM-09 | — | N/A | manual | `npm run dev` | ✅ | ✅ green |
| 10-02-01 | 02 | 2 | EM-09 | — | N/A | manual | `npm run dev` | ✅ | ✅ green |
| 10-02-02 | 02 | 2 | EM-09 | — | N/A | manual | `npm run dev` | ✅ | ✅ green |
| 10-02-03 | 02 | 2 | EM-09 | — | N/A | manual | `npm run dev` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| **Independent Channel Scaling** | EM-09 | Independent scale fit avoids division by zero and vertical overlaps. | 1. Load the RC Transient preset.<br>2. Verify that Channel A (voltage, up to 5V) and Channel B (current, ~5mA) are both scaled to fill the canvas height.<br>3. Verify that the legends show dynamic units ('V' and 'mA') and values. |
| **Selection Probing & Defaults** | EM-09 | Interactive click selection triggers a dynamic telemetry override on the graph. | 1. Click a resistor or capacitor on the schematic canvas.<br>2. Verify the graph updates its curves to show that specific component's differential voltage ($V_{diff}$) and current ($I$).<br>3. Click empty canvas space and verify curves revert to preset default channels. |
| **Lissajous X-Y Phase Orbit** | EM-09 | Graph renders Channel A vs Channel B instead of values vs time. | 1. Load an AC excitable circuit preset (or adjust a source to AC sine wave).<br>2. Select "oscilloscope-xy" mode from the graph mode selector.<br>3. Verify the plotter renders a smooth, closed ellipse or circle reflecting phase lag. |
| **RLC Resonance Tuning** | EM-09 | Updates to frequency dynamically update transient amplitude. | 1. Load the RLC resonance preset.<br>2. Drag the source frequency slider to tune it towards resonance ($f \approx 160\text{Hz}$).<br>3. Observe the transient amplitudes on the graph peak as the resonant frequency is reached. |

---

## Validation Sign-Off

- [x] All tasks have manual verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 120s
- [x] `nyquist_compliant: false` set in frontmatter (manual validation only)

**Approval:** approved 2026-06-11
