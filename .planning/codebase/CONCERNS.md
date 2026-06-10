# Codebase Concerns

**Analysis Date:** 2026-06-10

## Tech Debt

**Monolithic Orchestrator:**
- Issue: `src/main.ts` is a monolithic file exceeding 2000 lines. It conflates DOM event binding, slider rendering templates, simulation step loops, coordinate dragging checks, and UI styling.
- File: [main.ts](file:///c:/Users/Anon/Desktop/Physics-Diagrams/src/main.ts)
- Why: Initial development prioritized speed and low complexity.
- Impact: Hard to maintain, high risk of side effects when modifying controls or presets.
- Fix approach: Separate DOM rendering logic (e.g., slider templates, status bar updates) into a `UiController` helper class. Move direct canvas interaction hit-detection/drag into a separate mouse interaction manager module.

**Lack of Standardized Diagram Interface:**
- Issue: All diagram visualizer modules (`FbdDiagram.ts`, `ShmDiagram.ts`, etc.) implement similar methods (`setConfig`, `step`, `draw`, `resetState`, `.history` array) but do not share a common interface or base class.
- File: [main.ts](file:///c:/Users/Anon/Desktop/Physics-Diagrams/src/main.ts) and visualizer classes under [diagrams](file:///c:/Users/Anon/Desktop/Physics-Diagrams/src/lib/diagrams/)
- Why: Evolved independently as custom visualizer types were added.
- Impact: Forces long `if-else` branching logic inside `src/main.ts` to coordinate stepping, drawing, and resetting.
- Fix approach: Declare a common `Diagram` or `Simulation` TypeScript interface. Have all diagram classes implement it. This allows polymorphic invocation of `.step()`, `.draw()`, and `.resetState()`.

**Duplicated 3D Isometric Projection Logic:**
- Issue: The 3D isometric projection method `project(x3d, y3d, z3d)` is duplicated.
- Files: [main.ts:L691-698](file:///c:/Users/Anon/Desktop/Physics-Diagrams/src/main.ts#L691-L698) (in drag detection), [main.ts:L974-981](file:///c:/Users/Anon/Desktop/Physics-Diagrams/src/main.ts#L974-L981) (in hover detection), and [VectorDiagram.ts:L202-211](file:///c:/Users/Anon/Desktop/Physics-Diagrams/src/lib/diagrams/VectorDiagram.ts#L202-L211) (in drawing).
- Why: Written inline to solve local coordinate conversion problems.
- Impact: Redundant code. Changes to isometric scale or angles must be updated in multiple places.
- Fix approach: Refactor isometric calculation logic into a shared utility function inside `src/lib/PhysicsCanvas.ts` or a new coordinate projection helper.

## Known Bugs

- None currently documented, but lack of type validation on JSON code edits creates potential crash loops.

## Security Considerations

**Configuration Code Injection / Execution:**
- Risk: The interactive configuration card parses raw text input via `JSON.parse()`. Although it avoids `eval()`, malicious inputs can trigger prototype pollution if configurations are merged unsafely.
- File: [main.ts:L1676-1692](file:///c:/Users/Anon/Desktop/Physics-Diagrams/src/main.ts#L1676-L1692) (`handleCodeApply`)
- Current mitigation: Standard `try/catch` checks if parsing is valid JSON and asserts the existence of the `type` parameter.
- Recommendations: Implement a validator or use schema validation (like Zod) to assert the shape of the config object before parsing and applying.

## Performance Bottlenecks

**Dynamic Slider Re-rendering:**
- Problem: The `renderSliders()` method completely destroys and recreates the sidebar sliders DOM tree on every preset load or config change.
- File: [main.ts:L1197-1234](file:///c:/Users/Anon/Desktop/Physics-Diagrams/src/main.ts#L1197-L1234)
- Cause: Simple innerHTML reset (`dynamicSliders.innerHTML = ''`).
- Impact: Minor layout flashing and garbage collection overhead when switching presets.
- Improvement path: Update only the values of existing sliders, or keep templates cached and toggle visibility.

## Fragile Areas

**Manual DOM Binding/State Synchronization:**
- File: [main.ts](file:///c:/Users/Anon/Desktop/Physics-Diagrams/src/main.ts)
- Why fragile: Any modification to HTML element IDs in `index.html` requires manual sync inside `src/main.ts`. Missing DOM bindings will crash the app on load (`as HTMLButtonElement` type assertions will cause runtime errors if elements are missing).
- Common failures: Typos in IDs or class names during HTML layouts.
- Safe modification: Add null checks before asserting types on DOM nodes.

**JSON Editor Config Parsing:**
- File: [main.ts:L1676-1692](file:///c:/Users/Anon/Desktop/Physics-Diagrams/src/main.ts#L1676-L1692)
- Why fragile: If the user inputs valid JSON, but omits parameters like `activeConfig.mass`, diagram updates will execute with `undefined` parameters, causing NaN coordinate integration and rendering failures.
- Common failures: User deletes critical parameters in the textarea.

## Test Coverage Gaps

**Lack of Core Automated Tests:**
- What's not tested: Entire codebase (0% test coverage).
- Risk: Changes in mathematics or physics calculations (Euler / Runge-Kutta 4 integrations) can result in unstable visual behaviors (e.g. spring masses flying off the screen) that go unnoticed without manual visual verification.
- Priority: High.

---

*Concerns audit: 2026-06-10*
*Update as issues are fixed or new ones discovered*
