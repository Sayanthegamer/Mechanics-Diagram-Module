export interface ArrowOptions {
  lineWidth?: number;
  headSize?: number;
  dashed?: boolean;
  labelOffset?: number;
  componentLines?: boolean;
}

export class PhysicsCanvas {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  public scale: number = 50; // pixels per physics unit
  public originX: number = 0; // screen X of origin
  public originY: number = 0; // screen Y of origin
  public theme: 'light' | 'dark' = 'dark';
  public panX: number = 0;
  public panY: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not get 2D context');
    this.ctx = context;
    this.resize();
    this.resetOrigin();
  }

  public resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.resetTransform();
    this.ctx.scale(dpr, dpr);
  }

  public resetOrigin(): void {
    this.originX = this.canvas.clientWidth / 2 + this.panX;
    this.originY = this.canvas.clientHeight / 2 + this.panY;
  }

  public checkResize(): void {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const expectedWidth = Math.floor(rect.width * dpr);
    const expectedHeight = Math.floor(rect.height * dpr);
    
    if (this.canvas.width !== expectedWidth || this.canvas.height !== expectedHeight) {
      this.resize();
      this.resetOrigin();
    }
  }

  public clear(): void {
    this.checkResize();
    this.ctx.clearRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
  }

  // Convert physics coordinates (Y is UP) to screen coordinates (Y is DOWN)
  public toScreen(x: number, y: number): { x: number; y: number } {
    return {
      x: this.originX + x * this.scale,
      y: this.originY - y * this.scale
    };
  }

  // Convert screen coordinates to physics coordinates
  public toPhysics(sx: number, sy: number): { x: number; y: number } {
    return {
      x: (sx - this.originX) / this.scale,
      y: (this.originY - sy) / this.scale
    };
  }

  // Draw grid lines and axes
  public drawGrid(step: number = 1): void {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;

    const gridColor = this.theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
    const axisColor = this.theme === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)';
    const textColor = this.theme === 'dark' ? '#888' : '#555';

    this.ctx.save();
    this.ctx.strokeStyle = gridColor;
    this.ctx.lineWidth = 1;

    // Draw grid lines
    const startPhysics = this.toPhysics(0, height);
    const endPhysics = this.toPhysics(width, 0);

    const xStart = Math.floor(startPhysics.x / step) * step;
    const xEnd = Math.ceil(endPhysics.x / step) * step;
    const yStart = Math.floor(startPhysics.y / step) * step;
    const yEnd = Math.ceil(endPhysics.y / step) * step;

    for (let x = xStart; x <= xEnd; x += step) {
      const pos = this.toScreen(x, 0);
      this.ctx.beginPath();
      this.ctx.moveTo(pos.x, 0);
      this.ctx.lineTo(pos.x, height);
      this.ctx.stroke();

      // Axis labels (skip origin)
      if (Math.abs(x) > 0.001) {
        this.ctx.fillStyle = textColor;
        this.ctx.font = '10px Outfit, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText(x.toFixed(1).replace('.0', ''), pos.x, this.originY + 5);
      }
    }

    for (let y = yStart; y <= yEnd; y += step) {
      const pos = this.toScreen(0, y);
      this.ctx.beginPath();
      this.ctx.moveTo(0, pos.y);
      this.ctx.lineTo(width, pos.y);
      this.ctx.stroke();

      // Axis labels (skip origin)
      if (Math.abs(y) > 0.001) {
        this.ctx.fillStyle = textColor;
        this.ctx.font = '10px Outfit, sans-serif';
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(y.toFixed(1).replace('.0', ''), this.originX - 8, pos.y);
      }
    }

    // Draw main axes
    this.ctx.strokeStyle = axisColor;
    this.ctx.lineWidth = 1.5;

    // X Axis
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.originY);
    this.ctx.lineTo(width, this.originY);
    this.ctx.stroke();

    // Y Axis
    this.ctx.beginPath();
    this.ctx.moveTo(this.originX, 0);
    this.ctx.lineTo(this.originX, height);
    this.ctx.stroke();

    this.ctx.restore();
  }

  // Draw arrow (vector)
  public drawArrow(
    fx: number, fy: number, // from
    tx: number, ty: number, // to
    color: string,
    label: string = '',
    options: ArrowOptions = {}
  ): void {
    const from = this.toScreen(fx, fy);
    const to = this.toScreen(tx, ty);

    const lw = options.lineWidth || 2;
    const hs = options.headSize || 12;
    const isDashed = options.dashed || false;
    const offset = options.labelOffset || 15;

    this.ctx.save();
    this.ctx.strokeStyle = color;
    this.ctx.fillStyle = color;
    this.ctx.lineWidth = lw;

    if (isDashed) {
      this.ctx.setLineDash([4, 4]);
    } else {
      this.ctx.setLineDash([]);
    }

    // Draw stem
    this.ctx.beginPath();
    this.ctx.moveTo(from.x, from.y);
    this.ctx.lineTo(to.x, to.y);
    this.ctx.stroke();

    // Draw arrowhead
    this.ctx.setLineDash([]);
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const angle = Math.atan2(dy, dx);

    this.ctx.beginPath();
    this.ctx.moveTo(to.x, to.y);
    this.ctx.lineTo(
      to.x - hs * Math.cos(angle - Math.PI / 6),
      to.y - hs * Math.sin(angle - Math.PI / 6)
    );
    this.ctx.lineTo(
      to.x - hs * Math.cos(angle + Math.PI / 6),
      to.y - hs * Math.sin(angle + Math.PI / 6)
    );
    this.ctx.closePath();
    this.ctx.fill();

    // Draw label
    if (label) {
      const midX = to.x;
      const midY = to.y;
      
      // Calculate perpendicular offset
      const perpAngle = angle - Math.PI / 2;
      const lx = midX + offset * Math.cos(perpAngle) - 4 * Math.cos(angle);
      const ly = midY + offset * Math.sin(perpAngle) - 4 * Math.sin(angle);

      this.ctx.font = 'bold 12px Outfit, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      
      // Shadow background for label readability
      const shadowColor = this.theme === 'dark' ? '#121214' : '#ffffff';
      this.ctx.strokeStyle = shadowColor;
      this.ctx.lineWidth = 4;
      this.ctx.strokeText(label, lx, ly);
      
      this.ctx.fillText(label, lx, ly);
    }

    this.ctx.restore();
  }

  // Draw an angle arc with label
  public drawAngleArc(
    cx: number, cy: number,
    radius: number,
    startDeg: number, endDeg: number,
    color: string,
    label: string
  ): void {
    const center = this.toScreen(cx, cy);
    const startRad = -startDeg * (Math.PI / 180);
    const endRad = -endDeg * (Math.PI / 180);

    this.ctx.save();
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 1.5;

    // Draw arc
    this.ctx.beginPath();
    // In screen coordinates Y is inverted, so sweep direction should align
    // Canvas arc uses clockwise rendering, so we render accordingly
    const anticlockwise = startRad < endRad;
    this.ctx.arc(center.x, center.y, radius, startRad, endRad, anticlockwise);
    this.ctx.stroke();

    // Draw lines to the arc endpoints
    this.ctx.beginPath();
    this.ctx.setLineDash([2, 3]);
    this.ctx.moveTo(center.x, center.y);
    this.ctx.lineTo(center.x + radius * 1.3 * Math.cos(startRad), center.y + radius * 1.3 * Math.sin(startRad));
    this.ctx.moveTo(center.x, center.y);
    this.ctx.lineTo(center.x + radius * 1.3 * Math.cos(endRad), center.y + radius * 1.3 * Math.sin(endRad));
    this.ctx.stroke();

    // Draw label
    if (label) {
      const midAngle = (startRad + endRad) / 2;
      const lx = center.x + (radius + 15) * Math.cos(midAngle);
      const ly = center.y + (radius + 15) * Math.sin(midAngle);

      this.ctx.fillStyle = this.theme === 'dark' ? '#fff' : '#000';
      this.ctx.font = 'italic 11px Outfit, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(label, lx, ly);
    }

    this.ctx.restore();
  }

  // Draw spring
  public drawSpring(
    fx: number, fy: number,
    tx: number, ty: number,
    coils: number = 12,
    radius: number = 10,
    color: string = '#888'
  ): void {
    const from = this.toScreen(fx, fy);
    const to = this.toScreen(tx, ty);

    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    this.ctx.save();
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    this.ctx.translate(from.x, from.y);
    this.ctx.rotate(angle);

    this.ctx.beginPath();
    this.ctx.moveTo(0, 0);

    const leadIn = 15; // Straight wire at start
    const leadOut = 15; // Straight wire at end
    const springLen = len - leadIn - leadOut;

    this.ctx.lineTo(leadIn, 0);

    if (springLen > 0) {
      const step = springLen / coils;
      for (let i = 0; i < coils; i++) {
        const x1 = leadIn + i * step + step / 4;
        const y1 = radius;
        const x2 = leadIn + i * step + (3 * step) / 4;
        const y2 = -radius;
        const x3 = leadIn + (i + 1) * step;
        const y3 = 0;

        this.ctx.lineTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.lineTo(x3, y3);
      }
    }

    this.ctx.lineTo(len, 0);
    this.ctx.stroke();
    this.ctx.restore();
  }

  // Draw pulley
  public drawPulley(
    cx: number, cy: number,
    radius: number,
    rotation: number = 0,
    color: string = '#bbb'
  ): void {
    const center = this.toScreen(cx, cy);
    const r = radius * this.scale;

    this.ctx.save();
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 3;
    this.ctx.fillStyle = this.theme === 'dark' ? '#242428' : '#e0e0e0';

    // Outer wheel
    this.ctx.beginPath();
    this.ctx.arc(center.x, center.y, r, 0, 2 * Math.PI);
    this.ctx.fill();
    this.ctx.stroke();

    // Groove
    this.ctx.lineWidth = 1;
    this.ctx.strokeStyle = this.theme === 'dark' ? '#555' : '#888';
    this.ctx.beginPath();
    this.ctx.arc(center.x, center.y, r - 3, 0, 2 * Math.PI);
    this.ctx.stroke();

    // Center pivot
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(center.x, center.y, r * 0.2, 0, 2 * Math.PI);
    this.ctx.fill();

    // Rotating spokes to show motion
    this.ctx.strokeStyle = this.theme === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
    this.ctx.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) {
      const angle = rotation + (i * Math.PI) / 2;
      this.ctx.beginPath();
      this.ctx.moveTo(center.x, center.y);
      this.ctx.lineTo(center.x + (r - 4) * Math.cos(angle), center.y + (r - 4) * Math.sin(angle));
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  // Draw rotated block
  public drawBlock(
    cx: number, cy: number,
    w: number, h: number,
    angleDeg: number,
    color: string = '#4f46e5',
    massLabel?: string
  ): void {
    const center = this.toScreen(cx, cy);
    const angleRad = -angleDeg * (Math.PI / 180);

    const sw = w * this.scale;
    const sh = h * this.scale;

    this.ctx.save();
    this.ctx.translate(center.x, center.y);
    this.ctx.rotate(angleRad);

    this.ctx.fillStyle = color;
    this.ctx.strokeStyle = this.theme === 'dark' ? '#fff' : '#000';
    this.ctx.lineWidth = 2.5;

    // Draw box centered
    this.ctx.beginPath();
    this.ctx.rect(-sw / 2, -sh / 2, sw, sh);
    this.ctx.fill();
    this.ctx.stroke();

    // Inner detail (diagonal stripes or dark center)
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    this.ctx.fillRect(-sw / 2 + 3, -sh / 2 + 3, sw - 6, sh - 6);

    // Render Mass label (e.g. "5 kg")
    if (massLabel) {
      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 11px Outfit, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(massLabel, 0, 0);
    }

    this.ctx.restore();
  }

  // Draw inclined plane
  public drawIncline(
    cx: number, cy: number,
    w: number, h: number,
    angleDeg: number,
    color: string = '#888'
  ): void {
    const base = this.toScreen(cx - w/2, cy - h/2);
    
    const sw = w * this.scale;
    const sh = sw * Math.tan(angleDeg * (Math.PI / 180));

    this.ctx.save();
    this.ctx.fillStyle = this.theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 2;

    this.ctx.beginPath();
    this.ctx.moveTo(base.x, base.y);
    this.ctx.lineTo(base.x + sw, base.y);
    this.ctx.lineTo(base.x + sw, base.y - sh);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.restore();
  }
}
