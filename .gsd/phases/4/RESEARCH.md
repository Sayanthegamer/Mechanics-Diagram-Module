---
phase: 4
level: 2
researched_at: 2026-06-08
---

# Phase 4 Research

## Questions Investigated
1. How should energy values be calculated for Keplerian, Two-Body, and Escape Gravity modes?
2. How can we interface `GravityDiagram` history data with `GraphModule` in an optimized way?
3. How do we manage resets, crash freezes, and graph visibility?

## Findings

### Energy Formulations per Gravity Mode
- **Keplerian Mode**:
  - $GM_{\text{star}} = 10.0$ and $m_{\text{planet}} = 1.0$ (standard units).
  - $KE = \frac{1}{2} v^2 = \frac{1}{2}(v_x^2 + v_y^2)$.
  - $PE = -\frac{G M_{\text{star}} m_{\text{planet}}}{r} = -\frac{10.0}{r}$ where $r = \sqrt{x^2 + y^2}$.
  - $TE = KE + PE$.
- **Two-Body Mode**:
  - Gravitational constant $G = 1.0$, masses $m_1$ and $m_2$ (determined by mass ratio, default $m_1 = 10$, $m_2 = m_1 \cdot \text{ratio}$).
  - $KE = \frac{1}{2} m_1 (v_{x1}^2 + v_{y1}^2) + \frac{1}{2} m_2 (v_{x2}^2 + v_{y2}^2)$.
  - $PE = -\frac{G m_1 m_2}{\sqrt{r_{12}^2 + \epsilon^2}}$ where $r_{12} = \sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}$ and plum softening parameter $\epsilon = 0.15$. The softening parameter is required in $PE$ to guarantee exact energy conservation matching the softened acceleration equations.
  - $TE = KE + PE$.
- **Escape Mode**:
  - Gravitational constant $G = 1.0$, planet mass $M_p$, probe mass $m_{\text{probe}} = 1.0$.
  - $KE = \frac{1}{2} (v_x^2 + v_y^2)$.
  - $PE = -\frac{G M_p}{r}$ where $r = \sqrt{p_x^2 + p_y^2}$.
  - $TE = KE + PE$.

### Interfacing Gravity History with GraphModule
- Instead of creating a new `draw` method in `GraphModule.ts`, we can introduce a shared interface:
  ```typescript
  export interface EnergyStatePoint {
    t: number;
    kineticEnergy: number;
    potentialEnergy: number;
    totalEnergy: number;
  }
  ```
- By updating `GraphModule.draw()` to accept `EnergyStatePoint[]`, the module becomes generic. Both `ShmState` (SHM diagram) and the new `GravityState` (Gravity diagram) are structurally compatible with `EnergyStatePoint`, allowing complete reuse of the drawing logic.

### Graph Visibility and Resets
- The graph canvas element (`#graph-card`) should be unhidden (`classList.remove('hidden')`) when a gravity preset is selected, and `graphModule.mode` should be set to `'energy'`.
- Whenever a preset is reset, or when the escape launcher probe resets/loops ($r > 25.0$), `resetState()` clears `history` to avoid plotting discontinuous step functions.

## Decisions Made
| Decision | Choice | Rationale |
|----------|--------|-----------|
| Softening in Two-Body PE | Include $\epsilon = 0.15$ in $PE$ denominator | Ensures total energy is perfectly constant during close passes. |
| GraphModule Interface | Update `draw()` to accept generic `EnergyStatePoint` | Avoids duplicate logic, simplifying code and saving context size. |
| Energy calculation location | Calculate values in `step()` and store in `history` | Encapsulates physics logic inside the diagram modules. |

## Patterns to Follow
- Use structural compatibility in TypeScript for energy history tracking.
- Cap history array size at 200 points in `step()` to avoid memory leak and keep performance consistent.

## Anti-Patterns to Avoid
- Do not duplicate plotting code. Reusing `GraphModule.draw()` is cleaner.

## Dependencies Identified
None. Standard Canvas API and Vite setup is sufficient.

## Risks
- **Singularities near $r=0$**: Near singularities, $PE$ scales towards $-\infty$.
  - *Mitigation*: Surface collision ($r \le R_p$) in escape launcher halts solver before reaching $r=0$. In two-body orbits, the softening parameter $\epsilon = 0.15$ protects from division by zero. Keplerian orbits are stable.

## Ready for Planning
- [x] Questions answered
- [x] Approach selected
- [x] Dependencies identified
