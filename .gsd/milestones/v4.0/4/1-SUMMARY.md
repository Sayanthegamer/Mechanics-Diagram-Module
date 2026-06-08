# Plan 4.1: Shannon Entropy Solver & Diffusion Barrier Controls Summary

## What was done
- Implemented spatial grid-based Shannon entropy calculations for gas molecular mixing:
  - Divided the 2D container chamber into a $4 \times 4$ cell spatial grid.
  - Counted the local concentration fractions of Species A and B in each cell.
  - Calculated local Shannon entropy $s_i = -(p_A \ln p_A + p_B \ln p_B)$ per cell.
  - Averaged them globally to update `this.entropy`.
  - Logged current entropy over time in `this.entropyHistory` when the barrier is open.
- Created public control methods `openBarrier()` and `closeBarrier()` to manipulate the central divider partition and trigger resets cleanly.

## Verification
- Verified by running `npm run verify` which completes successfully with no warnings or errors.
