---
phase: 2
level: 2
researched_at: 2026-06-08
---

# Phase 2 Research

## Questions Investigated
1. **How do we implement stable Velocity Verlet integration for mutual gravitation?**
2. **How do we lock the viewport origin to the barycenter dynamically?**
3. **How do we implement overlapping orbital trails without performance degradation?**

## Findings

### 1. Velocity Verlet Equations for Two-Body System
The standard formulation for Velocity Verlet update:
1. Update positions:
   $$\vec{x}_i(t + dt) = \vec{x}_i(t) + \vec{v}_i(t)dt + \frac{1}{2}\vec{a}_i(t)dt^2$$
2. Calculate new accelerations $\vec{a}_i(t + dt)$ based on new positions:
   $$\vec{r} = \vec{x}_2(t + dt) - \vec{x}_1(t + dt)$$
   $$d = \sqrt{r_x^2 + r_y^2}$$
   To avoid singularities if the bodies overlap, we add a softening parameter $\epsilon = 0.15$ (softened gravity):
   $$F_g = \frac{G m_1 m_2}{d^2 + \epsilon^2}$$
   $$\vec{a}_1 = \frac{F_g}{m_1} \frac{\vec{r}}{d} = \frac{G m_2 \vec{r}}{d (d^2 + \epsilon^2)}$$
   $$\vec{a}_2 = -\frac{F_g}{m_2} \frac{\vec{r}}{d} = -\frac{G m_1 \vec{r}}{d (d^2 + \epsilon^2)}$$
3. Update velocities:
   $$\vec{v}_i(t + dt) = \vec{v}_i(t) + \frac{1}{2}(\vec{a}_i(t) + \vec{a}_i(t + dt))dt$$

### 2. Barycenter Referencing
The system's center of mass (barycenter) $\vec{R}_{\text{com}}$ is:
$$\vec{R}_{\text{com}} = \frac{m_1 \vec{x}_1 + m_2 \vec{x}_2}{m_1 + m_2}$$
We shift positions relative to the barycenter at the end of each integration step:
$$\vec{x}_1' = \vec{x}_1 - \vec{R}_{\text{com}}$$
$$\vec{x}_2' = \vec{x}_2 - \vec{R}_{\text{com}}$$
This keeps the center of mass pinned at $(0, 0)$ in physics space, ensuring the canvas origin aligns perfectly.

### 3. Rendering Orbital Trails
- Maintain a list of positions for both body 1 and body 2.
- Cap the array length (e.g. 500 points) to avoid memory overhead.
- Draw them using a faded line to give a premium vector look.

## Decisions Made
| Decision | Choice | Rationale |
|----------|--------|-----------|
| Integrator | Velocity Verlet | Symplectic integrator ensuring perfect conservation of energy/orbital stability. |
| Softening factor | $\epsilon = 0.15$ | Prevents acceleration from blowing up to infinity if orbits cross or collide. |
| Frame centering | Lock origin to Barycenter | Keeps binary orbits centered and visually stable. |

## Patterns to Follow
- Keep the physics step separate from the draw method.
- Use the canvas scale factors correctly to map coordinates.

## Risks
- **Over-rotation trail issues**: If simulation speed is very fast, trails might look jagged.
  - *Mitigation*: Interpolate or draw smooth curves if needed, but a capped trail at standard 60fps updates is usually smooth enough.
