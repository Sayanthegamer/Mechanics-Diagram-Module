import type { GravityConfig } from '../types';
import { PhysicsCanvas } from '../PhysicsCanvas';

interface SweepSector {
  startE: number;
  endE: number;
  color: string;
}

export class GravityDiagram {
  private pc: PhysicsCanvas;
  private config!: GravityConfig;

  // Simulation state
  public t: number = 0;
  public M: number = 0; // Mean Anomaly
  public E: number = 0; // Eccentric Anomaly
  public planetX: number = 0;
  public planetY: number = 0;
  public planetVx: number = 0;
  public planetVy: number = 0;

  // Kepler sweep sectors
  public sectors: SweepSector[] = [];
  private sweepTimer: number = 0;
  private lastSweepE: number = 0;
  private sectorColors = [
    'rgba(99, 102, 241, 0.25)',  // Indigo
    'rgba(16, 185, 129, 0.25)',  // Emerald
    'rgba(245, 158, 11, 0.25)',  // Amber
    'rgba(239, 68, 68, 0.25)',    // Red
    'rgba(168, 85, 247, 0.25)',  // Purple
  ];
  private currentSectorColorIdx = 0;

  constructor(pc: PhysicsCanvas) {
    this.pc = pc;
  }

  public setConfig(config: GravityConfig): void {
    this.config = config;
    this.resetState();
  }

  public resetState(): void {
    if (!this.config) return;
    this.t = 0;
    this.M = 0;
    this.E = 0;
    this.sectors = [];
    this.sweepTimer = 0;

    const { mode, kepler } = this.config;
    if (mode === 'kepler' && kepler) {
      const a = kepler.semiMajorAxis;
      const e = kepler.eccentricity;
      const b = a * Math.sqrt(1 - e * e);

      // Start at perihelion (E = 0)
      this.E = 0;
      this.planetX = a * (Math.cos(this.E) - e);
      this.planetY = b * Math.sin(this.E);

      // Initial velocities
      const GM = 10.0;
      const r = a * (1 - e); // distance at perihelion
      const vMagnitude = Math.sqrt(GM * (2 / r - 1 / a));
      this.planetVx = 0;
      this.planetVy = vMagnitude; // perpendicular at perihelion

      this.lastSweepE = 0;
    }
  }

  // Solve Kepler's equation M = E - e * sin(E) using Newton-Raphson iteration
  private solveKepler(M: number, e: number): number {
    let E = M;
    const tolerance = 1e-6;
    const maxIterations = 100;

    for (let i = 0; i < maxIterations; i++) {
      const f = E - e * Math.sin(E) - M;
      const fPrime = 1 - e * Math.cos(E);
      const dE = f / fPrime;
      E -= dE;
      if (Math.abs(dE) < tolerance) {
        break;
      }
    }
    return E;
  }

  public step(dt: number): void {
    if (!this.config) return;

    const { mode, kepler } = this.config;

    if (mode === 'kepler' && kepler) {
      const a = kepler.semiMajorAxis;
      const e = kepler.eccentricity;
      const b = a * Math.sqrt(1 - e * e);
      const GM = 10.0;

      // Mean Motion n = sqrt(GM / a^3)
      const n = Math.sqrt(GM / (a * a * a));

      // Advance Mean Anomaly
      this.t += dt;
      this.M += n * dt * kepler.simulationSpeed;

      // Wrap M between -PI and PI
      this.M = ((this.M + Math.PI) % (Math.PI * 2)) - Math.PI;

      // Solve Kepler's Equation for E
      this.E = this.solveKepler(this.M, e);

      // Calculate position
      this.planetX = a * (Math.cos(this.E) - e);
      this.planetY = b * Math.sin(this.E);

      // Calculate velocity components via Keplerian derivatives
      // r = a * (1 - e * cos(E))
      // dx/dt = -a * sin(E) * dE/dt
      // dy/dt = b * cos(E) * dE/dt
      // where dE/dt = n / (1 - e * cos(E))
      const dE_dt = (n * kepler.simulationSpeed) / (1 - e * Math.cos(this.E));
      this.planetVx = -a * Math.sin(this.E) * dE_dt;
      this.planetVy = b * Math.cos(this.E) * dE_dt;

      // Kepler's 2nd Law sector sweeping logic
      if (kepler.showSectors) {
        this.sweepTimer += dt * kepler.simulationSpeed;
        const sweepDuration = 1.0; // time in scaled units to sweep one sector

        if (this.sweepTimer >= sweepDuration) {
          this.sectors.push({
            startE: this.lastSweepE,
            endE: this.E,
            color: this.sectorColors[this.currentSectorColorIdx]
          });

          this.currentSectorColorIdx = (this.currentSectorColorIdx + 1) % this.sectorColors.length;
          this.sweepTimer = 0;
          this.lastSweepE = this.E;

          // Limit number of stored sectors to prevent memory growth
          if (this.sectors.length > 20) {
            this.sectors.shift();
          }
        }
      } else {
        this.sectors = [];
        this.sweepTimer = 0;
        this.lastSweepE = this.E;
      }
    }
  }

  public draw(): void {
    if (!this.config) return;

    this.pc.clear();
    this.pc.resetOrigin();

    // Center origin on canvas
    this.pc.originX = this.pc.canvas.clientWidth / 2;
    this.pc.originY = this.pc.canvas.clientHeight / 2;

    const { mode, kepler } = this.config;

    if (mode === 'kepler' && kepler) {
      this.drawKepler(kepler);
    }
  }

  private drawKepler(params: any): void {
    const a = params.semiMajorAxis;
    const e = params.eccentricity;
    const b = a * Math.sqrt(1 - e * e);

    const sStar = this.pc.toScreen(0, 0); // Focus at (0, 0)
    const scale = this.pc.scale;

    // Draw swept sectors first (so they are drawn underneath everything)
    if (params.showSectors) {
      this.sectors.forEach(sec => {
        this.pc.ctx.save();
        this.pc.ctx.fillStyle = sec.color;
        this.pc.ctx.beginPath();
        this.pc.ctx.moveTo(sStar.x, sStar.y);

        // Interpolate along the arc from startE to endE
        const steps = 30;
        const start = sec.startE;
        let diff = sec.endE - sec.startE;
        // Normalize angle differences
        if (diff < -Math.PI) diff += Math.PI * 2;
        if (diff > Math.PI) diff -= Math.PI * 2;

        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const E_interp = start + diff * t;
          const px = a * (Math.cos(E_interp) - e);
          const py = b * Math.sin(E_interp);
          const sPos = this.pc.toScreen(px, py);
          this.pc.ctx.lineTo(sPos.x, sPos.y);
        }

        this.pc.ctx.closePath();
        this.pc.ctx.fill();
        this.pc.ctx.restore();
      });
    }

    // Draw orbital path (dashed ellipse)
    this.pc.ctx.save();
    this.pc.ctx.strokeStyle = this.pc.theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';
    this.pc.ctx.lineWidth = 1.5;
    this.pc.ctx.setLineDash([4, 4]);
    this.pc.ctx.beginPath();
    
    // Draw the ellipse centered at (-a*e, 0)
    const centerX = -a * e;
    const sCenter = this.pc.toScreen(centerX, 0);
    this.pc.ctx.ellipse(sCenter.x, sCenter.y, a * scale, b * scale, 0, 0, Math.PI * 2);
    this.pc.ctx.stroke();
    this.pc.ctx.restore();

    // Draw star (at focus (0, 0))
    this.pc.ctx.save();
    // Yellow glowing gradient for the star
    const grad = this.pc.ctx.createRadialGradient(sStar.x, sStar.y, 2, sStar.x, sStar.y, 18);
    grad.addColorStop(0, '#fffbeb');
    grad.addColorStop(0.2, '#fde047');
    grad.addColorStop(0.8, '#eab308');
    grad.addColorStop(1, 'rgba(234, 179, 8, 0)');
    
    this.pc.ctx.fillStyle = grad;
    this.pc.ctx.beginPath();
    this.pc.ctx.arc(sStar.x, sStar.y, 20, 0, 2 * Math.PI);
    this.pc.ctx.fill();
    this.pc.ctx.restore();

    // Draw planet
    const sPlanet = this.pc.toScreen(this.planetX, this.planetY);
    this.pc.ctx.save();
    this.pc.ctx.fillStyle = '#38bdf8'; // Sky blue planet
    this.pc.ctx.strokeStyle = this.pc.theme === 'dark' ? '#fff' : '#000';
    this.pc.ctx.lineWidth = 1.5;
    this.pc.ctx.beginPath();
    this.pc.ctx.arc(sPlanet.x, sPlanet.y, 8, 0, 2 * Math.PI);
    this.pc.ctx.fill();
    this.pc.ctx.stroke();
    this.pc.ctx.restore();

    // Draw velocity vector arrow
    const v = Math.sqrt(this.planetVx * this.planetVx + this.planetVy * this.planetVy);
    if (v > 0.1) {
      const velScale = 0.4;
      this.pc.drawArrow(
        this.planetX, this.planetY,
        this.planetX + this.planetVx * velScale, this.planetY + this.planetVy * velScale,
        '#22d3ee', `v = ${v.toFixed(2)}`, { headSize: 5, labelOffset: 10 }
      );
    }
  }
}
