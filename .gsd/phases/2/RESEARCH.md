---
phase: 2
level: 2
researched_at: 2026-06-08
---

# Phase 2 Research

## Questions Investigated
1. **Equations of State**: What are the analytical updates for the state variables ($P, V, T$) under Isothermal, Isobaric, Isochoric, and Adiabatic processes?
2. **Microscopic Velocity Scaling**: How is microscopic kinetic temperature mapped to individual particle speeds?
3. **Piston Rendering & Animation**: How do we visually represent the piston chamber and movable piston head on canvas?

## Findings

### 1. Thermodynamic Processes Formulas
Using $P V = N k_B T$ and $P V^\gamma = \text{const}$ ($\gamma = 1.67$ for monoatomic gas):

- **Isothermal ($T = \text{const}$)**:
  - $T = T_0$
  - $P = P_0 \frac{V_0}{V}$
- **Isobaric ($P = \text{const}$)**:
  - $P = P_0$
  - $T = T_0 \frac{V}{V_0}$
- **Isochoric ($V = \text{const}$)**:
  - $V = V_0$
  - $T = T_0 \frac{P}{P_0}$
- **Adiabatic ($Q = 0$)**:
  - $P = P_0 \left(\frac{V_0}{V}\right)^\gamma$
  - $T = T_0 \left(\frac{V_0}{V}\right)^{\gamma - 1}$

### 2. Velocity Scaling Factor
The temperature of the gas is directly proportional to the mean kinetic energy of the particles:
$$\langle KE \rangle = \frac{1}{N} \sum_{i=1}^N \frac{1}{2} m_i v_i^2 \propto T$$
To transition the gas temperature from $T_{\text{old}}$ to $T_{\text{new}}$:
1. Compute scale factor: $\alpha = \sqrt{T_{\text{new}} / T_{\text{old}}}$
2. Scale velocity vectors of all particles: $\mathbf{v}_i \leftarrow \alpha \mathbf{v}_i$.

### 3. Piston Visual Design
- The gas chamber is rendered as a rectangular box with three static walls (Left, Top, Bottom) and one movable wall (Right) representing the piston head.
- A horizontal connecting rod is attached to the center of the piston head, extending to the right to illustrate mechanical work delivery.
- Underneath the chamber, a flame burner (during heat addition) or cooling block (during heat rejection) is drawn with glowing gradients.

## Decisions Made
| Decision | Choice | Rationale |
|----------|--------|-----------|
| Thermal Process Path | Formula-driven target state | Simulating thermodynamic transitions analytically ensures the simulation stays perfectly on ideal curves without accumulating drift from numerical boundary checks. |
| Heat representation | Flame / Ice blocks | Fire burner (red-yellow gradient) and Ice cubes (light blue gradient) show clear, immediate intuitive indicators of thermodynamic actions. |

## Patterns to Follow
- Scale particle speeds instantly inside `step(dt)` when temperature varies.
- Keep particle coordinates within the dynamic boundary ($x \le W_{\text{piston}} - r$) during compression to prevent clipping.

## Anti-Patterns to Avoid
- Avoid updating volume $V$ and temperature $T$ without scaling particle speeds, which would cause a discrepancy between the visual speeds and the status bar readings.
