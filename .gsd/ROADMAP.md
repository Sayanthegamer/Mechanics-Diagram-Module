# ROADMAP.md

> **Current Milestone**: v3.0 (Gravitation & Orbital Mechanics)
> **Goal**: Implement dynamic gravity and orbital simulations including Kepler's laws, sweep sector animations, barycentric two-body orbits, and escape velocity trajectories (conic sections) with textbook-quality interactive rendering.

## Must-Haves
- [x] Kepler's Laws Simulation: planet orbiting a star with eccentricity/semi-major axis sliders and real-time sweeping of equal-area sectors.
- [ ] Two-Body Barycentric Orbit Simulation: two comparable masses orbiting a common center of mass (barycenter) with trail lines.
- [ ] Escape Velocity launcher: launches a probe from a planet, dynamically plotting the orbital trajectory types (circle, ellipse, parabola, hyperbola) with a live initial speed control.
- [ ] Real-time Energy Plot Integration: dynamic graphs showing Kinetic, Potential, and Total energy conservation synchronized with the orbits.

## Phases

### Phase 1: Keplerian Orbit & Kepler's 2nd Law Sector Sweep
**Status**: ✅ Complete
**Objective**: Build the mathematical Keplerian solver and render the planetary orbit with interactive parameters and sweeping area animations.

### Phase 2: Two-Body Barycentric Gravity Simulation
**Status**: ⬜ Not Started
**Objective**: Implement stable numerical ODE solver (RK4 or Verlet) to simulate two gravitating bodies of comparable mass around their barycenter.

### Phase 3: Escape Velocity & Conic Section Trajectories
**Status**: ⬜ Not Started
**Objective**: Construct the escape velocity probe launcher, rendering dynamic trajectory pathways (conic sections) from the launch conditions.

### Phase 4: Energy Conservation Real-Time Graph Integration
**Status**: ⬜ Not Started
**Objective**: Connect the gravity module to the main real-time graphing utility to plot energy components.

### Phase 5: Verification & Polish
**Status**: ⬜ Not Started
**Objective**: Build verification, strict type checking, and general performance review.
