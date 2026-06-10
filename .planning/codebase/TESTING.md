# Testing Patterns

**Analysis Date:** 2026-06-10

## Test Framework

**Runner:**
- None (There are no automated test runners configured in the codebase).

**Assertion Library:**
- None

**Run Commands:**
- None (No scripts exist in `package.json` for running tests).

## Test File Organization

**Location:**
- No test files currently exist in this repository.

**Naming:**
- Recommended: Collocated `*.test.ts` or `*.spec.ts` files alongside their source modules in `src/lib/` or `src/lib/diagrams/` for unit testing.
- Recommended: An `e2e/` or `tests/` directory at the project root for regression or browser-based interface tests.

## Mocking

- Recommended: Mock the canvas context (`HTMLCanvasElement`, `CanvasRenderingContext2D`) when testing rendering calls, or separate the calculations/integrations (`step` functions) from drawing calls (`draw` functions) so calculations can be tested as pure math functions.

## Coverage

- There is currently 0% test coverage.

## Test Types to Implement

**Unit Tests (Recommended):**
- **Target:** Physics integration equations (RK4 vs Euler outputs in `ShmDiagram`, projectile positions with quadratic drag in `MechanicsDiagram`, collision velocity outcomes).
- **Tool:** Vitest or Jest.
- **Approach:** Pass configurations to the stepping function and assert coordinates after `N` ticks.

**UI / Integration Tests (Recommended):**
- **Target:** Verify interactive dragging calculations, preset changes loading proper configs, and JSON configurations loading/failing gracefully.
- **Tool:** Playwright or Cypress (since this is a canvas-heavy graphical application).

---

*Testing analysis: 2026-06-10*
*Update when test patterns change*
