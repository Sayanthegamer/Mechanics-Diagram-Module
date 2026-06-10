# Codebase Structure

**Analysis Date:** 2026-06-10

## Directory Layout

```
[project-root]/
├── .agent/              # Agent skills, workflows, configurations, and manifests
├── .planning/           # Local project roadmap, states, and codebase maps
│   └── codebase/        # Codebase metadata mapping docs (STACK, STRUCTURE, etc.)
├── dist/                # Bundled build output for static website deployment
├── public/              # Static public assets served by Vite
├── src/                 # Application source root directory
│   ├── assets/          # Shared visual elements and images
│   ├── lib/             # Physics engine modules and utility abstractions
│   │   ├── diagrams/    # Individual physics model classes
│   │   ├── PhysicsCanvas.ts # Canvas2D rendering wrapper
│   │   └── types.ts     # Physics visualizer configuration type specs
│   ├── counter.ts       # Setup template counter script
│   ├── main.ts          # Core application controller and simulation frame manager
│   └── style.css        # Global CSS stylesheet rules and theme palettes
├── index.html           # Main markup template structuring the application layout
├── package.json         # Node packaging metadata and build scripts
└── tsconfig.json        # TS compiler options configuration
```

## Directory Purposes

**src/lib/**
- Purpose: Contains reusable simulation libraries, drawing utilities, and global type definitions.
- Contains: `PhysicsCanvas.ts` (canvas driver), `types.ts` (type parameters for configs).
- Subdirectories: `diagrams/`

**src/lib/diagrams/**
- Purpose: House discrete physics simulation engines, calculation rules, and coordinate plotting rules.
- Contains: Individual diagram rendering classes: `FbdDiagram.ts`, `FluidsDiagram.ts`, `GraphModule.ts`, `GravityDiagram.ts`, `MechanicsDiagram.ts`, `ShmDiagram.ts`, `ThermoDiagram.ts`, `VectorDiagram.ts`, `WaveDiagram.ts`.
- Key files: `GraphModule.ts` (manages multi-mode real-time graph rendering), `MechanicsDiagram.ts` (covers kinematics, pulleys, drag, collisions).

**src/assets/**
- Purpose: Media resources and icons.
- Contains: SVGs, logos.

## Key File Locations

**Entry Points:**
- `src/main.ts` - Main orchestration entry point.
- `index.html` - Static wrapper page referencing `src/main.ts`.

**Configuration:**
- `tsconfig.json` - TS compiler flags and alias configurations.
- `package.json` - Build commands and devDependencies.

**Core Logic:**
- `src/lib/PhysicsCanvas.ts` - High-DPI resizing, drawing methods (springs, pulleys, arrows), and Y-axis inversion conversions.
- `src/lib/types.ts` - Centralized interface definitions defining configuration options.

**Testing:**
- None. There are no test directories or files in this codebase.

## Naming Conventions

**Files:**
- PascalCase: For TypeScript visualizer classes (e.g., `PhysicsCanvas.ts`, `ShmDiagram.ts`).
- camelCase: For simple utility modules (e.g., `counter.ts`).
- lowercase: Naming for key files like `main.ts`, `style.css`.
- UPPERCASE: Config templates and documentation (e.g., `README.md`, `LICENSE`, `STACK.md`).

**Directories:**
- kebab-case / lowercase names for all packages and directories (e.g., `diagrams`, `assets`, `public`).

## Where to Add New Code

**New Physics Diagram / Preset Mode:**
- Configuration parameters: Register types in `src/lib/types.ts`.
- Physics diagram rendering class: Create `src/lib/diagrams/NameDiagram.ts` inheriting or referencing `PhysicsCanvas`.
- Preset data: Add default configuration mappings in `src/main.ts` inside `PRESETS`.
- Dropdown mapping: Add option tags inside `select-preset` groups in `index.html`.
- Canvas link: Instantiate and route simulation frame cycles to the new class in `src/main.ts`.

**Shared Graphic Rendering Method:**
- Add methods (e.g., `drawRod`, `drawCart`) in `src/lib/PhysicsCanvas.ts`.

## Special Directories

**dist/**
- Purpose: Production compilation output bundle.
- Source: Compiled via `npm run build` using the TypeScript compiler + Vite.
- Committed: No (tracked in `.gitignore`).

---

*Structure analysis: 2026-06-10*
*Update when directory structure changes*
