# Phase 4 Research - User Interaction & Accessibility

## 1. Drag Handle Detection Math

### 2D Cartesian Distance
For vectors, blocks, and pendulum bobs, we detect if a user's click `(px, py)` is near the object target `(tx, ty)` using the Euclidean distance:
$$d = \sqrt{(px - tx)^2 + (py - ty)^2}$$
We define a hover/click threshold of $0.4$ units in physics space, which maps to $20$ pixels at the default scale of $50$ pixels/unit.

---

## 2. Isometric Projection Inversion

For the 3D cross-product visualizer, we project 3D coordinates $(x, y, z)$ to 2D screen coordinates $(sx, sy)$ via:
$$sx = \text{originX} + (y - x) \cdot \cos(30^\circ) \cdot \text{scale3d}$$
$$sy = \text{originY} - (z - (x + y) \cdot \sin(30^\circ)) \cdot \text{scale3d}$$

Assuming the vectors lie in the XY plane ($z=0$), we can solve for $x$ and $y$ from a given screen coordinate $(sx, sy)$:
Let:
$$dx = \frac{sx - \text{originX}}{\text{scale3d} \cdot \cos(30^\circ)}$$
$$dy = \frac{\text{originY} - sy}{\text{scale3d} \cdot \sin(30^\circ)}$$

Substituting $z=0$ into the equations gives:
1. $y - x = dx$
2. $x + y = dy$

Solving this system of linear equations:
$$y = \frac{dx + dy}{2}$$
$$x = \frac{dy - dx}{2}$$

---

## 3. Circular/Centripetal Motion Equations

### Uniform Circular Motion (Horizontal)
- Angular position: $\theta(t) = \theta_0 + \omega t$, where $\omega = v / r$.
- Position: $x = r \cos\theta$, $y = r \sin\theta$.
- Velocity: $v_x = -v \sin\theta$, $v_y = v \cos\theta$.
- Centripetal force: $F_c = \frac{m v^2}{r}$ pointing inward.

### Vertical Circular Motion (Non-Uniform)
Using conservation of energy, if the speed at the bottom of the loop ($\theta = 0$) is $v_0$, then at any angle $\theta$ (measured from the bottom):
- Kinetic energy + Potential energy = Constant:
  $$\frac{1}{2} m v(\theta)^2 + m g r (1 - \cos\theta) = \frac{1}{2} m v_0^2$$
  $$v(\theta) = \sqrt{v_0^2 - 2 g r (1 - \cos\theta)}$$
- Instability check: If the term inside the square root is negative, the bob does not have enough speed to reach that height and will oscillate or fall.
- String Tension $T$:
  $$T(\theta) = \frac{m v(\theta)^2}{r} + m g \cos\theta$$

---

## 4. Keyboard Hotkeys and Touch Binding
- `keydown` listeners will check `event.code`:
  - `Space`: play/pause
  - `KeyR`: reset
  - `KeyT`: toggle theme
  - `BracketLeft`/`BracketRight`: cycle presets
- Touch events (`touchstart`, `touchmove`, `touchend`) will map client coordinates from `event.touches[0]` and call the same physics-coordinate mapping handler to ensure mobile responsiveness.
