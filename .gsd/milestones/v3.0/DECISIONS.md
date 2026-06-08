# Decisions

> Previous milestone decisions archived in `.gsd/milestones/v2.0/DECISIONS.md`

---

## Phase 1 Decisions

**Date:** 2026-06-08

### Keplerian Orbit Solver
- **Approach**: Option A (Newton-Raphson numerical iteration) was chosen to solve Kepler's equation $M = E - e\sin E$ for high accuracy and stability even at higher eccentricities ($e \le 0.8$).

### Kepler's 2nd Law Visualization
- **Aesthetic**: Render multiple shaded sectors (wedges) drawn at fixed time intervals as the planet orbits. Shaded sectors will persist and alternate colors to clearly illustrate the equal-area principle (shorter and wider wedges near perihelion, longer and thinner wedges near aphelion).
- **Controls**: Add a checkbox/toggle "Show Sector Sweeps" in the controls sidebar.

---

## Phase 2 Decisions

**Date:** 2026-06-08

### Two-Body Orbit Solver
- **Approach**: Option B (Velocity Verlet Integration) was chosen as it is a symplectic integrator that perfectly conserves system energy and angular momentum over long simulation runs, keeping binary orbits visually stable.

### Frame of Reference
- **Approach**: Option 1 (Origin locked to the Barycenter) was chosen. By shifting the rendering origin to match the common center of mass, we keep the orbital path centered, making binary orbit patterns (symmetric ellipses) clear and clean.

---

## Phase 3 Decisions

**Date:** 2026-06-08

### Escape Velocity Launcher
- **Scope & Parameters**: All launch parameters will be fully adjustable:
  - Planet mass
  - Planet radius
  - Launch height (altitude from center)
  - Launch speed (initial velocity)
  - Launch angle (relative to local vertical/tangent)
- **Crash Behavior**: If the probe collides with the planet's surface, the simulation will display a non-obstructive message: `"Probe crash landed"` on the screen, and freeze simulation updates until reset.
- **Approach**: Option A (Numerical Integration). Use numerical integration (Velocity Verlet/RK4) to step the probe trajectory, ensuring real-time response to control changes, gravity crashes, and open-ended trajectories.
- **Off-Screen Reset**: Auto-reset/recycle the probe launch if it goes too far off-screen (e.g., distance > 25 units) to keep the simulation clean.

---

## Phase 4 Decisions

**Date:** 2026-06-08

### Energy Conservation Real-Time Graph
- **Scope**: Support real-time plotting of Kinetic, Potential, and Total energy for all three gravity modes (Keplerian, Two-Body, and Escape Launcher).
- **Formulation**:
  - Keplerian: $GM = 10.0$, planet mass $m = 1.0$, $KE = \frac{1}{2}v^2$, $PE = -\frac{10}{r}$.
  - Two-Body: $G = 1.0$, $KE = \frac{1}{2}m_1 v_1^2 + \frac{1}{2}m_2 v_2^2$, $PE = -\frac{G m_1 m_2}{\sqrt{r^2 + \epsilon^2}}$ where $\epsilon = 0.15$ softening matches integration.
  - Escape: $G = 1.0$, probe mass $m = 1.0$, $KE = \frac{1}{2}v^2$, $PE = -\frac{G M_p}{r}$.
- **Approach**: Option B (Generic State Form). We will introduce a common interface `EnergyStatePoint` with fields `{ t, kineticEnergy, potentialEnergy, totalEnergy }` and update `GraphModule.draw()` to accept it. Both `ShmDiagram` and `GravityDiagram` will track history conforming to this interface.
- **Visuals & Resets**: Clear the graph history when resetting the simulation or when the escape launcher probe resets/crashes to prevent discontinuous line jumps on the plot.
