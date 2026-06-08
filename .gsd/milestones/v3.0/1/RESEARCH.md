---
phase: 1
level: 2
researched_at: 2026-06-08
---

# Phase 1 Research

## Questions Investigated
1. **How do we solve Kepler's Equation numerically in real-time?**
2. **How do we render the elliptical orbit and sweep sectors representing Kepler's 2nd Law (equal areas)?**
3. **How does the user control the simulation parameters?**

## Findings

### 1. Kepler's Equation Numerical Solver
To find the position of the planet on its orbit at any given time $t$, we follow these steps:
1. Compute Mean Anomaly $M = n(t - t_0)$, where $n = \sqrt{G M_{\text{star}} / a^3}$ is the mean motion.
2. Solve Kepler's Equation $M = E - e\sin E$ for the Eccentric Anomaly $E$.
3. We will use the **Newton-Raphson method**:
   $$E_{n+1} = E_n - \frac{E_n - e\sin E_n - M}{1 - e\cos E_n}$$
   We start with $E_0 = M$ as the initial guess. For standard eccentricities ($e \le 0.8$), this converges to machine precision within 4–5 iterations.

### 2. Rendering the Orbit & Shaded Sectors
- **Orbit Geometry**: 
  - Central massive star is at one of the foci $(0, 0)$ of the ellipse.
  - The center of the ellipse is at $(-ae, 0)$.
  - The Cartesian coordinates of the planet as a function of Eccentric Anomaly $E$ are:
    $$x = a(\cos E - e)$$
    $$y = b\sin E$$
    where $b = a\sqrt{1 - e^2}$ is the semi-minor axis.
- **Equal Area Sweeping sectors**:
  - We store the historical points of the planet's path during the sweep interval.
  - A sweep sector is defined by a start time $t_{\text{start}}$ and end time $t_{\text{end}}$.
  - The sector is rendered as a filled polygon starting at the focus $(0, 0)$, drawing points along the arc $(x(t), y(t))$ from $t_{\text{start}}$ to $t_{\text{end}}$, and closing back to $(0, 0)$.

### 3. UI Controls Integration
- Sliders for Eccentricity ($e$), Semi-major Axis ($a$), and Simulation Speed.
- A toggle checkbox for "Show Kepler's 2nd Law (Equal Areas)" which displays the colored/shaded sweep sectors.

## Decisions Made
| Decision | Choice | Rationale |
|----------|--------|-----------|
| Kepler Solver | Newton-Raphson Iteration | Rapid convergence and numerical stability for elliptical orbits. |
| Geometry Reference | Focus-centric coordinates | Placing the star at the focus $(0,0)$ makes force/vector drawing straightforward. |

## Patterns to Follow
- Use focus-centric math for all calculations to maintain consistency.
- Cache computed orbital points for drawing trails and sectors to avoid re-evaluating Kepler's equation unnecessarily.

## Risks
- **High eccentricity divergence**: At $e > 0.9$, Newton-Raphson might require a better starting guess (e.g. $E_0 = \pi$).
  - *Mitigation*: Limit the eccentricity slider maximum to $e = 0.8$.
