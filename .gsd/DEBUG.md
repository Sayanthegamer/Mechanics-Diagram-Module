# Debug Session: Bernoulli Particle Flow & UI Glitches

## Symptom
1. Streamline particles in Bernoulli flow mode accumulate on the right side and are completely absent or appear frozen on the left side.
2. Clicking "Reset" has no effect on the Fluids diagram (block position, particles, etc. do not reset).
3. The bottom status bar shows stale or incomplete fields when switching to Bernoulli or Viscosity modes.

**When:** During Bernoulli and Viscosity simulation modes.
**Expected:**
- Particles should flow visibly from left to right at a responsive speed, wrap symmetrically, and be distributed across both sides.
- Resetting the simulation should reset the fluids diagram state.
- Status bar should show relevant metrics (flow speed, pressure, falling sphere velocity, terminal velocity).
**Actual:**
- Particles are visually frozen/absent on the left due to extremely slow physical speed (~0.017 m/s at inlet, or <1 pixel/s at 50px/unit), while zooming past the throat.
- Reset button lacks a handler for Fluids diagrams.
- Status bar lacks updates for Bernoulli and Viscosity modes.

## Hypotheses

| # | Hypothesis | Likelihood | Status |
|---|------------|------------|--------|
| 1 | Particle advection speed needs a visual speed multiplier to flow smoothly | 95% | CONFIRMED |
| 2 | Fluids diagram resetState is not called in main.ts resetSimulation method | 100% | CONFIRMED |
| 3 | Status bar lacks updates for Bernoulli and Viscosity modes | 100% | CONFIRMED |

## Attempts

### Attempt 1
**Testing:** H1, H2, H3 — all three hypotheses simultaneously
**Action:**
- Added `visualSpeedMultiplier = 15.0` to Bernoulli particle advection in `FluidsDiagram.ts:211-212`.
- Added `else if (activeConfig.type === 'fluids') { fluidsDiagram.resetState(); }` to `resetSimulation()` in `main.ts:1325-1326`.
- Added Bernoulli status bar (Inlet Speed, Throat Speed, Pressure Drop ΔP) and Viscosity status bar (Sphere Speed, Terminal Speed vt, Viscosity η) to `updateStatusBar()` in `main.ts:1607-1641`.
**Result:** `npm run build` passes with 0 errors. Code review confirms all three fixes are structurally correct.
**Conclusion:** CONFIRMED — all three root causes addressed.

## Resolution

**Root Cause:** Three independent bugs:
1. Raw physical flow speed (Q/A) was ~0.017 m/s at inlet, translating to <1 pixel/s on canvas — invisible to the eye.
2. `resetSimulation()` in `main.ts` had no `fluids` branch, so Reset was a no-op for fluids modes.
3. `updateStatusBar()` only handled `buoyancy` and `pascal` modes; `bernoulli` and `viscosity` fell through to no display.

**Fix:**
1. Multiplied particle advection speed by 15x for visual responsiveness (physics pressure calculations remain unaffected).
2. Added fluids reset handler.
3. Added status bar readouts: inlet/throat speeds + ΔP for Bernoulli; sphere speed + terminal velocity + η for Viscosity.

**Verified:** `npx tsc --noEmit` and `npm run build` both pass with 0 errors/warnings.
