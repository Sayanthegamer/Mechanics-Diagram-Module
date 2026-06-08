---
phase: 4
level: 2
researched_at: 2026-06-08
---

# Phase 4 Research

## Questions Investigated
1. **Shannon Entropy Formulation**: How do we formulate spatial grid Shannon entropy to show entropy of mixing over time?
2. **Divider Barrier Physics**: How do we implement collision logic for a sliding vertical barrier?
3. **Particle Initialization**: How do we sort particle species on resets to establish clean boundary separation?

## Findings

### 1. Grid-Based Shannon Entropy of Mixing
To compute entropy $S$ as a smooth rising curve during diffusion:
1. Divide the 2D simulation container into an $M \times M$ grid (we choose $M = 4$, making 16 local cells).
2. For each cell $i$, count Species A particles ($n_{A,i}$) and Species B particles ($n_{B,i}$). Total cell count $n_i = n_{A,i} + n_{B,i}$.
3. If $n_i > 0$:
   - Calculate local concentration fractions: $p_{A,i} = \frac{n_{A,i}}{n_i}$ and $p_{B,i} = \frac{n_{B,i}}{n_i}$.
   - Compute local cell entropy: $s_i = - (p_{A,i} \ln p_{A,i} + p_{B,i} \ln p_{B,i})$, using $0 \ln 0 = 0$.
4. Average the local cell entropies across all cells to obtain the normalized global mixing entropy $S$:
   $$S = \frac{1}{M^2} \sum_{i=1}^{M^2} s_i$$
- When completely separated, each cell contains only one species, making $p_{A,i}$ or $p_{B,i}$ equal to 1, giving $S = 0$.
- When fully mixed, each cell contains an equal fraction, making $p_{A,i} \approx p_{B,i} \approx 0.5$, giving $S \approx \ln 2 \approx 0.693$.

### 2. Sliding Divider Barrier Collision Logic
- The barrier is positioned at $x = W/2$.
- The barrier slides vertically upwards, opening a gap from the bottom. Let $y_{\text{barrier}}$ be the bottom tip of the barrier (ranging from $H$ down to $0$ as it slides up).
- For a particle at $(x, y)$ with radius $r$:
  - If $y \ge y_{\text{barrier}}$, the barrier is present at their height. A collision occurs if the particle crosses $x = W/2$:
    - If coming from left: bounce ($v_x \leftarrow -v_x$) and clamp $x \le W/2 - r$.
    - If coming from right: bounce ($v_x \leftarrow -v_x$) and clamp $x \ge W/2 + r$.
  - If $y < y_{\text{barrier}}$, the gap is open, and particles pass through freely.

### 3. Particle Species Separators
- During initialization/reset, place Species A (Red, heavy) particles uniformly on the left: $x \in [r, W/2 - r]$.
- Place Species B (Blue, light) particles uniformly on the right: $x \in [W/2 + r, W - r]$.
- Distribute velocities using random directions, scaled to match the initial temperature $T$.

## Decisions Made
| Decision | Choice | Rationale |
|----------|--------|-----------|
| Grid Resolution $M$ | $4 \times 4$ cells | Provides a highly smooth, continuous entropy increase curve without statistical noise from low counts. |
| Barrier Animation | Sliding Upward | Easy to visualize with a vertical line moving up, exposing a clear passage for particle transfer. |

## Patterns to Follow
- Ensure the barrier slide is animated frame-by-frame (`y_barrier` shifts up by `speed * dt`).
- Clear the entropy plot history upon barrier resets.
