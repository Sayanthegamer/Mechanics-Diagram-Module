# Coding Conventions

**Analysis Date:** 2026-06-10

## Naming Patterns

**Files:**
- PascalCase for TypeScript diagram and canvas library files (e.g., `PhysicsCanvas.ts`, `GraphModule.ts`).
- lowercase/kebab-case for application root assets and orchestrator (e.g., `main.ts`, `style.css`).

**Functions:**
- camelCase for all function names (e.g., `loadPreset`, `drawArrow`, `stepSimulation`).
- Prefix `handle` for event listener handlers (e.g., `handleInteractionStart`, `handleCodeApply`).

**Variables:**
- camelCase for local variable declarations and class members (e.g., `activeConfig`, `isPlaying`, `ctx`, `scale`).
- UPPER_SNAKE_CASE for global constants (e.g., `PRESETS`).
- No special prefix for private/protected class fields, relying on standard TypeScript visibility keywords (`private`, `public`).

**Types & Interfaces:**
- PascalCase for type names, interfaces, and configs (e.g., `PhysicsConfig`, `ShmConfig`, `ForceVector`).
- Type suffix configurations usually end with `Config` or `Params` (e.g., `FbdConfig`, `BuoyancyParams`).

## Code Style

**Formatting:**
- 2-space indentation.
- Double quotes or single quotes (primarily single quotes for strings in TS files).
- Semicolons are required.
- Explicit type declarations on function boundaries (parameters and return types).

**TypeScript Rigor:**
- Use explicit type casting when retrieving DOM elements (e.g., `document.getElementById(...) as HTMLCanvasElement`).
- Use explicit `import type` syntax when loading types to facilitate clean bundle tree-shaking.

## Import Organization

**Order:**
1. Global styles import (e.g., `import './style.css'`).
2. Type imports (e.g., `import type { PhysicsConfig } from './lib/types'`).
3. Core graphics utility imports (`PhysicsCanvas`).
4. Diagram module imports (e.g., `FbdDiagram`, `VectorDiagram`).

## Error Handling

**Boot/Initialization Errors:**
- Fail fast on initialization errors (such as missing canvas 2D contexts) by throwing an explicit Error.
```typescript
const context = canvas.getContext('2d');
if (!context) throw new Error('Could not get 2D context');
```

**JSON Configuration Validation:**
- Validate client input when parsing code configurations dynamically. Catch parsing exceptions in a `try/catch` block, highlight the erroneous element with `.error-highlight`, and alert the error trace details.

## Comments

**When to Comment:**
- Use horizontal comment blocks to split orchestrator sections (e.g., `// --- Preset Configurations ---`).
- Document mathematical equations and physical principles in inline comments (e.g., `// Peak of Rayleigh is at v_peak = sqrt(T / m)`).

## Function & Module Design

**Diagram Structure:**
- Each simulation module must declare a clean TS Class.
- Implement a `.setConfig()` setter to dynamically update parameters.
- Provide a `.step(dt)` method for updating position/velocity values.
- Provide a `.draw()` method for executing rendering workflows.
- Expose physical state variables (`x`, `v`, `t`, `a`) as public members of the class.
- Expose a `.history` array containing a state interface (e.g., `FbdState` or `ShmState`) to stream metrics to the graph card.
- Set a `.maxHistory` bound of `500` to prevent excessive memory retention.
- Use explicit trigonometric radian conversions (`Math.PI / 180`) when interfacing with degree angles from UI configurations.

---

*Convention analysis: 2026-06-10*
*Update when patterns change*
