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

  public draw(canvas: PhysicsCanvas, selectedChargeId: string | null = null): void {
    const ctx = canvas.ctx;
    canvas.clear();
    canvas.resetOrigin();
    canvas.drawGrid(1);

    // Draw electric field vector grid
    this.drawFieldGrid(canvas);

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
