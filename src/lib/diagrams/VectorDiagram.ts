import type { VectorConfig, VectorItem } from '../types';
import { PhysicsCanvas } from '../PhysicsCanvas';

export class VectorDiagram {
  private pc: PhysicsCanvas;
  private config!: VectorConfig;

  constructor(pc: PhysicsCanvas) {
    this.pc = pc;
  }

  public setConfig(config: VectorConfig): void {
    this.config = config;
  }

  public draw(): void {
    if (!this.config) return;

    this.pc.clear();
    this.pc.resetOrigin();

    const { vectors, operation, showComponents, showGrid } = this.config;

    // For 3D cross product, we draw custom axes. For others, draw standard 2D grid
    if (operation === 'cross') {
      this.draw3DCrossProduct();
      return;
    }

    if (showGrid) {
      this.pc.drawGrid(1);
    }

    if (vectors.length === 0) return;

    const vecScale = 1.0; // grid unit scale matches canvas scale

    if (operation === 'none') {
      // Just draw the vectors from the origin
      vectors.forEach((v) => {
        this.pc.drawArrow(0, 0, v.x * vecScale, v.y * vecScale, v.color, v.label);
        if (showComponents) {
          this.drawComponents(v);
        }
      });

    } else if (operation === 'add') {
      if (vectors.length >= 2) {
        const v1 = vectors[0];
        const v2 = vectors[1];

        // Draw V1 from origin
        this.pc.drawArrow(0, 0, v1.x, v1.y, v1.color, v1.label);
        
        // Draw V2 from tip of V1 (nose-to-tail)
        this.pc.drawArrow(v1.x, v1.y, v1.x + v2.x, v1.y + v2.y, v2.color, v2.label, { dashed: true });

        // Draw resultant vector V1 + V2 from origin to tip of V2
        const rx = v1.x + v2.x;
        const ry = v1.y + v2.y;
        this.pc.drawArrow(0, 0, rx, ry, '#10b981', `${v1.label} + ${v2.label}`);

        if (showComponents) {
          this.drawComponents({ id: 'R', x: rx, y: ry, color: '#10b981', label: 'R' });
        }
      }

    } else if (operation === 'subtract') {
      if (vectors.length >= 2) {
        const v1 = vectors[0];
        const v2 = vectors[1];

        // Draw V1 and V2 from origin
        this.pc.drawArrow(0, 0, v1.x, v1.y, v1.color, v1.label);
        this.pc.drawArrow(0, 0, v2.x, v2.y, v2.color, v2.label);

        // Draw V1 - V2 from tip of V2 to tip of V1
        this.pc.drawArrow(v2.x, v2.y, v1.x, v1.y, '#ef4444', `${v1.label} - ${v2.label}`);

        // Or draw -V2 from tip of V1
        this.pc.drawArrow(v1.x, v1.y, v1.x - v2.x, v1.y - v2.y, v2.color, `-${v2.label}`, { dashed: true });
        
        // Draw resultant from origin
        this.pc.drawArrow(0, 0, v1.x - v2.x, v1.y - v2.y, '#ef4444', `R = ${v1.label} - ${v2.label}`);

        if (showComponents) {
          this.drawComponents({ id: 'R', x: v1.x - v2.x, y: v1.y - v2.y, color: '#ef4444', label: 'R' });
        }
      }

    } else if (operation === 'dot') {
      if (vectors.length >= 2) {
        const v1 = vectors[0];
        const v2 = vectors[1];

        // Draw V1 and V2 from origin
        this.pc.drawArrow(0, 0, v1.x, v1.y, v1.color, v1.label);
        this.pc.drawArrow(0, 0, v2.x, v2.y, v2.color, v2.label);

        // Compute dot product
        const dot = v1.x * v2.x + v1.y * v2.y;
        const mag2Sq = v2.x * v2.x + v2.y * v2.y;

        if (mag2Sq > 0) {
          // Projection vector of V1 onto V2
          const projFactor = dot / mag2Sq;
          const px = projFactor * v2.x;
          const py = projFactor * v2.y;

          // Draw dashed line from V1 tip to V2 projection tip
          this.pc.ctx.save();
          this.pc.ctx.strokeStyle = this.pc.theme === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
          this.pc.ctx.setLineDash([3, 3]);
          this.pc.ctx.lineWidth = 1.5;

          const sV1 = this.pc.toScreen(v1.x, v1.y);
          const sProj = this.pc.toScreen(px, py);

          this.pc.ctx.beginPath();
          this.pc.ctx.moveTo(sV1.x, sV1.y);
          this.pc.ctx.lineTo(sProj.x, sProj.y);
          this.pc.ctx.stroke();
          this.pc.ctx.restore();

          // Draw projection vector along V2 highlighted
          this.pc.drawArrow(0, 0, px, py, '#f59e0b', `Proj = ${(dot / Math.sqrt(mag2Sq)).toFixed(2)}`, { lineWidth: 4 });

          // Render dot product value
          const text = `${v1.label} · ${v2.label} = ${dot.toFixed(2)}`;
          this.pc.ctx.save();
          this.pc.ctx.fillStyle = this.pc.theme === 'dark' ? '#fff' : '#000';
          this.pc.ctx.font = 'bold 14px Outfit, sans-serif';
          this.pc.ctx.fillText(text, 20, 40);
          this.pc.ctx.restore();
        }
      }
    }
  }

  private drawComponents(v: VectorItem): void {
    this.pc.ctx.save();
    this.pc.ctx.strokeStyle = v.color;
    this.pc.ctx.setLineDash([2, 3]);
    this.pc.ctx.lineWidth = 1.5;

    const start = this.pc.toScreen(0, 0);
    const mid = this.pc.toScreen(v.x, 0);
    const end = this.pc.toScreen(v.x, v.y);

    // X Component line
    this.pc.ctx.beginPath();
    this.pc.ctx.moveTo(start.x, start.y);
    this.pc.ctx.lineTo(mid.x, mid.y);
    this.pc.ctx.stroke();

    // Y Component line
    this.pc.ctx.beginPath();
    this.pc.ctx.moveTo(mid.x, mid.y);
    this.pc.ctx.lineTo(end.x, end.y);
    this.pc.ctx.stroke();

    // Labels
    this.pc.ctx.fillStyle = v.color;
    this.pc.ctx.font = '10px Outfit, sans-serif';
    
    // X Component label
    this.pc.ctx.textAlign = 'center';
    this.pc.ctx.textBaseline = 'top';
    this.pc.ctx.fillText(`${v.label}x = ${v.x.toFixed(1)}`, mid.x / 2 + start.x / 2, start.y + 4);

    // Y Component label
    this.pc.ctx.textAlign = 'left';
    this.pc.ctx.textBaseline = 'middle';
    this.pc.ctx.fillText(`${v.label}y = ${v.y.toFixed(1)}`, mid.x + 6, mid.y / 2 + end.y / 2);

    this.pc.ctx.restore();
  }

  // Draw 3D Cross Product using Isometric Projection
  private draw3DCrossProduct(): void {
    const vectors = this.config.vectors;
    if (vectors.length < 2) return;

    const v1 = vectors[0];
    const v2 = vectors[1];

    // Standard 3D vectors (z coordinate can be set in config, defaults to 0 for inputs)
    const ax = v1.x;
    const ay = v1.y;
    const az = v1.z || 0;

    const bx = v2.x;
    const by = v2.y;
    const bz = v2.z || 0;

    // Cross product: C = A x B
    const cx = ay * bz - az * by;
    const cy = az * bx - ax * bz;
    const cz = ax * by - ay * bx;

    // Screen projection mapper (3D Isometric)
    const project = (x3d: number, y3d: number, z3d: number) => {
      const scale3d = 40; // scale factor
      const isoAngle = 30 * (Math.PI / 180);
      
      // Isometric coordinates
      const sx = this.pc.originX + (y3d - x3d) * Math.cos(isoAngle) * scale3d;
      const sy = this.pc.originY - (z3d - (x3d + y3d) * Math.sin(isoAngle)) * scale3d;
      
      return { x: sx, y: sy };
    };

    // Draw 3D Grid Axes (X down-left, Y down-right, Z straight up)
    this.pc.ctx.save();
    this.pc.ctx.lineWidth = 1.5;
    
    const axisColor = this.pc.theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)';
    this.pc.ctx.strokeStyle = axisColor;
    this.pc.ctx.fillStyle = this.pc.theme === 'dark' ? '#888' : '#555';
    this.pc.ctx.font = 'italic 12px Outfit, sans-serif';

    const origin = project(0, 0, 0);
    const xAxis = project(5, 0, 0);
    const yAxis = project(0, 5, 0);
    const zAxis = project(0, 0, 5);

    // Draw axis lines
    this.pc.ctx.beginPath();
    this.pc.ctx.moveTo(origin.x, origin.y); this.pc.ctx.lineTo(xAxis.x, xAxis.y);
    this.pc.ctx.moveTo(origin.x, origin.y); this.pc.ctx.lineTo(yAxis.x, yAxis.y);
    this.pc.ctx.moveTo(origin.x, origin.y); this.pc.ctx.lineTo(zAxis.x, zAxis.y);
    this.pc.ctx.stroke();

    // Axis labels
    this.pc.ctx.fillText('X', xAxis.x - 10, xAxis.y + 10);
    this.pc.ctx.fillText('Y', yAxis.x + 10, yAxis.y + 10);
    this.pc.ctx.fillText('Z', zAxis.x, zAxis.y - 10);
    this.pc.ctx.restore();

    const draw3DArrow = (
      fx: number, fy: number, fz: number,
      tx: number, ty: number, tz: number,
      color: string, label: string
    ) => {
      const from = project(fx, fy, fz);
      const to = project(tx, ty, tz);

      this.pc.ctx.save();
      this.pc.ctx.strokeStyle = color;
      this.pc.ctx.fillStyle = color;
      this.pc.ctx.lineWidth = 3;

      // Draw line
      this.pc.ctx.beginPath();
      this.pc.ctx.moveTo(from.x, from.y);
      this.pc.ctx.lineTo(to.x, to.y);
      this.pc.ctx.stroke();

      // Draw arrowhead
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const angle = Math.atan2(dy, dx);
      const hs = 12;

      this.pc.ctx.beginPath();
      this.pc.ctx.moveTo(to.x, to.y);
      this.pc.ctx.lineTo(to.x - hs * Math.cos(angle - Math.PI / 6), to.y - hs * Math.sin(angle - Math.PI / 6));
      this.pc.ctx.lineTo(to.x - hs * Math.cos(angle + Math.PI / 6), to.y - hs * Math.sin(angle + Math.PI / 6));
      this.pc.ctx.closePath();
      this.pc.ctx.fill();

      // Draw label
      this.pc.ctx.font = 'bold 12px Outfit, sans-serif';
      this.pc.ctx.textAlign = 'center';
      this.pc.ctx.textBaseline = 'bottom';
      this.pc.ctx.fillText(label, to.x, to.y - 8);

      this.pc.ctx.restore();
    };

    // Draw Parallelogram (Shading) representing cross product area
    // Points: (0,0,0), A, A+B, B
    const p0 = project(0, 0, 0);
    const pA = project(ax, ay, az);
    const pB = project(bx, by, bz);
    const pAB = project(ax + bx, ay + by, az + bz);

    this.pc.ctx.save();
    this.pc.ctx.fillStyle = this.pc.theme === 'dark' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)';
    this.pc.ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)';
    this.pc.ctx.lineWidth = 1;
    this.pc.ctx.setLineDash([2, 2]);

    this.pc.ctx.beginPath();
    this.pc.ctx.moveTo(p0.x, p0.y);
    this.pc.ctx.lineTo(pA.x, pA.y);
    this.pc.ctx.lineTo(pAB.x, pAB.y);
    this.pc.ctx.lineTo(pB.x, pB.y);
    this.pc.ctx.closePath();
    this.pc.ctx.fill();
    this.pc.ctx.stroke();
    this.pc.ctx.restore();

    // Draw Vectors A and B
    draw3DArrow(0, 0, 0, ax, ay, az, v1.color, v1.label);
    draw3DArrow(0, 0, 0, bx, by, bz, v2.color, v2.label);

    // Draw Resultant Cross Product Vector C = A x B
    draw3DArrow(0, 0, 0, cx, cy, cz, '#ef4444', `A x B = [${cx.toFixed(1)}, ${cy.toFixed(1)}, ${cz.toFixed(1)}]`);

    // Render magnitude of cross product
    const magnitude = Math.sqrt(cx*cx + cy*cy + cz*cz);
    this.pc.ctx.save();
    this.pc.ctx.fillStyle = this.pc.theme === 'dark' ? '#fff' : '#000';
    this.pc.ctx.font = 'bold 13px Outfit, sans-serif';
    this.pc.ctx.fillText(`Area (||A x B||) = ${magnitude.toFixed(2)} units²`, 20, 40);
    this.pc.ctx.restore();
  }
}
