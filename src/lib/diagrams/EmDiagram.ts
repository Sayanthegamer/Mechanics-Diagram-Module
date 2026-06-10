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

  public draw(canvas: PhysicsCanvas, selectedChargeId: string | null = null): void {
    const ctx = canvas.ctx;
    canvas.clear();
    canvas.resetOrigin();
    canvas.drawGrid(1);

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
