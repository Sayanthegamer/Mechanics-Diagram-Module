---
phase: 3
level: 2
researched_at: 2026-06-08
---

# Phase 3 Research — Escape Velocity & Conic Section Trajectories

## Questions Investigated
1. **How do we mathematically classify trajectories based on launch parameters?**
2. **What equations model the probe's motion under the planet's gravity?**
3. **How do we visually differentiate circular, elliptical, parabolic, and hyperbolic orbits on the canvas?**
4. **How do we handle the planet collision check and display the crash warning?**

## Findings

### 1. Specific Orbital Energy and Conic Section Classification
The specific orbital energy $\mathcal{E}$ of the probe is given by:
$$\mathcal{E} = \frac{v^2}{2} - \frac{\mu}{r_0}$$
where:
- $v$ is the launch speed.
- $r_0$ is the initial distance from the planet's center.
- $\mu = G M_p$ is the standard gravitational parameter of the planet (using $G = 1.0$).

We classify the conic section of the trajectory based on the orbital eccentricity $e$ or specific energy $\mathcal{E}$:
- **$\mathcal{E} < 0$ (Closed Orbits)**:
  - If $v = v_{\text{circ}} = \sqrt{\frac{\mu}{r_0}}$ and launch angle is tangential: **Circular Orbit** ($e = 0$).
  - Otherwise: **Elliptical Orbit** ($0 < e < 1$).
- **$\mathcal{E} = 0$**: **Parabolic Orbit** ($e = 1$) — Borderline escape trajectory.
- **$\mathcal{E} > 0$**: **Hyperbolic Orbit** ($e > 1$) — Escape trajectory.

The escape velocity at height $r_0$ is:
$$v_{\text{esc}} = \sqrt{\frac{2 \mu}{r_0}}$$

### 2. Numerical Integration equations
Using standard Newton's law of universal gravitation, the equations of motion for the probe are:
$$\ddot{x} = - \frac{G M_p x}{(x^2 + y^2)^{1.5}}$$
$$\ddot{y} = - \frac{G M_p y}{(x^2 + y^2)^{1.5}}$$

We can solve this using the Runge-Kutta 4th order (RK4) method or Velocity Verlet. Since we have both implemented in other modes, they will provide high stability.

### 3. Collision and Boundary Checks
- **Planet Surface Collision**: If the distance $r = \sqrt{p_x^2 + p_y^2} \le R_p$ (where $R_p$ is the planet's radius), the probe is marked as crashed:
  - Set `crashed = true`.
  - Terminate solver updates.
  - Draw a warning banner: `"Probe crash landed"` on the canvas in an unobtrusive top-center or center HUD box.
- **Off-Screen Recycle boundary**: If $r > 25.0$, the probe has successfully escaped and is too far. We reset it to its launch state to loop the visual.

## Decisions Made
| Decision | Choice | Rationale |
|----------|--------|-----------|
| Solver | Runge-Kutta 4th Order (RK4) | Provides extremely high numerical accuracy for highly eccentric/hyperbolic trajectories. |
| Collision Condition | $r \le R_p$ | Matches physical overlap with the planet's sphere. |
| Reset Boundary | $r > 25.0$ | Keeps visual elements within bounds and stops memory leak from infinite trails. |

## Patterns to Follow
- Re-use the existing `pc.drawArrow` for velocity vectors.
- Maintain a trail array `probeTrail: { x: number; y: number }[]` with a cap of 400 points to draw the trajectory path.

## Risks
- **Blow-up at singularity**: If the probe comes very close to the center before crashing, velocities could diverge.
  - *Mitigation*: The collision check `r <= Rp` triggers early because $R_p \ge 0.5$, which prevents the probe from ever reaching the $r = 0$ singularity.
