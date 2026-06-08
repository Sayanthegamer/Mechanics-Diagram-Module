---
phase: 1
level: 2
researched_at: 2026-06-08
---

# Phase 1 Research

## Questions Investigated
1. **Bi-disperse Elastic Collisions**: What are the vector equations for resolving elastic collisions between particles of different masses ($m_1, m_2$) and radii ($r_1, r_2$)?
2. **Overlap Resolution**: How do we prevent particles from sticking/clipping together under high densities?
3. **Pressure Calculation**: How do we calculate macroscopic pressure ($P$) from microscopic wall collisions?

## Findings

### 1. Vector Elastic Collisions
For two colliding particles with positions $\mathbf{x}_1, \mathbf{x}_2$, velocities $\mathbf{v}_1, \mathbf{v}_2$, and masses $m_1, m_2$, the post-collision velocities $\mathbf{v}_1', \mathbf{v}_2'$ are:
$$\mathbf{v}_1' = \mathbf{v}_1 - \frac{2 m_2}{m_1 + m_2} \frac{(\mathbf{v}_1 - \mathbf{v}_2) \cdot (\mathbf{x}_1 - \mathbf{x}_2)}{\|\mathbf{x}_1 - \mathbf{x}_2\|^2} (\mathbf{x}_1 - \mathbf{x}_2)$$
$$\mathbf{v}_2' = \mathbf{v}_2 - \frac{2 m_1}{m_1 + m_2} \frac{(\mathbf{v}_2 - \mathbf{v}_1) \cdot (\mathbf{x}_2 - \mathbf{x}_1)}{\|\mathbf{x}_2 - \mathbf{x}_1\|^2} (\mathbf{x}_2 - \mathbf{x}_1)$$

### 2. Overlap Resolution
To avoid particle sticking (clamping), when two particles overlap ($d = \|\mathbf{x}_2 - \mathbf{x}_1\| < r_1 + r_2$):
- Find collision normal: $\hat{\mathbf{n}} = (\mathbf{x}_2 - \mathbf{x}_1) / d$.
- Find penetration depth: $\delta = (r_1 + r_2) - d$.
- Displace both particles along the normal by half the penetration:
  $$\mathbf{x}_1 \leftarrow \mathbf{x}_1 - \frac{\delta}{2} \hat{\mathbf{n}}$$
  $$\mathbf{x}_2 \leftarrow \mathbf{x}_2 + \frac{\delta}{2} \hat{\mathbf{n}}$$

### 3. Wall Collisions & Momentum
When a particle of mass $m$ collides with a vertical or horizontal container wall:
- Reverse the velocity component normal to the wall: $v_n \leftarrow -v_n$.
- Accumulate the momentum transferred to the wall: $\Delta p = 2 m |v_n|$.
- Macroscopic Pressure is calculated over a small time window $\Delta t$:
  $$P = \frac{\sum \Delta p}{\text{Perimeter} \cdot \Delta t}$$

## Decisions Made
| Decision | Choice | Rationale |
|----------|--------|-----------|
| Particle Species | Bi-disperse species | Heavy particles (red, radius 10px, mass 4.0) and Light particles (blue, radius 6px, mass 1.0) to highlight speed differences. |
| Collision Detection | $O(N^2)$ Pairwise Check | Extremely simple, stable, and highly performant for $N \le 150$. |
| Pressure smoothing | Running average | Pressure is noisy frame-by-frame; a simple exponential moving average (EMA) provides a smooth, readable value. |

## Patterns to Follow
- Resolve collisions in a single pass before updating positions.
- Cap particle speeds to prevent stability blow-ups if coordinate glitches occur.

## Anti-Patterns to Avoid
- Do not use simple elastic equations without overlap resolution; otherwise, particles will stick together at high temperatures/pressures.

## Risks
- **Overlapping boundaries on resizing**: Shrank volumes can push particles out of bounds.
  - *Mitigation*: Clamp all particle positions to the new right-hand boundary ($x \le W_{\text{new}} - r$) instantly when the boundary changes.
