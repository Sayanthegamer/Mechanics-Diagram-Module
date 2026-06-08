---
phase: 1
level: 2
researched_at: 2026-06-08
---

# Phase 1 Research

## Questions Investigated
1. **Mathematical Equations**: What equations govern the electric field and potential of point charges in 2D space, and how do we handle numerical singularities near the charges?
2. **Field Line Integration**: How do we trace continuous, smooth field lines starting from positive charges or boundaries and ending at negative charges or boundary limits?
3. **Marching Squares Contours**: How do we implement the Marching Squares algorithm on a 2D grid to draw smooth, linearly interpolated equipotential lines?
4. **Drawing and Interactivity**: How do we integrate drag handles for point charges within the existing `PhysicsCanvas` framework?

---

## Findings

### 1. Electrostatics Equations & Softening
In a 2D visual coordinate space, point charges can be modeled using Coulomb's law. For a charge $q_i$ at position $\vec{r}_i = (x_i, y_i)$:
- **Electric Potential $V$**:
  $$V(\vec{r}) = k_e \sum_{i} \frac{q_i}{\sqrt{|\vec{r} - \vec{r}_i|^2 + \epsilon^2}}$$
- **Electric Field $\vec{E}$**:
  $$\vec{E}(\vec{r}) = k_e \sum_{i} \frac{q_i}{(|\vec{r} - \vec{r}_i|^2 + \epsilon^2)^{1.5}} (\vec{r} - \vec{r}_i)$$
Where:
- $k_e$ is Coulomb's constant (which we can scale to $k_e = 10.0$ or similar for visual convenience).
- $\epsilon^2 = 0.04$ is a softening factor (softening length $\epsilon = 0.2$) which prevents potential and field calculations from diverging to infinity near the point source, ensuring stable drawing and numerical integration.

### 2. Field Line Integration Trajectory
Field lines represent the path a small positive test charge would take. To trace a field line:
1. Start a small distance $d_{start} = 0.25$ away from a positive charge center in radial directions (e.g., 8 or 12 lines distributed evenly at angles $\theta = \frac{2\pi k}{N}$).
2. Trace the line by stepping in the direction of the local unit electric field vector:
   $$\vec{r}_{next} = \vec{r}_{current} + ds \cdot \frac{\vec{E}(\vec{r}_{current})}{|\vec{E}(\vec{r}_{current})|}$$
3. Use a step size $ds = 0.1$.
4. Terminate tracing when:
   - The path goes out of the screen boundaries.
   - The path gets close to a negative charge center ($d < 0.25$).
   - The number of steps exceeds a limit (e.g., 300 steps) to prevent infinite loops (like in orbits or near neutral points).
   - The field magnitude $|\vec{E}|$ drops below a small threshold ($10^{-5}$), indicating a neutral equilibrium point.

### 3. Marching Squares for Equipotentials
To render clean equipotential lines (isovalues) without rendering pixel heatmaps:
1. Divide the physics viewport grid into a grid of cells (e.g., $50 \times 40$ vertices).
2. Calculate the potential $V(x, y)$ at each grid vertex.
3. Define a set of target potential levels (e.g., $V \in \{-5, -3, -1.5, -0.5, 0.5, 1.5, 3, 5\}$).
4. For each target potential level (isovalue $V_0$):
   - For each cell with vertices $(x_0, y_0)$, $(x_1, y_0)$, $(x_1, y_1)$, $(x_0, y_1)$ (clockwise or counter-clockwise):
     - Check if potential at each vertex is $\ge V_0$ to form a 4-bit binary index (giving 16 possible crossing states).
     - If the index is not 0 or 15, the contour crosses the cell edges.
     - Calculate the exact crossing points on cell edges using linear interpolation:
       $$t = \frac{V_0 - V_A}{V_B - V_A}$$
       $$\vec{r}_{cross} = \vec{r}_A + t \cdot (\vec{r}_B - \vec{r}_A)$$
     - Draw the segment connecting the crossing points.

#### Marching Squares States Lookup Table
A standard 16-case edge index lookup:
- State 0, 15: No lines.
- State 1, 14: Bottom-left corner segment.
- State 2, 13: Bottom-right corner segment.
- State 3, 12: Horizontal segment.
- State 4, 11: Top-right corner segment.
- State 5, 10: Two diagonal segments (saddle points, resolved by averaging).
- State 6, 9: Vertical segment.
- State 7, 8: Top-left corner segment.

---

## Decisions Made
| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Contour Resolution** | $60 \times 45$ grid | Good balance of smooth curves, high detail, and low CPU overhead. |
| **Tracing Integrator** | Heun's method (RK2) | Provides better accuracy than Euler for curved field lines near dipole configurations without the overhead of RK4. |
| **Grid Vectors** | Sigmoid scaling | Maps the vast range of field strengths near/far from charges into a readable [0, 1] scale for arrow lengths and opacities. |

---

## Patterns to Follow
- **Coordinate Independence**: Always do potential/field calculations in physics coordinates, and transform to screen pixels only during drawing via `PhysicsCanvas.toScreen()`.
- **Render Caching**: Calculate grid potentials once per frame, and reuse them for all marching squares contour levels to avoid redundant $O(W \cdot H \cdot N)$ calculations.

## Anti-Patterns to Avoid
- **Per-pixel Raymarching**: Calculating potential on every single pixel ($800 \times 600 = 480,000$ points) is too slow for vanilla Javascript canvas contexts at 60fps.
- **Uncapped Euler stepping**: Tracing field lines without a step cap can hang the browser loop.

---

## Dependencies Identified
| Package | Version | Purpose |
|---------|---------|---------|
| *None* | N/A | Leverages the custom `PhysicsCanvas.ts` wrapper. |

---

## Risks
- **CPU Spikes during dragging**: Recalculating $60 \times 45 \times N$ values every frame could stutter on low-power devices.
  - *Mitigation*: Cap charges at 12 and keep grid allocations flat and static (reuse existing arrays instead of allocating new ones).

---

## Ready for Planning
- [x] Questions answered
- [x] Approach selected
- [x] Dependencies identified
