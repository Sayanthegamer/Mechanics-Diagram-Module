# Plan 4.2: Gravity Energy Graph UI Integration Summary

## What was done
- Modifed preset loader in `src/main.ts` for `'gravity'` diagram type:
  - Removed `graphCard.classList.add('hidden')` and replaced with `graphCard.classList.remove('hidden')` to ensure the real-time graph panel shows up for orbital preset modes.
  - Kept `selectGraphMode.classList.add('hidden')` to hide the SHM-specific graph mode selection.
  - Configured `graphModule.mode = 'energy'` to lock the plotting mode to energy conservation.
  - Set `graphTitle.innerText = 'Real-Time Graph: ENERGY CONSERVATION'`.
- Integrated real-time graph plotting:
  - Updated `drawActiveSimulation()` inside `src/main.ts` under `activeConfig.type === 'gravity'` to invoke `graphModule.draw(gravityDiagram.history)` on every tick.

## Verification
- Verified by running `npm run build` which compiles typescript files and bundles via Vite successfully.
