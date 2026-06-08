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

  // Two-Body state variables
  public x1: number = 0;
  public y1: number = 0;
  public x2: number = 0;
  public y2: number = 0;
  public vx1: number = 0;
  public vy1: number = 0;
  public vx2: number = 0;
  public vy2: number = 0;
  public ax1: number = 0;
  public ay1: number = 0;
  public ax2: number = 0;
  public ay2: number = 0;
  public m1: number = 10.0;
  public m2: number = 10.0;

  public body1Trail: { x: number; y: number }[] = [];
  public body2Trail: { x: number; y: number }[] = [];

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

    const { mode, kepler, twobody } = this.config;
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
    } else if (mode === 'twobody' && twobody) {
      this.m1 = 10.0;
      this.m2 = this.m1 * twobody.massRatio;

      const D = twobody.initialDistance;
      const V0 = twobody.initialVelocity;

      const totalMass = this.m1 + this.m2;
      this.x1 = -(this.m2 / totalMass) * D;
      this.y1 = 0;
      this.x2 = (this.m1 / totalMass) * D;
      this.y2 = 0;

      this.vx1 = 0;
      this.vy1 = -(this.m2 / totalMass) * V0;
      this.vx2 = 0;
      this.vy2 = (this.m1 / totalMass) * V0;

      // Initial accelerations
      const dx = this.x2 - this.x1;
      const dy = this.y2 - this.y1;
      const distSqr = dx * dx + dy * dy;
      const dist = Math.sqrt(distSqr);
      const epsilon = 0.15;
      const softDistSqr = distSqr + epsilon * epsilon;
      const denom = (dist > 1e-6 ? dist : 1e-6) * softDistSqr;
      const G = 1.0;

      this.ax1 = (G * this.m2 * dx) / denom;
      this.ay1 = (G * this.m2 * dy) / denom;
      this.ax2 = -(G * this.m1 * dx) / denom;
      this.ay2 = -(G * this.m1 * dy) / denom;

      this.body1Trail = [];
      this.body2Trail = [];
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
    } else if (mode === 'twobody') {
      const G = 1.0;
      const epsilon = 0.15;

      // 1. Update positions using current velocity and acceleration
      this.x1 += this.vx1 * dt + 0.5 * this.ax1 * dt * dt;
      this.y1 += this.vy1 * dt + 0.5 * this.ay1 * dt * dt;
      this.x2 += this.vx2 * dt + 0.5 * this.ax2 * dt * dt;
      this.y2 += this.vy2 * dt + 0.5 * this.ay2 * dt * dt;

      // Save old accelerations
      const ax1_old = this.ax1;
      const ay1_old = this.ay1;
      const ax2_old = this.ax2;
      const ay2_old = this.ay2;

      // 2. Calculate new accelerations
      const dx = this.x2 - this.x1;
      const dy = this.y2 - this.y1;
      const distSqr = dx * dx + dy * dy;
      const dist = Math.sqrt(distSqr);
      const softDistSqr = distSqr + epsilon * epsilon;
      const denom = (dist > 1e-6 ? dist : 1e-6) * softDistSqr;

      this.ax1 = (G * this.m2 * dx) / denom;
      this.ay1 = (G * this.m2 * dy) / denom;
      this.ax2 = -(G * this.m1 * dx) / denom;
      this.ay2 = -(G * this.m1 * dy) / denom;

      // 3. Update velocities
      this.vx1 += 0.5 * (ax1_old + this.ax1) * dt;
      this.vy1 += 0.5 * (ay1_old + this.ay1) * dt;
      this.vx2 += 0.5 * (ax2_old + this.ax2) * dt;
      this.vy2 += 0.5 * (ay2_old + this.ay2) * dt;

      // 4. Shift to center of mass (Barycenter)
      const totalMass = this.m1 + this.m2;
      const rcomX = (this.m1 * this.x1 + this.m2 * this.x2) / totalMass;
      const rcomY = (this.m1 * this.y1 + this.m2 * this.y2) / totalMass;

      this.x1 -= rcomX;
      this.y1 -= rcomY;
      this.x2 -= rcomX;
      this.y2 -= rcomY;

      // Also shift velocities to maintain zero net momentum
      const vcomX = (this.m1 * this.vx1 + this.m2 * this.vx2) / totalMass;
      const vcomY = (this.m1 * this.vy1 + this.m2 * this.vy2) / totalMass;
      this.vx1 -= vcomX;
      this.vy1 -= vcomY;
      this.vx2 -= vcomX;
      this.vy2 -= vcomY;

      // Add to trails
      this.body1Trail.push({ x: this.x1, y: this.y1 });
      this.body2Trail.push({ x: this.x2, y: this.y2 });

      if (this.body1Trail.length > 500) this.body1Trail.shift();
      if (this.body2Trail.length > 500) this.body2Trail.shift();
    }
  }

  public draw(): void {
    if (!this.config) return;

    this.pc.clear();
    this.pc.resetOrigin();

    // Center origin on canvas with pan offsets
    this.pc.originX = this.pc.canvas.clientWidth / 2 + this.pc.panX;
    this.pc.originY = this.pc.canvas.clientHeight / 2 + this.pc.panY;

    const { mode, kepler } = this.config;

    if (mode === 'kepler' && kepler) {
      this.drawKepler(kepler);
    } else if (mode === 'twobody') {
      this.drawTwoBody();
    }
  }

  private drawTwoBody(): void {
    // 1. Draw barycenter crosshair (+) at (0, 0)
    const sBarycenter = this.pc.toScreen(0, 0);
    this.pc.ctx.save();
    this.pc.ctx.strokeStyle = this.pc.theme === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)';
    this.pc.ctx.lineWidth = 1.5;
    this.pc.ctx.beginPath();
    this.pc.ctx.moveTo(sBarycenter.x - 8, sBarycenter.y);
    this.pc.ctx.lineTo(sBarycenter.x + 8, sBarycenter.y);
    this.pc.ctx.moveTo(sBarycenter.x, sBarycenter.y - 8);
    this.pc.ctx.lineTo(sBarycenter.x, sBarycenter.y + 8);
    this.pc.ctx.stroke();
    this.pc.ctx.restore();

    // 2. Draw faded orbital trail lines
    const drawTrail = (trail: { x: number; y: number }[], rgbaPrefix: string) => {
      if (trail.length < 2) return;
      this.pc.ctx.save();
      this.pc.ctx.lineWidth = 1.5;
      for (let i = 1; i < trail.length; i++) {
        const ptPrev = this.pc.toScreen(trail[i - 1].x, trail[i - 1].y);
        const ptCurr = this.pc.toScreen(trail[i].x, trail[i].y);
        const alpha = i / trail.length;
        this.pc.ctx.strokeStyle = `${rgbaPrefix}${alpha * 0.4})`;
        this.pc.ctx.beginPath();
        this.pc.ctx.moveTo(ptPrev.x, ptPrev.y);
        this.pc.ctx.lineTo(ptCurr.x, ptCurr.y);
        this.pc.ctx.stroke();
      }
      this.pc.ctx.restore();
    };

    drawTrail(this.body1Trail, 'rgba(99, 102, 241, ');
    drawTrail(this.body2Trail, 'rgba(239, 68, 68, ');

    // 3. Render body circles proportional to mass
    const s1 = this.pc.toScreen(this.x1, this.y1);
    const s2 = this.pc.toScreen(this.x2, this.y2);

    const r1 = Math.max(5, 4 + Math.sqrt(this.m1) * 2.5);
    const r2 = Math.max(5, 4 + Math.sqrt(this.m2) * 2.5);

    // Draw Body 1 (Star / Heavy body) - glowing gradient for premium look
    this.pc.ctx.save();
    const grad1 = this.pc.ctx.createRadialGradient(s1.x, s1.y, 2, s1.x, s1.y, r1 * 1.2);
    grad1.addColorStop(0, '#eef2ff');
    grad1.addColorStop(0.3, '#818cf8');
    grad1.addColorStop(1, '#4f46e5');
    this.pc.ctx.fillStyle = grad1;
    this.pc.ctx.strokeStyle = this.pc.theme === 'dark' ? '#fff' : '#000';
    this.pc.ctx.lineWidth = 1.5;
    this.pc.ctx.beginPath();
    this.pc.ctx.arc(s1.x, s1.y, r1, 0, 2 * Math.PI);
    this.pc.ctx.fill();
    this.pc.ctx.stroke();
    this.pc.ctx.restore();

    // Draw Body 2 (Planet / Companion) - glowing gradient
    this.pc.ctx.save();
    const grad2 = this.pc.ctx.createRadialGradient(s2.x, s2.y, 2, s2.x, s2.y, r2 * 1.2);
    grad2.addColorStop(0, '#fef2f2');
    grad2.addColorStop(0.3, '#f87171');
    grad2.addColorStop(1, '#dc2626');
    this.pc.ctx.fillStyle = grad2;
    this.pc.ctx.strokeStyle = this.pc.theme === 'dark' ? '#fff' : '#000';
    this.pc.ctx.lineWidth = 1.5;
    this.pc.ctx.beginPath();
    this.pc.ctx.arc(s2.x, s2.y, r2, 0, 2 * Math.PI);
    this.pc.ctx.fill();
    this.pc.ctx.stroke();
    this.pc.ctx.restore();

    // Label masses
    this.pc.ctx.save();
    this.pc.ctx.fillStyle = this.pc.theme === 'dark' ? '#f3f4f6' : '#1f2937';
    this.pc.ctx.font = '500 11px sans-serif';
    this.pc.ctx.fillText(`m₁ = ${this.m1.toFixed(1)}`, s1.x + r1 + 6, s1.y + 4);
    this.pc.ctx.fillText(`m₂ = ${this.m2.toFixed(1)}`, s2.x + r2 + 6, s2.y + 4);
    this.pc.ctx.restore();

    // 4. Render velocity vectors
    const v1 = Math.sqrt(this.vx1 * this.vx1 + this.vy1 * this.vy1);
    if (v1 > 0.1) {
      const velScale = 0.4;
      this.pc.drawArrow(
        this.x1, this.y1,
        this.x1 + this.vx1 * velScale, this.y1 + this.vy1 * velScale,
        '#818cf8', `v₁ = ${v1.toFixed(2)}`, { headSize: 5, labelOffset: 10 }
      );
    }

    const v2 = Math.sqrt(this.vx2 * this.vx2 + this.vy2 * this.vy2);
    if (v2 > 0.1) {
      const velScale = 0.4;
      this.pc.drawArrow(
        this.x2, this.y2,
        this.x2 + this.vx2 * velScale, this.y2 + this.vy2 * velScale,
        '#f87171', `v₂ = ${v2.toFixed(2)}`, { headSize: 5, labelOffset: 10 }
      );
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
