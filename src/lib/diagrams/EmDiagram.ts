import type { EmConfig, EmCharge, EmParticle } from '../types';
import { PhysicsCanvas } from '../PhysicsCanvas';
import type { EnergyStatePoint } from './GraphModule';

export class EmDiagram {
  public pc: PhysicsCanvas;
  public config!: EmConfig;

  // State variables
  public charges: EmCharge[] = [];
  public particles: EmParticle[] = [];
  public history: EnergyStatePoint[] = [];
  public t: number = 0;

  // Constants
  private readonly ke: number = 10.0; // Coulomb's constant
  private readonly epsilonSq: number = 0.04; // Softening factor (eps = 0.2)

  constructor(pc: PhysicsCanvas) {
    this.pc = pc;
  }

  public setConfig(config: EmConfig): void {
    this.config = config;
    this.resetState();
  }

  public resetState(): void {
    if (!this.config) return;
    // Deep clone charges to avoid mutating the original config array
    this.charges = this.config.charges.map(c => ({ ...c }));
    this.particles = [];
    this.history = [];
    this.t = 0;
  }

  private getDerivatives(
    x: number,
    y: number,
    vx: number,
    vy: number,
    q: number,
    m: number
  ): [number, number, number, number] {
    const E = this.getFieldAt(x, y);
    const B = this.config ? this.config.bField : 0;
    const ax = (q / m) * (E.ex + vy * B);
    const ay = (q / m) * (E.ey - vx * B);
    return [vx, vy, ax, ay];
  }

  public step(dt: number): void {
    if (!this.config) return;

    const remainingParticles: EmParticle[] = [];

    for (const p of this.particles) {
      // Runge-Kutta 4th Order (RK4) integration step
      const [dx1, dy1, dvx1, dvy1] = this.getDerivatives(p.x, p.y, p.vx, p.vy, p.q, p.m);

      const x2 = p.x + (dx1 * dt) / 2;
      const y2 = p.y + (dy1 * dt) / 2;
      const vx2 = p.vx + (dvx1 * dt) / 2;
      const vy2 = p.vy + (dvy1 * dt) / 2;
      const [dx2, dy2, dvx2, dvy2] = this.getDerivatives(x2, y2, vx2, vy2, p.q, p.m);

      const x3 = p.x + (dx2 * dt) / 2;
      const y3 = p.y + (dy2 * dt) / 2;
      const vx3 = p.vx + (dvx2 * dt) / 2;
      const vy3 = p.vy + (dvy2 * dt) / 2;
      const [dx3, dy3, dvx3, dvy3] = this.getDerivatives(x3, y3, vx3, vy3, p.q, p.m);

      const x4 = p.x + dx3 * dt;
      const y4 = p.y + dy3 * dt;
      const vx4 = p.vx + dvx3 * dt;
      const vy4 = p.vy + dvy3 * dt;
      const [dx4, dy4, dvx4, dvy4] = this.getDerivatives(x4, y4, vx4, vy4, p.q, p.m);

      p.x += (dt / 6) * (dx1 + 2 * dx2 + 2 * dx3 + dx4);
      p.y += (dt / 6) * (dy1 + 2 * dy2 + 2 * dy3 + dy4);
      p.vx += (dt / 6) * (dvx1 + 2 * dvx2 + 2 * dvx3 + dvx4);
      p.vy += (dt / 6) * (dvy1 + 2 * dvy2 + 2 * dvy3 + dvy4);

      // Append new position to trail and limit history size
      p.trail.push({ x: p.x, y: p.y });
      if (p.trail.length > 500) {
        p.trail.shift();
      }

      // Contact absorption check with static charges (14px collision radius in screen space)
      const collisionRadius = 14 / this.pc.scale;
      let absorbed = false;
      for (const c of this.charges) {
        const dx = p.x - c.x;
        const dy = p.y - c.y;
        if (dx * dx + dy * dy < collisionRadius * collisionRadius) {
          absorbed = true;
          break;
        }
      }

      // Threat mitigation: automatic annihilation if particle travels too far off-screen
      const distSq = p.x * p.x + p.y * p.y;
      if (distSq > 900) { // distance from origin > 30 => r^2 > 900
        absorbed = true;
      }

      if (!absorbed) {
        remainingParticles.push(p);
      }
    }

    this.particles = remainingParticles;

    // Record telemetry history for the active particle
    this.t += dt;
    if (this.particles.length > 0) {
      const p = this.particles[0];
      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      const ke = 0.5 * p.m * speed * speed;
      const pe = p.q * this.getPotentialAt(p.x, p.y);
      this.history.push({
        t: this.t,
        kineticEnergy: ke,
        potentialEnergy: pe,
        totalEnergy: ke + pe,
        x: p.x,
        v: speed
      });
      if (this.history.length > 200) {
        this.history.shift();
      }
    }
  }

  /**
   * Calculates the electric potential V at point (x, y)
   */
  public getPotentialAt(x: number, y: number): number {
    let totalPotential = 0;
    for (const c of this.charges) {
      const dx = x - c.x;
      const dy = y - c.y;
      const dist = Math.sqrt(dx * dx + dy * dy + this.epsilonSq);
      totalPotential += (this.ke * c.q) / dist;
    }
    return totalPotential;
  }

  /**
   * Calculates the electric field vector E = (ex, ey) at point (x, y)
   */
  public getFieldAt(x: number, y: number): { ex: number; ey: number } {
    let ex = 0;
    let ey = 0;
    for (const c of this.charges) {
      const dx = x - c.x;
      const dy = y - c.y;
      const distSq = dx * dx + dy * dy + this.epsilonSq;
      const distCube = Math.pow(distSq, 1.5);
      const mag = (this.ke * c.q) / distCube;
      ex += mag * dx;
      ey += mag * dy;
    }
    return { ex, ey };
  }

  private drawEquipotentials(canvas: PhysicsCanvas): void {
    const width = canvas.canvas.clientWidth;
    const height = canvas.canvas.clientHeight;
    const ctx = canvas.ctx;

    // 1. Grid parameters
    const cellSize = 15; // pixels
    const cols = Math.ceil(width / cellSize);
    const rows = Math.ceil(height / cellSize);

    // 2. Precompute potential grid
    const grid: number[][] = [];
    for (let c = 0; c <= cols; c++) {
      grid[c] = [];
      for (let r = 0; r <= rows; r++) {
        const phys = canvas.toPhysics(c * cellSize, r * cellSize);
        grid[c][r] = this.getPotentialAt(phys.x, phys.y);
      }
    }

    // 3. Define target potential values to trace
    const V_targets = [
      -150, -100, -70, -50, -40, -30, -20, -15, -10, -5, -2,
      2, 5, 10, 15, 20, 30, 40, 50, 70, 100, 150
    ];

    ctx.save();
    ctx.strokeStyle = 'rgba(20, 184, 166, 0.4)'; // Teal/green semi-transparent contours
    ctx.lineWidth = 1.0;

    const lerp = (xa: number, ya: number, xb: number, yb: number, va: number, vb: number, target: number) => {
      if (Math.abs(vb - va) < 1e-6) return { x: xa, y: ya };
      const t = (target - va) / (vb - va);
      return { x: xa + t * (xb - xa), y: ya + t * (yb - ya) };
    };

    // 4. Marching Squares algorithm cell-by-cell
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const v_tl = grid[c][r];
        const v_tr = grid[c + 1][r];
        const v_br = grid[c + 1][r + 1];
        const v_bl = grid[c][r + 1];

        const minV = Math.min(v_tl, v_tr, v_br, v_bl);
        const maxV = Math.max(v_tl, v_tr, v_br, v_bl);

        const x0 = c * cellSize;
        const y0 = r * cellSize;
        const x1 = (c + 1) * cellSize;
        const y1 = (r + 1) * cellSize;

        for (const V_target of V_targets) {
          // Optimization: check if contour target is within the range of cell corners
          if (V_target < minV || V_target > maxV) continue;

          const t_tl = v_tl >= V_target;
          const t_tr = v_tr >= V_target;
          const t_br = v_br >= V_target;
          const t_bl = v_bl >= V_target;

          const points: { x: number; y: number }[] = [];

          if (t_tl !== t_tr) points.push(lerp(x0, y0, x1, y0, v_tl, v_tr, V_target));
          if (t_tr !== t_br) points.push(lerp(x1, y0, x1, y1, v_tr, v_br, V_target));
          if (t_bl !== t_br) points.push(lerp(x0, y1, x1, y1, v_bl, v_br, V_target));
          if (t_tl !== t_bl) points.push(lerp(x0, y0, x0, y1, v_tl, v_bl, V_target));

          if (points.length === 2) {
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            ctx.lineTo(points[1].x, points[1].y);
            ctx.stroke();
          } else if (points.length === 4) {
            const v_center = (v_tl + v_tr + v_br + v_bl) / 4;
            ctx.beginPath();
            if (v_center >= V_target) {
              // Connect Top (0) to Left (3), and Right (1) to Bottom (2)
              ctx.moveTo(points[0].x, points[0].y);
              ctx.lineTo(points[3].x, points[3].y);
              ctx.moveTo(points[1].x, points[1].y);
              ctx.lineTo(points[2].x, points[2].y);
            } else {
              // Connect Top (0) to Right (1), and Bottom (2) to Left (3)
              ctx.moveTo(points[0].x, points[0].y);
              ctx.lineTo(points[1].x, points[1].y);
              ctx.moveTo(points[2].x, points[2].y);
              ctx.lineTo(points[3].x, points[3].y);
            }
            ctx.stroke();
          }
        }
      }
    }

    ctx.restore();
  }

  private drawFieldGrid(canvas: PhysicsCanvas): void {
    const width = canvas.canvas.clientWidth;
    const height = canvas.canvas.clientHeight;
    const spacing = 30; // 30px spacing

    const isDark = canvas.theme === 'dark';
    const baseColorPrefix = isDark ? 'rgba(255, 255, 255,' : 'rgba(0, 0, 0,';

    // Min distance from charge to avoid arrow overlap
    const minDistanceSq = Math.pow(15 / canvas.scale, 2);

    for (let sx = spacing / 2; sx < width; sx += spacing) {
      for (let sy = spacing / 2; sy < height; sy += spacing) {
        const p = canvas.toPhysics(sx, sy);

        // Singularity/overlap check: do not draw arrow if inside or too close to any charge center
        let tooClose = false;
        for (const c of this.charges) {
          const dx = p.x - c.x;
          const dy = p.y - c.y;
          if (dx * dx + dy * dy < minDistanceSq) {
            tooClose = true;
            break;
          }
        }
        if (tooClose) continue;

        const E = this.getFieldAt(p.x, p.y);
        const mag = Math.sqrt(E.ex * E.ex + E.ey * E.ey);
        if (mag < 1e-4) continue;

        // Non-linear arrow length scaling using clamped arctan
        const maxLength = 18; // px
        const scaledLength = maxLength * (2 / Math.PI) * Math.atan(mag * 0.05);
        if (scaledLength < 2) continue;

        // Fade arrow opacity in weak fields
        const opacity = Math.min(1.0, mag * 0.1) * 0.45;
        if (opacity < 0.02) continue;

        const ux = E.ex / mag;
        const uy = E.ey / mag;

        const scaledLengthPhys = scaledLength / canvas.scale;
        const fx = p.x - ux * (scaledLengthPhys / 2);
        const fy = p.y - uy * (scaledLengthPhys / 2);
        const tx = p.x + ux * (scaledLengthPhys / 2);
        const ty = p.y + uy * (scaledLengthPhys / 2);

        const color = `${baseColorPrefix} ${opacity})`;
        const headSize = Math.max(3, scaledLength * 0.35);

        canvas.drawArrow(fx, fy, tx, ty, color, '', {
          lineWidth: 1.2,
          headSize: headSize
        });
      }
    }
  }

  private getNextPointRK2(
    x: number,
    y: number,
    ds: number,
    forward: boolean
  ): { x: number; y: number } | null {
    const E1 = this.getFieldAt(x, y);
    const mag1 = Math.sqrt(E1.ex * E1.ex + E1.ey * E1.ey);
    if (mag1 < 1e-4) return null;

    const dir1x = (E1.ex / mag1) * (forward ? 1 : -1);
    const dir1y = (E1.ey / mag1) * (forward ? 1 : -1);

    const midX = x + dir1x * (ds / 2);
    const midY = y + dir1y * (ds / 2);

    const E2 = this.getFieldAt(midX, midY);
    const mag2 = Math.sqrt(E2.ex * E2.ex + E2.ey * E2.ey);
    if (mag2 < 1e-4) return null;

    const dir2x = (E2.ex / mag2) * (forward ? 1 : -1);
    const dir2y = (E2.ey / mag2) * (forward ? 1 : -1);

    return {
      x: x + dir2x * ds,
      y: y + dir2y * ds
    };
  }

  private drawFieldLines(canvas: PhysicsCanvas): void {
    const width = canvas.canvas.clientWidth;
    const height = canvas.canvas.clientHeight;
    const ctx = canvas.ctx;
    const isDark = canvas.theme === 'dark';

    // Setup style
    ctx.save();
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0, 0, 0, 0.22)';
    ctx.lineWidth = 1.2;

    // Tracing strategy:
    // If there are positive charges, trace forward from positive charges.
    // If there are only negative charges, trace backward from negative charges.
    const hasPositive = this.charges.some(c => c.q > 0);
    const startCharges = hasPositive
      ? this.charges.filter(c => c.q > 0)
      : this.charges.filter(c => c.q < 0);
    const forward = hasPositive;

    const rStart = 15 / canvas.scale; // start slightly outside charge radius (14px)
    const hitRadiusSq = Math.pow(14 / canvas.scale, 2);

    for (const c of startCharges) {
      const numLines = Math.round(Math.abs(c.q) * 8);
      if (numLines === 0) continue;

      for (let i = 0; i < numLines; i++) {
        const angle = (i * 2 * Math.PI) / numLines;
        let px = c.x + rStart * Math.cos(angle);
        let py = c.y + rStart * Math.sin(angle);

        const path: { x: number; y: number }[] = [{ x: px, y: py }];
        let stepCount = 0;
        const maxSteps = 300;
        const ds = 0.08;

        while (stepCount < maxSteps) {
          const next = this.getNextPointRK2(px, py, ds, forward);
          if (!next) break;

          px = next.x;
          py = next.y;
          path.push({ x: px, y: py });

          // 1. Off-screen boundary termination check
          const screenPos = canvas.toScreen(px, py);
          const margin = 50;
          if (
            screenPos.x < -margin ||
            screenPos.x > width + margin ||
            screenPos.y < -margin ||
            screenPos.y > height + margin
          ) {
            break;
          }

          // 2. Collision with other charges check
          let hitOther = false;
          for (const other of this.charges) {
            // Do not immediately collide with the source starting charge
            if (other.id === c.id && path.length < 5) continue;

            const dx = px - other.x;
            const dy = py - other.y;
            if (dx * dx + dy * dy < hitRadiusSq) {
              path.push({ x: other.x, y: other.y });
              hitOther = true;
              break;
            }
          }
          if (hitOther) break;

          stepCount++;
        }

        // Draw the path
        if (path.length >= 2) {
          ctx.beginPath();
          const startPos = canvas.toScreen(path[0].x, path[0].y);
          ctx.moveTo(startPos.x, startPos.y);
          for (let j = 1; j < path.length; j++) {
            const pt = canvas.toScreen(path[j].x, path[j].y);
            ctx.lineTo(pt.x, pt.y);
          }
          ctx.stroke();
        }
      }
    }

    ctx.restore();
  }

  public fireParticle(): void {
    if (!this.config) return;
    const angleRad = this.config.gunAngle * Math.PI / 180;
    const vx = this.config.gunSpeed * Math.cos(angleRad);
    const vy = this.config.gunSpeed * Math.sin(angleRad);

    const newParticle: EmParticle = {
      id: 'p_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      x: this.config.gunX,
      y: this.config.gunY,
      vx: vx,
      vy: vy,
      q: this.config.particleCharge,
      m: this.config.particleMass,
      trail: [{ x: this.config.gunX, y: this.config.gunY }]
    };

    if (this.particles.length >= 20) {
      this.particles.shift();
    }
    this.particles.push(newParticle);
  }

  public getGunDragTarget(p: { x: number; y: number }): 'gun-base' | 'gun-barrel' | null {
    if (!this.config) return null;
    const angleRad = this.config.gunAngle * Math.PI / 180;
    const barrelLen = 0.8;
    const tipX = this.config.gunX + Math.cos(angleRad) * barrelLen;
    const tipY = this.config.gunY + Math.sin(angleRad) * barrelLen;

    const distToTip = Math.sqrt((p.x - tipX) ** 2 + (p.y - tipY) ** 2);
    if (distToTip < 0.4) {
      return 'gun-barrel';
    }

    const distToBase = Math.sqrt((p.x - this.config.gunX) ** 2 + (p.y - this.config.gunY) ** 2);
    if (distToBase < 0.4) {
      return 'gun-base';
    }

    return null;
  }

  private drawBField(canvas: PhysicsCanvas): void {
    if (!this.config || Math.abs(this.config.bField) < 1e-4) return;
    const width = canvas.canvas.clientWidth;
    const height = canvas.canvas.clientHeight;
    const ctx = canvas.ctx;
    const isDark = canvas.theme === 'dark';
    const bColor = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)';

    ctx.save();
    ctx.strokeStyle = bColor;
    ctx.fillStyle = bColor;
    ctx.lineWidth = 1.0;

    const spacing = 45; // 45px grid spacing for symbols
    const B = this.config.bField;
    const mode = this.config.bFieldMode;

    if (mode === 'symbols') {
      for (let x = spacing / 2; x < width; x += spacing) {
        for (let y = spacing / 2; y < height; y += spacing) {
          ctx.beginPath();
          ctx.arc(x, y, 6, 0, 2 * Math.PI);
          ctx.stroke();

          if (B > 0) {
            // Out of page: dot
            ctx.beginPath();
            ctx.arc(x, y, 1.5, 0, 2 * Math.PI);
            ctx.fill();
          } else {
            // Into page: cross
            const r = 3.5;
            ctx.beginPath();
            ctx.moveTo(x - r, y - r);
            ctx.lineTo(x + r, y + r);
            ctx.moveTo(x + r, y - r);
            ctx.lineTo(x - r, y + r);
            ctx.stroke();
          }
        }
      }
    } else {
      // Field lines: draw perspective vector arrows indicating depth
      for (let x = spacing / 2; x < width; x += spacing) {
        for (let y = spacing / 2; y < height; y += spacing) {
          if (B > 0) {
            // Out of page: draw dot and small perspective arrowhead pointing out
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, 2 * Math.PI);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + 4, y - 4);
            ctx.moveTo(x + 4, y - 4);
            ctx.lineTo(x + 1, y - 4);
            ctx.moveTo(x + 4, y - 4);
            ctx.lineTo(x + 4, y - 1);
            ctx.stroke();
          } else {
            // Into page: draw cross and small depth ring
            const r = 4;
            ctx.beginPath();
            ctx.moveTo(x - r, y - r);
            ctx.lineTo(x + r, y + r);
            ctx.moveTo(x + r, y - r);
            ctx.lineTo(x - r, y + r);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.arc(x, y, 2.5, 0, 2 * Math.PI);
            ctx.stroke();
          }
        }
      }
    }

    ctx.restore();
  }

  public draw(canvas: PhysicsCanvas, selectedChargeId: string | null = null): void {
    const ctx = canvas.ctx;
    canvas.clear();
    canvas.resetOrigin();
    canvas.drawGrid(1);

    // Draw equipotential isolines in the background
    this.drawEquipotentials(canvas);

    // Draw electric field vector grid
    this.drawFieldGrid(canvas);

    // Draw electric field lines via RK2 integration
    this.drawFieldLines(canvas);

    // Draw uniform B-field symbols or lines underneath particle trails and charges
    this.drawBField(canvas);

    // Draw particle trails
    ctx.save();
    ctx.strokeStyle = '#eab308'; // Glowing yellow trail (from UI-SPEC.md)
    ctx.lineWidth = 2.0;
    for (const p of this.particles) {
      if (p.trail.length < 2) continue;
      ctx.beginPath();
      const startPos = canvas.toScreen(p.trail[0].x, p.trail[0].y);
      ctx.moveTo(startPos.x, startPos.y);
      for (let i = 1; i < p.trail.length; i++) {
        const pt = canvas.toScreen(p.trail[i].x, p.trail[i].y);
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    
    // Draw charges
    for (const c of this.charges) {
      const screenPos = canvas.toScreen(c.x, c.y);
      const isSelected = c.id === selectedChargeId;

      // Draw dashed selection outline if selected
      if (isSelected) {
        ctx.save();
        ctx.strokeStyle = '#6366f1'; // Accent color
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#6366f1';
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, 20, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.restore();
      }

      // Draw outer glowing circle
      ctx.save();
      const color = c.q >= 0 ? '#ef4444' : '#3b82f6';
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 6;
      ctx.shadowColor = color;

      // Draw charge circle
      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y, 14, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Draw sign / label (+ or -)
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const label = c.q >= 0 ? '+' : '-';
      ctx.fillText(label, screenPos.x, screenPos.y);
      ctx.restore();
    }
    
    ctx.restore();

    // Draw active particles
    ctx.save();
    for (const p of this.particles) {
      const screenPos = canvas.toScreen(p.x, p.y);
      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = p.q >= 0 ? '#ef4444' : '#3b82f6'; // positive red, negative blue
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();

    // Draw particle gun turret
    if (this.config) {
      const angleRad = this.config.gunAngle * Math.PI / 180;
      const barrelLen = 0.8; // physics units
      const barrelTipX = this.config.gunX + Math.cos(angleRad) * barrelLen;
      const barrelTipY = this.config.gunY + Math.sin(angleRad) * barrelLen;

      const gunScreen = canvas.toScreen(this.config.gunX, this.config.gunY);
      const tipScreen = canvas.toScreen(barrelTipX, barrelTipY);

      // 1. Draw dashed initial velocity direction arrow
      const arrowLen = this.config.gunSpeed * 0.08;
      const arrowEndX = barrelTipX + Math.cos(angleRad) * arrowLen;
      const arrowEndY = barrelTipY + Math.sin(angleRad) * arrowLen;
      canvas.drawArrow(barrelTipX, barrelTipY, arrowEndX, arrowEndY, 'rgba(168, 85, 247, 0.6)', '', { dashed: true, headSize: 8 });

      // 2. Draw turret base outer circle
      ctx.save();
      ctx.strokeStyle = '#a855f7'; // Purple accent (UI-SPEC.md)
      ctx.fillStyle = canvas.theme === 'dark' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(168, 85, 247, 0.1)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(gunScreen.x, gunScreen.y, 18, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // 3. Draw thick barrel pointing at gunAngle
      ctx.save();
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(gunScreen.x, gunScreen.y);
      ctx.lineTo(tipScreen.x, tipScreen.y);
      ctx.stroke();
      ctx.restore();

      // 4. Draw turret base inner core
      ctx.save();
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.arc(gunScreen.x, gunScreen.y, 10, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
    }
  }
}
