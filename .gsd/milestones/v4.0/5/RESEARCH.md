---
phase: 5
level: 2
researched_at: 2026-06-08
---

# Phase 5 Research

## Questions Investigated
1. **2D Maxwell-Boltzmann Distribution**: What is the correct mathematical speed distribution equation for particles in a 2D gas space (rather than 3D)?
2. **Real-Time Speed Binning**: How do we perform fast speed binning to render a live velocity histogram?
3. **Verification Integrity**: How will the unified verification tool validate thermodynamic UI presets?

## Findings

### 1. 2D Maxwell-Boltzmann Speed Distribution (Rayleigh Distribution)
In 2D space, the probability density function for speed $v$ is a Rayleigh distribution:
$$f(v) = \frac{m v}{k_B T} e^{-\frac{m v^2}{2 k_B T}}$$
where:
- $m$ is the particle mass (Species A heavy mass = 4.0, Species B light mass = 1.0).
- $T$ is the temperature (thermal energy scaling).
- $k_B$ is the Boltzmann constant (normalized to 1.0 in our simulation units).

This equation will be evaluated along the horizontal velocity axis to draw a smooth, continuous line curve in the background of the histogram.

### 2. Live Speed Histogram Binning
To render the histogram:
1. Define a speed range $v \in [0, v_{\text{max}}]$ (e.g. $v_{\text{max}} = 10.0$ units) and a fixed number of bins $B = 20$.
2. For each particle, calculate speed $v_i = \sqrt{vx_i^2 + vy_i^2}$.
3. Find the bin index: $b = \lfloor (v_i / v_{\text{max}}) \cdot B \rfloor$. If $b \ge B$, clamp to $B - 1$.
4. Increment bin frequency: $counts[b] \leftarrow counts[b] + 1$.
5. Plot these frequencies as shaded rectangles on the graph, normalized such that the sum of the bin heights scales to fit the canvas height.

### 3. Preset Slider Parameters
We will define four sliders:
- **Temperature ($T$)**: Range 0.5 to 10.0 (maps to kinetic energy).
- **Particle Count ($N$)**: Range 10 to 150 (maps to density).
- **Volume ($V$)**: Range 1.0 to 5.0 (maps to cylinder boundary width).
- **Automation Speed**: Range 0.5x to 3.0x.

## Decisions Made
| Decision | Choice | Rationale |
|----------|--------|-----------|
| Distribution Equation | 2D Rayleigh distribution | 2D systems strictly exhibit a Rayleigh distribution, which differs from the 3D Maxwell-Boltzmann profile. Utilizing 2D math yields a perfect fit with our 2D molecular solver. |
| Histogram Color | Semitransparent teal fill | Distinctly visible under both light and dark themes without clashing with red/blue species. |

## Patterns to Follow
- Recompute the speed histogram on each frame inside the animation loop to ensure real-time rendering.
- Verify all visual overlays scale dynamically on window resize events.
