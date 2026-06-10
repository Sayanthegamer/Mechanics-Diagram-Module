# Phase 08: Circuits Engine (Resistors, Caps, & Inductors Solver) - Research
**Researched:** 2026-06-10
**Domain:** Circuits Solver / Modified Nodal Analysis (MNA)
**Confidence:** HIGH

## User Constraints
Copy of decisions, discretion areas, and deferred ideas from `08-CONTEXT.md` verbatim:

### Implementation Decisions
* **D-01:** Port the MNA circuit solver files (`circuit.ts`, `matrix.ts`, `types.ts`, and core elements) from the `Sayanthegamer/circuitjs` scratch clone into a vanilla TS module inside `src/lib/diagrams/circuit/` or similar structure.
* **D-02:** Remove React, eslint, and other frontend-specific dependencies from the ported engine, focusing purely on the mathematical solver.
* **D-03:** Support Resistors ($R$), Capacitors ($C$), Inductors ($L$), Switches, Voltage Sources, and Ground as the initial core components mapped to MNA stamp values.
* **D-04:** Run the circuit solver timestep loop inside the standard animation frame stepping pipeline to update voltages and currents at 60fps.
* **D-05:** Track node voltages and branch currents calculated by the solver and prepare the telemetry data format to interface with the visualization layers in subsequent phases.

### the agent's Discretion
* The choice of time-stepping interval (e.g., standard `5e-6` from the original engine), the file organization structure inside the project library, and the exact naming conventions for variables in the ported code are left to the agent's discretion.

### Deferred Ideas
* Schematic Breadboard Canvas UI and dragging components (deferred to Phase 9).
* Oscilloscope Telemetry plot integration (deferred to Phase 10).

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| EM-07 | Solver engine computes dynamic loop equation values (currents, voltages) for resistor ($R$), capacitor ($C$), and inductor ($L$) networks. | Modified Nodal Analysis (MNA) matrix construction and companion models solve differential equations in real-time. |
</phase_requirements>

## Summary
The primary objective of Phase 08 is to port and integrate a mathematical circuits engine utilizing Modified Nodal Analysis (MNA) and Newton-Raphson iteration. This engine will run transient simulations of linear and non-linear RLC networks at 60fps within the animation frame stepping loop. 

The mathematical engine contains the LU factorization routines (`matrix.ts`), the circuit graph parser and main step driver (`circuit.ts`), and the stamp representations for core electrical components (Resistors, Capacitors, Inductors, Switches, Ground, Wires, and Voltage Sources). Wires are optimized out during a wire-closure/spanning-tree pre-processing step to minimize matrix size. Reactive components (capacitors and inductors) use companion models (Backward Euler / Trapezoidal integration) that map differential equations into stamps updated at each timestep.

**Primary recommendation:** Port `circuit.ts`, `matrix.ts`, `types.ts`, and the core component models from `scratch/circuitjs/circuit-sim/src/engine/` directly to `src/lib/diagrams/circuit/` as vanilla TypeScript modules, stripping away any React hooks, HTML UI concerns, or non-core elements.

## Architectural Responsibility Map
| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Linear System Solving | Matrix Utilities (`matrix.ts`) | — | Solves $Ax = b$ using Crout's LU decomposition in place. |
| Element Stamping | Element Classes (`elements/`) | `IStamper` | Elements determine their own MNA stamp values based on their physical equations. |
| Topology & Step Control | Solver Engine (`circuit.ts`) | — | Builds node linkages, simplifies matrices, conducts Newton-Raphson iterations, and updates state. |
| Real-Time Integration | Simulation Loop (`main.ts` / animation frame) | `Circuit` | Orchestrates stepping the simulation `t` by `dt` synchronized with rendering. |

## Standard Stack
### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `Float64Array` | Built-in | High-performance matrix representations | Minimizes garbage collection pressure during real-time 60fps solves. `[VERIFIED: codebase]` |
| `Math` / `crypto` | Built-in | Mathematical calculations & secure IDs | Standard JS APIs with zero bundle size overhead. `[VERIFIED: codebase]` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `vitest` | `^4.1.6` | Component unit testing | Off-canvas mathematical verification. `[VERIFIED: local clone]` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom LU decomposition | `mathjs` | Custom Crout solver is in-place, lightweight, and tailored to zero-allocation operations, avoiding large external dependencies. `[ASSUMED]` |

## Architecture Patterns
### System Architecture Diagram
```mermaid
graph TD
    UI[Animation Frame Loop] -->|step(dt)| Engine[Circuit Engine]
    Engine -->|1. startIteration()| Elements[Element Models R, C, L, Switch, VSource, Ground]
    Engine -->|2. doStep() / Stamp| Elements
    Elements -->|stampConductance/stampVoltageSource| Stamper[IStamper Interface]
    Stamper -->|Updates Matrix A & Vector b| MatrixState[circuitMatrix, circuitRightSide]
    Engine -->|3. Solve system Ax = b| MatrixSolver[luFactor & luSolve]
    MatrixSolver -->|Updates node voltages & currents| Engine
    Engine -->|4. stepFinished()| Elements
    Elements -->|calculateCurrent()| Elements
    Engine -->|5. getState() Telemetry| UI
```

### Recommended Project Structure
All engine files will be housed in `src/lib/diagrams/circuit/`:
```
src/lib/diagrams/circuit/
├── circuit.ts               # Core topology parser and step solver class
├── matrix.ts                # LU decomposition & system solver
├── types.ts                 # Solver types (Point, CircuitNode, ICircuitElement)
├── serialization.ts         # JSON import/export parser
└── elements/                # Stamp implementations for components
    ├── base.ts              # Abstract class CircuitElement
    ├── resistor.ts          # Resistor stamp
    ├── capacitor.ts         # Capacitor companion stamp (with ESR)
    ├── inductor.ts          # Inductor companion stamp (with series resistance)
    ├── voltage-source.ts    # DC/AC/Square/Triangle/PWL source stamp
    ├── ground.ts            # Ground node mapping
    ├── switch.ts            # Dynamic resistor stamp (open/closed)
    ├── wire.ts              # Zero-stamp connection wire
    └── index.ts             # Element exports
```

### Pattern 1: Companion Models for Reactive Components
Dynamic components (Capacitors and Inductors) represent differential equations. They are modeled as companion circuits consisting of an equivalent resistor in parallel/series with an equivalent current or voltage source. 
* **Capacitor ($C$)**: Stamped as a resistor $R_{eq} = \Delta t / C$ (Euler) in parallel with a current source $I_{eq} = V_{cap} / R_{eq} + I_{cap}$.
* **Inductor ($L$)**: Stamped as a resistor $R_{eq} = L / \Delta t$ (Euler) in series with a current source.

### Anti-Patterns to Avoid
* **Floating Matrix Allocations**: Do not allocate new matrices or arrays during the `runStep()` loop. Re-use typed arrays (`Float64Array`) and permutation arrays.
* **Loose Ground Nodes**: Every circuit must contain at least one Ground node (mapped to node 0). Solver will fail or become singular without a reference potential.

## Don't Hand-Roll
| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Array Utility Solves | Hand-rolled matrix invert | Crout LU Decomposition (`matrix.ts`) | $O(n^3)$ matrix inversion is numerically unstable and slow compared to $O(n^3/3)$ LU factorization + $O(n^2)$ back-substitution. `[VERIFIED: codebase]` |

## Common Pitfalls
1. **Singular Matrix**: Occurs when elements create redundant loops (e.g., two parallel voltage sources) or floating nodes.
   * *Mitigation*: The `findUnconnectedNodes()` routine detects floating nodes and automatically stamps a $1\text{ G}\Omega$ resistor to ground.
2. **Missing Ground Node**: Without a node mapped to 0, the node voltage equations are underdetermined.
   * *Mitigation*: The `setGroundNode()` selects the first ground element, or defaults to the first voltage source post 0 if no ground exists.
3. **Simulation Overload**: Voltage or current spikes can overflow numeric boundaries.
   * *Mitigation*: The solver contains safety checks stopping the loop if voltages exceed $1000\text{V}$ or currents exceed $50\text{A}$.

## Code Examples
### 1. Typical Time-Stepping Solver Loop
```typescript
// Integration of Circuit Engine inside an Animation Frame Step
public step(dt: number): void {
  // Translate step limits
  const steps = Math.min(100, Math.ceil(dt / this.circuit.maxTimeStep));
  for (let i = 0; i < steps; i++) {
    const success = this.circuit.runStep(true);
    if (!success) {
      console.warn("Simulation stopped: " + this.circuit.stopMessage);
      break;
    }
  }
}
```

### 2. Companion Stamp for Capacitor Element
```typescript
stamp(stamper: IStamper): void {
  if (stamper.isDCOperatingPoint) {
    stamper.stampResistor(this.nodes[0], this.nodes[1], 1e12); // Open circuit at DC
    return;
  }
  const isEuler = !!stamper.isBackwardEuler;
  const activeCapResistance = isEuler
    ? stamper.timeStep / this.capacitance
    : stamper.timeStep / (2 * this.capacitance);
  this.compResistance = activeCapResistance + this.esr;

  stamper.stampResistor(this.nodes[0], this.nodes[1], this.compResistance);
  stamper.stampRightSide(this.nodes[0]);
  stamper.stampRightSide(this.nodes[1]);
}
```

## Sources
* Cloned Engine Source: `scratch/circuitjs/circuit-sim/src/engine/` `[VERIFIED: local clone]`
* Main Workspace Configuration: `package.json` `[VERIFIED: codebase]`
