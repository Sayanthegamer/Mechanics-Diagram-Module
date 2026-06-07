# Plan 4.2 Summary: Canvas Drag Interactions & Hotkeys

We have successfully implemented, optimized, and verified Plan 4.2, introducing direct canvas dragging and keyboard shortcuts to the simulation dashboard.

## What Was Done

1. **Direct Canvas Drag & Touch Handlers (`main.ts`)**:
   - Registered `mousedown`/`touchstart`, `mousemove`/`touchmove`, and release listeners.
   - Designed a screen-to-physics coordinates solver (`pc.toPhysics()`).
   - Implemented target distance checks (within $0.4$-$0.6$ physics units) to identify active drag elements:
     - **Vectors**: Tips of Vector A/B in 2D cartesian coordinates.
     - **FBD**: Applied force vector tip ($F_a$) and inclined plane wedge peak.
     - **SHM**: Pendulum bob and horizontal/vertical spring blocks.
     - **Mechanics**: Projectile velocity/angle launcher vector.
   - Automatically pause the simulation update loop when dragging is active to let the user set initial conditions.

2. **3D Isometric Drag Inversion**:
   - Replicated the 3D isometric projection coordinates in the drag resolver.
   - Handled the degree-of-freedom ambiguity by assuming $Z=0$ for inputs, allowing vectors to be dragged directly in 3D isometric space via closed-form linear algebra:
     $$y_{3d} = \frac{dx + dy}{2}, \quad x_{3d} = \frac{dy - dx}{2}$$

3. **Accessibility Visuals**:
   - Implemented intelligent cursor hover styles: cursor changes to `grab` when hovering over a draggable node, and `grabbing` when actively dragging.

4. **Keyboard Accessibility**:
   - Registered a global `keydown` listener:
     - `Space`: Pause/Play active simulation.
     - `R`: Reset simulation state.
     - `T`: Toggle theme color palette (Light/Dark mode).
     - `[` / `]`: Cycle backward and forward through presets.
     - Excluded event triggers when textareas/inputs are focused.

## Verification Results
- Compilation verified with strict checks: `npx tsc --noEmit` returns **0 errors**.
- Build succeeded: `npm run build` runs cleanly.
- Confirmed coordinate translations match physics dimensions.
