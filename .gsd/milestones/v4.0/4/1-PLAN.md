---
phase: 4
plan: 1
wave: 1
---

# Plan 4.1: Shannon Entropy Solver & Diffusion Barrier Controls

## Objective
Implement grid-based Shannon entropy calculations to quantify molecular mixing during gas diffusion and add public control APIs to open and reset the split-chamber barrier.

## Context
- .gsd/SPEC.md
- .gsd/phases/4/RESEARCH.md
- [ThermoDiagram.ts](file:///c:/Users/Anon/Desktop/Physics-Diagrams/src/lib/diagrams/ThermoDiagram.ts)

## Tasks

<task type="auto">
  <name>Implement Grid-Based Shannon Entropy Solver</name>
  <files>
    <file>src/lib/diagrams/ThermoDiagram.ts</file>
  </files>
  <action>
    - Add fields to `ThermoDiagram` to track entropy state:
      - `public entropy: number = 0;` (current Shannon entropy of mixing)
      - `public entropyHistory: { t: number; entropy: number }[] = [];` (history of entropy over time)
    - In `step(dt)`, calculate Shannon entropy of mixing if the mode is `'diffusion'`:
      - Divide the chamber into a $4 \times 4$ spatial grid (16 cells) between `xLeft` and `xRight` (or maximum casing length), and `yBottom` and `yTop`.
      - Count the number of Species A ($n_A$) and Species B ($n_B$) particles in each grid cell.
      - Calculate the local cell entropy: $s = -(p_A \ln p_A + p_B \ln p_B)$, where $p_A = n_A / (n_A + n_B)$, resolving $0 \ln 0 = 0$.
      - Average the cell entropies across all cells to obtain the normalized global mixing entropy $S$.
      - Append `(this.t, S)` to `this.entropyHistory`, keeping it capped at 200 elements.
      - Clear `this.entropyHistory` when the barrier is closed or reset.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>
    - `ThermoDiagram.ts` compiles cleanly.
    - Shannon entropy values start close to 0 when barrier is closed, and rise smoothly towards $\ln(2) \approx 0.693$ when diffusion begins.
  </done>
</task>

<task type="auto">
  <name>Implement Barrier Control APIs</name>
  <files>
    <file>src/lib/diagrams/ThermoDiagram.ts</file>
  </files>
  <action>
    - Expose a public method `openBarrier(): void` that sets `this.barrierClosed = false`.
    - Expose a public method `closeBarrier(): void` that resets `this.barrierClosed = true`, sets `this.yBarrier = -4.0`, clears `this.entropyHistory`, and resets particles to their separated initial state.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>
    - Public APIs successfully open/reset the barrier and clean up the history.
  </done>
</task>

## Success Criteria
- [ ] Shannon entropy values are computed correctly based on species spatial concentrations.
- [ ] Entropy calculations scale dynamically during particle diffusion.
- [ ] Exposed barrier control APIs trigger barrier movements and reset states correctly.
