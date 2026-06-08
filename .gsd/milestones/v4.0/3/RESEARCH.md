---
phase: 3
level: 2
researched_at: 2026-06-08
---

# Phase 3 Research

## Questions Investigated
1. **Carnot Cycle Boundaries**: How are the four state vertices ($A, B, C, D$) mathematically defined to form a closed Carnot cycle?
2. **State Machine Automation**: How should the transition state machine interpolate properties smoothly across time steps?
3. **Graph Trail Tracing**: How do we render the persistent PV cycle loop and the current active state dot?

## Findings

### 1. Carnot Cycle Vertices Definition
To form a valid, closed loop cycle, the vertices must satisfy Isothermal and Adiabatic equations.
Given hot temperature $T_H$, cold temperature $T_C$, and volumes $V_A$ and $V_B$ (with $V_B > V_A$):
- **State A**: $(V_A, T_H) \implies P_A = N k_B T_H / V_A$
- **State B**: $(V_B, T_H) \implies P_B = N k_B T_H / V_B$ (End of Isothermal Expansion)
- **State C**: End of Adiabatic Expansion to cold temperature $T_C$:
  $$T_H V_B^{\gamma - 1} = T_C V_C^{\gamma - 1} \implies V_C = V_B \left(\frac{T_H}{T_C}\right)^{\frac{1}{\gamma - 1}}$$
  $$P_C = N k_B T_C / V_C$$
- **State D**: End of Isothermal Compression at cold temperature $T_C$:
  To ensure the final adiabatic compression leads exactly back to State A:
  $$T_C V_D^{\gamma - 1} = T_H V_A^{\gamma - 1} \implies V_D = V_A \left(\frac{T_H}{T_C}\right)^{\frac{1}{\gamma - 1}}$$
  $$P_D = N k_B T_C / V_D$$

Note that this satisfies: $\frac{V_B}{V_A} = \frac{V_C}{V_D}$, guaranteeing a closed, perfect cycle.

### 2. Time-Interpolated State Machine
We use an automation variable `stage` ($0, 1, 2, 3$) and stage timer $t_{\text{stage}} \in [0, \tau]$. The interpolation parameter is $u = t_{\text{stage}} / \tau$:
- **Stage 0 (A -> B)**: Isothermal Expansion.
  $$V(u) = V_A + u (V_B - V_A), \quad T(u) = T_H, \quad P(u) = \frac{N k_B T_H}{V(u)}$$
- **Stage 1 (B -> C)**: Adiabatic Expansion.
  $$V(u) = V_B + u (V_C - V_B), \quad T(u) = T_H \left(\frac{V_B}{V(u)}\right)^{\gamma - 1}, \quad P(u) = P_B \left(\frac{V_B}{V(u)}\right)^\gamma$$
- **Stage 2 (C -> D)**: Isothermal Compression.
  $$V(u) = V_C - u (V_C - V_D), \quad T(u) = T_C, \quad P(u) = \frac{N k_B T_C}{V(u)}$$
- **Stage 3 (D -> A)**: Adiabatic Compression.
  $$V(u) = V_D - u (V_D - V_A), \quad T(u) = T_C \left(\frac{V_D}{V(u)}\right)^{\gamma - 1}, \quad P(u) = P_D \left(\frac{V_D}{V(u)}\right)^\gamma$$

### 3. Loop Tracing
- Pre-render the full Carnot loop as a dashed curve on the PV diagram by sampling 100 points along the stages.
- Render the active state pointer as a colored circle moving along the curve. The circle is colored according to the current stage (e.g., green for expansion, red for compression).

## Decisions Made
| Decision | Choice | Rationale |
|----------|--------|-----------|
| Stage Duration $\tau$ | 3.0 seconds | Slow enough to clearly watch the physical changes and gas speed changes, but fast enough to trace cycles efficiently. |
| Stage Colors | Stage-specific tags | Standardizes visual feedback: Isothermal Expansion (Green), Adiabatic Expansion (Yellow), Isothermal Compression (Blue), Adiabatic Compression (Red). |

## Patterns to Follow
- Ensure the state machine updates `this.history` on every frame to support live drawing.
- Keep the FSM fully pauseable when the user pauses the simulation.
