---
phase: 4
plan: 2
wave: 2
---

# Plan 4.2: Gravity Energy Graph UI Integration

## Objective
Un-hide the graph panel and integrate real-time energy graphing for Gravity mode presets in `main.ts` / `index.html`.

## Context
- .gsd/SPEC.md
- [main.ts](file:///c:/Users/Anon/Desktop/Physics-Diagrams/src/main.ts)
- [GraphModule.ts](file:///c:/Users/Anon/Desktop/Physics-Diagrams/src/lib/diagrams/GraphModule.ts)

## Tasks

<task type="auto">
  <name>Integrate Gravity Graph in Main App</name>
  <files>
    <file>src/main.ts</file>
  </files>
  <action>
    - Locate the `'gravity'` setup block in the active diagram initialization in `main.ts`:
      - Remove `graphCard.classList.add('hidden')`.
      - Add `graphCard.classList.remove('hidden')`.
      - Hide select graph mode dropdown: `selectGraphMode.classList.add('hidden')`.
      - Set `graphModule.mode = 'energy'`.
      - Set `graphTitle.innerText = 'Real-Time Graph: ENERGY CONSERVATION'`.
    - In `drawActiveSimulation()`, under `activeConfig.type === 'gravity'`, add `graphModule.draw(gravityDiagram.history);`.
  </action>
  <verify>npm run build</verify>
  <done>
    - Real-Time Graph panel is visible when loading Gravity presets.
    - Graph is updated each frame with the latest gravity diagram history.
  </done>
</task>

## Success Criteria
- [ ] The real-time graph card successfully shows up under all Gravity presets.
- [ ] Curves for KE, PE, and Total Energy are plotted dynamically in real-time.
- [ ] Build completes with no compilation errors.
