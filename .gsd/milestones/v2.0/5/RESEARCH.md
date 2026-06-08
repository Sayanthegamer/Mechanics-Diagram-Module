---
phase: 5
level: 2
researched_at: 2026-06-07
---

# Phase 5 Research: Hydrostatics (Buoyancy, Pressure, and Pascal)

## Questions Investigated
1. **How do we simulate buoyant forces and stabilize the oscillation of floating blocks in real-time?**
2. **How does a movable hydrostatic pressure probe display depth-based absolute/gauge pressure?**
3. **How do we formulate piston displacements and force transmission in a Pascal hydraulic press?**
4. **How should we structure `FluidsDiagram.ts` to support both Hydrostatics (Phase 5) and Hydrodynamics (Phase 6)?**

---

## Findings

### 1. Buoyancy Kinematics & Floatation Damping
A block floating in fluid of density $\rho_f$ is governed by gravity ($F_g$) acting downwards and buoyancy ($F_b$) acting upwards.

* **Equations:**
  * Gravity: $F_g = m \cdot g$ (where block mass $m$ is given, or derived via block density $\rho_b$ and volume $V_b$).
  * Submerged Volume: Assuming a block of height $h_b$ and cross-sectional area $A_b$ ($V_b = A_b \cdot h_b$). When the block bottom is at height $y$ and the fluid level is at $y_f$:
    $$h_{sub} = \max(0, \min(h_b, y_f - y))$$
    $$V_{sub} = V_b \cdot \frac{h_{sub}}{h_b}$$
  * Buoyant Force: $F_b = \rho_f \cdot V_{sub} \cdot g$.
  * Fluid Drag/Damping Force (to prevent perpetual oscillation):
    $$F_d = -c_d \cdot v \cdot \frac{V_{sub}}{V_b}$$
    Where $c_d$ is a damping coefficient (e.g., $5.0$). Damping scales with the submerged fraction to ensure free-fall in air is undamped while fluid entry feels viscous.
  * Acceleration: $a = \frac{F_b - F_g + F_d}{m}$.

**Recommendation:** Update the block's vertical position and velocity in `step(dt)` using standard Euler-Cromer integration:
```typescript
velocity.y += accel.y * dt;
position.y += velocity.y * dt;
```
If the block hits the bottom of the container ($y \le y_{bottom}$), set $y = y_{bottom}$ and $v_y = 0$ (if moving downwards).

---

### 2. Hydrostatic Pressure Probe
The probe measures hydrostatic pressure at depth $h = \max(0, y_f - y_{probe})$.

* **Equations:**
  * Gauge Pressure: $P_{gauge} = \rho_f \cdot g \cdot h$ (Pascals, Pa).
  * Absolute Pressure: $P_{abs} = P_{atm} + P_{gauge}$.
  * Atmospheric Pressure: $P_{atm} \approx 101,325\text{ Pa}$ ($1\text{ atm}$).
* **Units Conversion:** Display pressure in both Pascals ($\text{Pa}$ or $\text{kPa}$) and atmospheres ($\text{atm}$) for educational clarity.

**Recommendation:** Create a draggable target node representing the probe sensor. When rendering:
1. Draw a gauge indicator (e.g., a dial or numerical callout panel).
2. Connect it to the probe sensor tip with a dotted cord line.
3. Compute pressure using the fluid parameters and depth.

---

### 3. Pascal's Hydraulic Press
Two interconnected vertical cylinders filled with an incompressible liquid, capped with pistons of area $A_1$ (left) and $A_2$ (right).

* **Incompressibility Constraint:** The total volume of fluid remains constant:
  $$\Delta V_1 + \Delta V_2 = 0 \implies A_1 \cdot \Delta y_1 + A_2 \cdot \Delta y_2 = 0$$
  $$\Delta y_2 = -\Delta y_1 \cdot \frac{A_1}{A_2}$$
* **Pressure Equivalence (Pascal's Principle):**
  $$\Delta P_1 = \Delta P_2 \implies \frac{F_1}{A_1} = \frac{F_2}{A_2} \implies F_2 = F_1 \cdot \frac{A_2}{A_1}$$
* **Interactive Drag Resolution:**
  * When Piston 1 is dragged by the user to height $y_1$, compute $\Delta y_1 = y_1 - y_{1, initial}$.
  * Update Piston 2 height: $y_2 = y_{2, initial} - \Delta y_1 \cdot \frac{A_1}{A_2}$.
  * Limit piston heights to ensure they do not exceed physical bounds (e.g., emptying a cylinder completely or overflowing).

**Recommendation:** Define a fixed volume displacement model. Maintain a single offset parameter `pistonOffset` (in meters). Piston 1 height is $y_{neutral} - \text{pistonOffset}$, and Piston 2 height is $y_{neutral} + \text{pistonOffset} \cdot \frac{A_1}{A_2}$.

---

### 4. FluidsDiagram Class Interface
Following the project standard, `FluidsDiagram` will implement:
```typescript
export class FluidsDiagram {
  setConfig(config: FluidsConfig): void;
  resetState(): void;
  step(dt: number): void;
  draw(canvas: PhysicsCanvas): void;
}
```

* **Interactive Elements mapping:**
  * **Buoyancy**: Drag block position (adjusting initial drop height), drag fluid surface line (adjusting fluid volume), and drag pressure probe.
  * **Pascal**: Drag Piston 1 or Piston 2 up/down.

---

## Decisions Made
| Decision | Choice | Rationale |
|----------|--------|-----------|
| Architecture | Dedicated `FluidsDiagram.ts` | Separates fluid-specific variables ($\rho, \eta, A$, pressure probe states) from solid rigid bodies, preventing bloat in `MechanicsDiagram.ts`. |
| Presets | Buoyancy & Pascal | Creates two distinct hydrostatic views matching the requirements of Phase 5. |
| Damping | Submerged-volume proportional drag | Prevents numerical overflow and allows floating blocks to settle quickly into steady-state buoyancy. |

---

## Patterns to Follow
- Use `pc.toScreen` and `pc.toPhysics` coordinate transform methods from `PhysicsCanvas.ts` to map screen clicks back to physical coordinates.
- Update sidebar parameters in real-time when the user drags canvas components.

## Anti-Patterns to Avoid
- **Unbounded Euler Integration**: Avoid running simulation steps when the block is outside the fluid without gravity, or when velocities accumulate without bounds.
- **Ignoring Atmospheric Pressure**: The probe must support a toggle to turn $P_{atm}$ on or off, showing how absolute vs gauge pressure differ.

---

## Dependencies Identified
| Package | Version | Purpose |
|---------|---------|---------|
| *None* | N/A | Pure vanilla TypeScript targeting standard HTML5 Canvas. |

---

## Risks
* **Risk**: High-mass blocks dropped from height can overshoot the bottom boundaries or clip container walls.
* **Mitigation**: Constrain the block's physical position to the box boundaries ($[x_{min}, x_{max}]$ and $[y_{bottom}, y_{top}]$) in the physics stepping loop, absorbing energy on impact.

---

## Ready for Planning
- [x] Questions answered
- [x] Approach selected
- [x] Dependencies identified
