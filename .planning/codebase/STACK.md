# Technology Stack

**Analysis Date:** 2026-06-10

## Languages

**Primary:**
- TypeScript 6.0.x - All application and simulation logic in `src/`

**Secondary:**
- HTML5 - Application structure and DOM layout in `index.html`
- CSS3 - Application styling and layout in `src/style.css`
- JavaScript (ES Module) - Configuration and scripting

## Runtime

**Environment:**
- Browser environment - Runs client-side in modern web browsers (Chrome, Safari, Firefox, Edge)
- Node.js (Development) - Used for build tooling and running the Vite local dev server

**Package Manager:**
- npm 10.x
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- None (Vanilla HTML5 Canvas2D API with TypeScript orchestration)

**Testing:**
- None (No testing frameworks installed or configured)

**Build/Dev:**
- Vite 8.0.x - Development server and production bundling
- TypeScript 6.0.x - Type checking and compilation

## Key Dependencies

**Critical:**
- None (Direct implementation using native web API surfaces)

**Infrastructure:**
- None

## Configuration

**Environment:**
- Client-side static configuration. No runtime environment variables are required.

**Build:**
- `tsconfig.json` - TypeScript compiler configurations
- `package.json` - Script declarations and devDependencies

## Platform Requirements

**Development:**
- Any platform with Node.js support (Windows, macOS, Linux)

**Production:**
- Standard web server or CDN (Vercel, Netlify, GitHub Pages, etc.) hosting static assets generated in the `dist/` directory.

---

*Stack analysis: 2026-06-10*
*Update after major dependency changes*
