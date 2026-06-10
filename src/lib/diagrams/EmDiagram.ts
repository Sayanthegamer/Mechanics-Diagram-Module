import type { EmConfig, EmCharge } from '../types';
import { PhysicsCanvas } from '../PhysicsCanvas';

export class EmDiagram {
  public pc: PhysicsCanvas;
  public config!: EmConfig;

  // State variables
  public charges: EmCharge[] = [];

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
  }

  public step(_dt: number): void {
    // Phase 1 has static charges. Dynamics (Lorentz force moving test charges) will be added in Phase 2.
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

  public draw(canvas: PhysicsCanvas, selectedChargeId: string | null = null): void {
    const ctx = canvas.ctx;
    canvas.clear();
    canvas.resetOrigin();
    canvas.drawGrid(1);

    // Draw electric field vector grid
    this.drawFieldGrid(canvas);

    // Draw electric field lines via RK2 integration
    this.drawFieldLines(canvas);

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
  }
}
