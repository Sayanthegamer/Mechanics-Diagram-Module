---
phase: 6
level: 2
researched_at: 2026-06-07
---

# Phase 6 Research: Hydrodynamics (Bernoulli Flow & Viscosity)

## Questions Investigated
1. **How do we animate streamlines and fluid flow dynamically in a Venturi tube (varying cross-sections)?**
2. **How do we calculate pressure and speed changes along a pipeline using Bernoulli's and Continuity equations?**
3. **How do we implement viscous drag and Stokes' Law terminal velocity physics?**

---

## Findings

### 1. Continuity & Bernoulli Flow in Pipes
A pipe carrying an incompressible, non-viscous fluid changes cross-sectional diameter from $D_1$ to $D_2$.

* **continuity Equation:**
  $$A_1 v_1 = A_2 v_2 \implies v_2 = v_1 \left(\frac{D_1}{D_2}\right)^2$$
* **Bernoulli's Equation:**
  $$P_1 + \frac{1}{2} \rho_f v_1^2 = P_2 + \frac{1}{2} \rho_f v_2^2 \implies P_2 = P_1 + \frac{1}{2} \rho_f (v_1^2 - v_2^2)$$
* **Streamline Animations:** 
  Streamlines can be drawn by dividing the pipe horizontally into 5 flow lanes. Along each lane, we render flow markers (circles/dashes) moving horizontally. The local velocity at horizontal position $x$ is:
  $$v(x) = \frac{Q}{A(x)}$$
  Where $Q = A_1 v_1$ is the constant flow rate and $A(x) = \pi \left(\frac{D(x)}{2}\right)^2$.
  In the draw loop, advance each particle's position: $x = x + v(x) \cdot dt$. When a particle exits the container ($x > x_{max}$), wrap it back to $x_{min}$.

---

### 2. Viscous Drag & Terminal Velocity (Stokes' Law)
A sphere of radius $r$ and density $\rho_s$ falls through a liquid with dynamic viscosity $\eta$ and density $\rho_f$.

* **Equations:**
  * Gravity: $F_g = \frac{4}{3} \pi r^3 \rho_s g$
  * Buoyancy: $F_b = \frac{4}{3} \pi r^3 \rho_f g$
  * Stokes' Drag: $F_d = 6 \pi \eta r v$ (assumes laminar flow, low Reynolds number).
  * Net Force: $F_{net} = F_g - F_b - F_d$.
  * Acceleration: $a = \frac{F_{net}}{m}$ where $m = \frac{4}{3} \pi r^3 \rho_s$.
  * Terminal Velocity ($a = 0$):
    $$v_t = \frac{2 r^2 g (\rho_s - \rho_f)}{9 \eta}$$
* **Visualization:**
  * Render a vertical glass cylinder filled with liquid (water, oil, or glycerin).
  * Animate the sphere falling down from the top surface.
  * Draw force vectors ($F_g$ downwards, $F_b$ and $F_d$ upwards).

---

## Decisions Made
| Decision | Choice | Rationale |
|----------|--------|-----------|
| Pipe geometry | Converging-diverging Venturi nozzle | Visualizes both speedup/pressure-drop (venturi nozzle) and slowdown/pressure-rise (expansion) clearly. |
| Streamline particles | Runge-Kutta or Euler particle step | Standard Euler stepping $dx = v(x) \cdot dt$ is fast and numerically stable for smooth horizontal pipe diameter transitions. |

---

## Ready for Planning
- [x] Questions answered
- [x] Approach selected
- [x] Dependencies identified
