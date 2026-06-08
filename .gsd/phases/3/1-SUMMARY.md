# Plan 3.1: Carnot Cycle Automation & State Tracking Summary

## What was done
- Implemented a time-interpolated Carnot Cycle Finite State Machine (FSM) inside `ThermoDiagram.ts` with 4 automated stages:
  - **Stage 0**: Isothermal Expansion (A -> B) at hot temperature $T_H = 6.0$, volume expanding from $1.1$ to $1.6$.
  - **Stage 1**: Adiabatic Expansion (B -> C) expanding volume to $V_C$ using the relation $V_C = V_B \cdot (T_H / T_C)^{1.4925} \approx 4.50$.
  - **Stage 2**: Isothermal Compression (C -> D) at cold temperature $T_C = 3.0$, compressing volume from $V_C$ to $V_D \approx 2.81$.
  - **Stage 3**: Adiabatic Compression (D -> A) returning exactly to State A ($T_H = 6.0$, $V_A = 1.1$).
- Handled FSM triggers and timer reset when toggled by the UI config parameter `autoCycle`.
- Linked micro-particle velocities to the Carnot stage temperatures via scaling factor $\alpha = \sqrt{T_{\text{new}} / T_{\text{old}}}$.
- Exposed a public method `getCarnotLoopPoints()` on `ThermoDiagram` returning 100 sample coordinates tracing the full closed Carnot cycle loop on the Pressure-Volume diagram.
- Exposed a public method `getCycleStageColor()` returning stage-specific colors to color-code plotted curves.

## Verification
- Verified by running `npm run verify` which completes successfully with no warnings or errors.
