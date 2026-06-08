---
phase: 1
plan: 2
wave: 1
---

# Plan 1.2: Field Renderers & Interactivity

## Objective
Implement visual rendering overlays (field vectors, field lines, marching squares contours) and click/drag point charge interactivity on the HTML5 Canvas.

## Context
- [.gsd/SPEC.md](file:///c:/Users/Anon/Desktop/Physics-Diagrams/.gsd/SPEC.md)
- [.gsd/phases/1/RESEARCH.md](file:///c:/Users/Anon/Desktop/Physics-Diagrams/.gsd/phases/1/RESEARCH.md)
- [src/lib/diagrams/EmDiagram.ts](file:///c:/Users/Anon/Desktop/Physics-Diagrams/src/lib/diagrams/EmDiagram.ts)
- [src/lib/PhysicsCanvas.ts](file:///c:/Users/Anon/Desktop/Physics-Diagrams/src/lib/PhysicsCanvas.ts)

## Tasks

<task type="auto">
  <name>Implement Field Vector Grids & Field Line Tracing</name>
  <files>src/lib/diagrams/EmDiagram.ts</files>
  <action>
    Inside `EmDiagram.ts`'s `draw(canvas: PhysicsCanvas)` method:
    1. **Field Vectors Grid**: Loop through canvas bounds at fixed steps (e.g., every 0.7 units in physics space). Calculate local $\vec{E}$ field. Scale vector lengths and opacity using a sigmoid function to keep arrows clean and readable. Render arrows on the canvas using `canvas.drawVector()`.
    2. **Field Line Integrator**: Implement a line tracing loop:
       - For each positive charge, start lines radially (e.g. 8 or 12 lines) at radius $r = 0.25$.
       - Step forward along the unit field vector direction: $\vec{r}_{next} = \vec{r}_{current} + ds \cdot \vec{E}/|\vec{E}|$.
       - Use a step size $ds = 0.1$ and cap at 300 steps.
       - Terminate if outside coordinate bounds, close to a negative charge center ($d < 0.25$), or if field drops below $10^{-5}$.
       - Draw lines using `ctx.stroke()`.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>
    Vector grids and RK2/Euler field line tracing loops render smoothly on the canvas without visual clutter.
  </done>
</task>

<task type="auto">
  <name>Implement Marching Squares for Equipotentials</name>
  <files>src/lib/diagrams/EmDiagram.ts</files>
  <action>
    Implement Marching Squares in `EmDiagram.ts` to draw voltage contours:
    1. Grid setup: Map physics viewport boundaries into a flat potential grid array of size $60 \times 45$.
    2. Calculate potential values $V$ at each vertex and store them cached.
    3. Define target potential contours (isovalues): e.g., $[-6, -4, -2, -1, -0.5, 0.5, 1, 2, 4, 6]$.
    4. For each isovalue, iterate over cell blocks:
       - Evaluate index $0..15$ by comparing corner potentials to the isovalue.
       - Use linear interpolation to compute exact intersection points along crossed cell edges.
       - Render line segments connecting the intersection points.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>
    Equipotential lines are drawn as smooth, continuous, non-overlapping vector curves on the canvas.
  </done>
</task>

<task type="auto">
  <name>Add Interactivity & Drag Handling</name>
  <files>src/lib/diagrams/EmDiagram.ts</files>
  <action>
    Add interaction APIs inside `EmDiagram.ts`:
    1. Handle canvas mouse/touch interactions:
       - `onMouseDown(px: number, py: number)`: Check if coordinate is close to a charge center (radius $d < 0.3$). If yes, set `isDragging = true`. If double-clicked in empty space, spawn a positive charge (or toggle charge polarity).
       - `onMouseMove(px: number, py: number)`: If a charge `isDragging`, update its physics coordinates $(x, y)$ to match mouse coordinates.
       - `onMouseUp()`: Reset drag state.
    2. Draw charge circles: Render positive charges as red spheres with a plus sign, and negative charges as blue spheres with a minus sign.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>
    Point charges can be dragged smoothly around the screen, dynamically re-generating vectors, lines, and equipotentials at 60fps.
  </done>
</task>

## Success Criteria
- [ ] Sigmoid-scaled vector grids and continuous field line tracing.
- [ ] Smooth marching-squares equipotential contours.
- [ ] Real-time drag interaction for point charges on the main simulation canvas.
