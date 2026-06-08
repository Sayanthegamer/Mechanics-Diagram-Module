# Plan 2.1 Summary: Two-Body Solver & Barycenter Core

## Accomplished
- **State Variables**: Added variables for coordinates (`x1, y1, x2, y2`), velocities (`vx1, vy1, vx2, vy2`), accelerations (`ax1, ay1, ax2, ay2`), masses (`m1, m2`), and trail tracking arrays for both bodies in `GravityDiagram.ts`.
- **Velocity Verlet Solver**: Implemented Velocity Verlet ODE integration equations for mutual gravity simulation, including a softening factor $\epsilon = 0.15$ to avoid singularities during close encounters.
- **Barycenter Locking**: Shifted position coordinates and velocities relative to the barycenter (center of mass) at the end of each time step to lock the barycenter to $(0,0)$ in physics space, preventing drift.
- **Verification**: Verified compilation cleanly with `npx tsc --noEmit`.
