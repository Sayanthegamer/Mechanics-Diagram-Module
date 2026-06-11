import { PhysicsCanvas } from '../PhysicsCanvas';
import type { Circuit } from './circuit/circuit';
import type { ICircuitElement } from './circuit/types';

export class CircuitDiagram {
  public pc: PhysicsCanvas;
  public circuit!: Circuit;
  public selectedElementId: string | null = null;
  public hoveredElementId: string | null = null;
  public hoveredNode: number | null = null;

  constructor(pc: PhysicsCanvas) {
    this.pc = pc;
  }

  public setCircuit(circuit: Circuit): void {
    this.circuit = circuit;
  }

  /**
   * Convert circuit coordinates (standard canvas Y-down grid space)
   * to screen coordinates using the PhysicsCanvas origin and scale.
   */
  public toScreen(x: number, y: number): { x: number; y: number } {
    // Dynamic centering of the circuit bounds
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    const activeCircuit = this.circuit;

    if (activeCircuit && activeCircuit.elements.length > 0) {
      for (const elm of activeCircuit.elements) {
        minX = Math.min(minX, elm.x, elm.x2);
        maxX = Math.max(maxX, elm.x, elm.x2);
        minY = Math.min(minY, elm.y, elm.y2);
        maxY = Math.max(maxY, elm.y, elm.y2);
      }
    } else {
      minX = 0; maxX = 200; minY = 0; maxY = 100;
    }

    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    // Use a custom scaling factor aligned with the PhysicsCanvas scale.
    // If the canvas defaults to 50 pixels per unit, grid spacing is doubled.
    const circuitScale = 2.0 * (this.pc.scale / 50);

    return {
      x: this.pc.originX + (x - cx) * circuitScale,
      y: this.pc.originY + (y - cy) * circuitScale
    };
  }

  /**
   * Convert screen coordinates back to circuit coordinates.
   */
  public toGrid(sx: number, sy: number): { x: number; y: number } {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    const activeCircuit = this.circuit;

    if (activeCircuit && activeCircuit.elements.length > 0) {
      for (const elm of activeCircuit.elements) {
        minX = Math.min(minX, elm.x, elm.x2);
        maxX = Math.max(maxX, elm.x, elm.x2);
        minY = Math.min(minY, elm.y, elm.y2);
        maxY = Math.max(maxY, elm.y, elm.y2);
      }
    } else {
      minX = 0; maxX = 200; minY = 0; maxY = 100;
    }

    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    const circuitScale = 2.0 * (this.pc.scale / 50);

    return {
      x: cx + (sx - this.pc.originX) / circuitScale,
      y: cy + (sy - this.pc.originY) / circuitScale
    };
  }


  /**
   * Map voltage potential to continuous gradient color representation.
   * D-02:
   * - Positive Potential (V > 0V): #ef4444 (bright red)
   * - Neutral Potential (V = 0V): #505050 (neutral green/gray)
   * - Negative Potential (V < 0V): #3b82f6 (bright blue)
   */
  public voltageToColor(v: number, voltageRange = 5.0): string {
    if (v === undefined || isNaN(v)) {
      return '#505050';
    }
    const clamped = Math.max(-voltageRange, Math.min(voltageRange, v));
    const t = clamped / voltageRange; // -1..1

    if (t >= 0) {
      // Interpolate between #505050 (rgb 80, 80, 80) and #ef4444 (rgb 239, 68, 68)
      const r = Math.round(80 + (239 - 80) * t);
      const g = Math.round(80 + (68 - 80) * t);
      const b = Math.round(80 + (68 - 80) * t);
      return `rgb(${r},${g},${b})`;
    } else {
      // Interpolate between #505050 (rgb 80, 80, 80) and #3b82f6 (rgb 59, 130, 246)
      const nt = -t; // 0..1
      const r = Math.round(80 + (59 - 80) * nt);
      const g = Math.round(80 + (130 - 80) * nt);
      const b = Math.round(80 + (246 - 80) * nt);
      return `rgb(${r},${g},${b})`;
    }
  }

  /**
   * Draw animated current dots along component paths.
   * D-03: Golden amber color #fbbf24 = rgb(251, 191, 36)
   */
  public drawCurrentDots(
    ctx: CanvasRenderingContext2D,
    x1: number, y1: number,
    x2: number, y2: number,
    current: number,
    time: number,
    zoom: number
  ): void {
    if (Math.abs(current) < 1e-10) return;

    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1) return;

    const nx = dx / len;
    const ny = dy / len;

    // Spacing adaptivity
    const spacing = Math.max(12, 16 / Math.max(zoom, 0.3));
    const count = Math.floor(len / spacing) + 1;
    if (count < 1) return;

    const dir = Math.sign(current);
    const speed = dir * Math.min(Math.abs(current) * 800, 200);
    const offset = ((time * speed) % spacing + spacing) % spacing;

    const dotRadius = Math.max(0.8, 1.2 * Math.min(zoom, 1.5));

    const trailSteps = 6;
    const trailLength = 8;
    const stepDist = trailLength / trailSteps;

    for (let i = 0; i <= count + 1; i++) {
      const d = offset + (i - 1) * spacing;

      for (let t = 0; t < trailSteps; t++) {
        const td = d - dir * stepDist * t;
        if (td < 0 || td > len) continue;

        const trailX = x1 + nx * td;
        const trailY = y1 + ny * td;

        const tRadius = dotRadius * (1 - (t / trailSteps) * 0.7);
        const tAlpha = 0.85 * Math.pow(1 - t / trailSteps, 1.5);

        ctx.beginPath();
        ctx.fillStyle = `rgba(251, 191, 36, ${tAlpha.toFixed(3)})`;
        ctx.arc(trailX, trailY, tRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private drawPost(
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    v: number,
    selected: boolean,
    hovered?: boolean
  ): void {
    const postRadius = 3.5;
    ctx.beginPath();
    ctx.arc(x, y, postRadius, 0, Math.PI * 2);
    ctx.fillStyle = selected ? '#818cf8' : this.voltageToColor(v);
    ctx.fill();
    if (selected || hovered) {
      ctx.strokeStyle = '#a5b4fc';
      ctx.lineWidth = hovered ? 2.5 : 1.5;
      ctx.stroke();
    }
  }

  private drawLead(
    ctx: CanvasRenderingContext2D,
    x1: number, y1: number,
    x2: number, y2: number,
    v: number
  ): void {
    ctx.strokeStyle = this.voltageToColor(v);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  public drawElementHighlight(
    ctx: CanvasRenderingContext2D,
    elm: ICircuitElement,
    selected: boolean,
    hovered: boolean,
    zoom: number
  ): void {
    if (selected) {
      const p1 = this.toScreen(elm.x, elm.y);
      const p2 = this.toScreen(elm.x2, elm.y2);
      ctx.save();
      
      // Draw glowing outline with indigo accent color #6366f1 (D-05)
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 8 * zoom;
      ctx.lineCap = 'round';
      ctx.shadowColor = '#6366f1';
      ctx.shadowBlur = 10 * zoom;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
      
      // Draw dash ring/outline on top of the glow
      ctx.strokeStyle = '#a5b4fc';
      ctx.lineWidth = 1.5 * zoom;
      ctx.setLineDash([4 * zoom, 4 * zoom]);
      ctx.shadowBlur = 0; // reset shadow
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
      
      ctx.restore();
    } else if (hovered) {
      const p1 = this.toScreen(elm.x, elm.y);
      const p2 = this.toScreen(elm.x2, elm.y2);
      ctx.save();
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.15)';
      ctx.lineWidth = 12 * zoom;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
      ctx.restore();
    }
  }

  // ---- Component Renderers ----

  public drawWire(
    ctx: CanvasRenderingContext2D,
    elm: ICircuitElement,
    selected: boolean,
    time: number,
    zoom: number,
    hoveredNode?: number | null
  ): void {
    const p1 = this.toScreen(elm.x, elm.y);
    const p2 = this.toScreen(elm.x2, elm.y2);
    const x1 = p1.x;
    const y1 = p1.y;
    const x2 = p2.x;
    const y2 = p2.y;

    const v = elm.volts[0] || 0;
    ctx.strokeStyle = selected ? '#6366f1' : this.voltageToColor(v);
    ctx.lineWidth = selected ? 3.5 * zoom : 2.5 * zoom;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    this.drawPost(ctx, x1, y1, v, selected, hoveredNode === 0 || hoveredNode === null);
    this.drawPost(ctx, x2, y2, v, selected, hoveredNode === 1 || hoveredNode === null);
    this.drawCurrentDots(ctx, x1, y1, x2, y2, elm.getCurrent(), time, zoom);
  }

  public drawResistor(
    ctx: CanvasRenderingContext2D,
    elm: ICircuitElement,
    selected: boolean,
    time: number,
    zoom: number,
    hoveredNode?: number | null
  ): void {
    const p1 = this.toScreen(elm.x, elm.y);
    const p2 = this.toScreen(elm.x2, elm.y2);
    const x1 = p1.x;
    const y1 = p1.y;
    const x2 = p2.x;
    const y2 = p2.y;

    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1) return;
    const nx = dx / len;
    const ny = dy / len;

    const bodyLen = Math.min(40 * zoom, len * 0.55);
    const leadLen = (len - bodyLen) / 2;

    const bx1 = x1 + nx * leadLen;
    const by1 = y1 + ny * leadLen;
    const bx2 = x2 - nx * leadLen;
    const by2 = y2 - ny * leadLen;

    this.drawLead(ctx, x1, y1, bx1, by1, elm.volts[0] || 0);
    this.drawLead(ctx, bx2, by2, x2, y2, elm.volts[1] || 0);

    const segments = 6;
    const perpX = -ny;
    const perpY = nx;
    const amplitude = 6 * zoom;

    ctx.strokeStyle = selected ? '#6366f1' : '#e0e0e8';
    ctx.lineWidth = 2 * zoom;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(bx1, by1);

    for (let i = 0; i < segments; i++) {
      const t1 = (i + 0.5) / segments;
      const sign = i % 2 === 0 ? 1 : -1;
      const mx = bx1 + (bx2 - bx1) * t1 + perpX * amplitude * sign;
      const my = by1 + (by2 - by1) * t1 + perpY * amplitude * sign;
      ctx.lineTo(mx, my);
      if (i === segments - 1) {
        ctx.lineTo(bx2, by2);
      }
    }
    ctx.stroke();

    this.drawPost(ctx, x1, y1, elm.volts[0] || 0, selected, hoveredNode === 0 || hoveredNode === null);
    this.drawPost(ctx, x2, y2, elm.volts[1] || 0, selected, hoveredNode === 1 || hoveredNode === null);
    this.drawCurrentDots(ctx, x1, y1, x2, y2, elm.getCurrent(), time, zoom);
  }

  public drawVoltageSource(
    ctx: CanvasRenderingContext2D,
    elm: ICircuitElement,
    selected: boolean,
    time: number,
    zoom: number,
    hoveredNode?: number | null
  ): void {
    const p1 = this.toScreen(elm.x, elm.y);
    const p2 = this.toScreen(elm.x2, elm.y2);
    const x1 = p1.x;
    const y1 = p1.y;
    const x2 = p2.x;
    const y2 = p2.y;

    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1) return;
    const nx = dx / len;
    const ny = dy / len;

    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;
    const radius = Math.min(16 * zoom, len * 0.25);
    const leadLen = (len - radius * 2) / 2;

    const lx1 = x1 + nx * leadLen;
    const ly1 = y1 + ny * leadLen;
    const lx2 = x2 - nx * leadLen;
    const ly2 = y2 - ny * leadLen;

    this.drawLead(ctx, x1, y1, lx1, ly1, elm.volts[0] || 0);
    this.drawLead(ctx, lx2, ly2, x2, y2, elm.volts[1] || 0);

    ctx.strokeStyle = selected ? '#6366f1' : '#e0e0e8';
    ctx.lineWidth = 2 * zoom;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    const perpX = -ny;
    const perpY = nx;
    const plusOff = radius * 0.45;
    const plusSize = 4 * zoom;
    const plusX = cx + nx * plusOff;
    const plusY = cy + ny * plusOff;

    ctx.strokeStyle = selected ? '#a5b4fc' : '#22c55e';
    ctx.lineWidth = 1.8 * zoom;
    ctx.beginPath();
    ctx.moveTo(plusX - perpX * plusSize, plusY - perpY * plusSize);
    ctx.lineTo(plusX + perpX * plusSize, plusY + perpY * plusSize);
    ctx.moveTo(plusX - nx * plusSize, plusY - ny * plusSize);
    ctx.lineTo(plusX + nx * plusSize, plusY + ny * plusSize);
    ctx.stroke();

    const minX = cx - nx * plusOff;
    const minY = cy - ny * plusOff;
    ctx.strokeStyle = selected ? '#a5b4fc' : '#ef4444';
    ctx.beginPath();
    ctx.moveTo(minX - perpX * plusSize, minY - perpY * plusSize);
    ctx.lineTo(minX + perpX * plusSize, minY + perpY * plusSize);
    ctx.stroke();

    this.drawPost(ctx, x1, y1, elm.volts[0] || 0, selected, hoveredNode === 0 || hoveredNode === null);
    this.drawPost(ctx, x2, y2, elm.volts[1] || 0, selected, hoveredNode === 1 || hoveredNode === null);
    this.drawCurrentDots(ctx, x1, y1, x2, y2, elm.getCurrent(), time, zoom);
  }

  public drawGround(
    ctx: CanvasRenderingContext2D,
    elm: ICircuitElement,
    selected: boolean,
    _time: number,
    zoom: number,
    hoveredNode?: number | null
  ): void {
    const p = this.toScreen(elm.x, elm.y);
    const x = p.x;
    const y = p.y;
    const size = 12 * zoom;

    this.drawLead(ctx, x, y, x, y + size, 0);

    ctx.strokeStyle = selected ? '#6366f1' : '#888';
    ctx.lineWidth = 2 * zoom;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const w = size - i * 3.5 * zoom;
      const ly = y + size + i * 4 * zoom;
      ctx.beginPath();
      ctx.moveTo(x - w, ly);
      ctx.lineTo(x + w, ly);
      ctx.stroke();
    }

    this.drawPost(ctx, x, y, 0, selected, hoveredNode === 0 || hoveredNode === null);
  }

  public drawCapacitor(
    ctx: CanvasRenderingContext2D,
    elm: ICircuitElement,
    selected: boolean,
    time: number,
    zoom: number,
    hoveredNode?: number | null
  ): void {
    const p1 = this.toScreen(elm.x, elm.y);
    const p2 = this.toScreen(elm.x2, elm.y2);
    const x1 = p1.x;
    const y1 = p1.y;
    const x2 = p2.x;
    const y2 = p2.y;

    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1) return;
    const nx = dx / len;
    const ny = dy / len;

    const gap = 6 * zoom;
    const plateSize = 10 * zoom;
    const leadLen = (len - gap) / 2;

    const bx1 = x1 + nx * leadLen;
    const by1 = y1 + ny * leadLen;
    const bx2 = x2 - nx * leadLen;
    const by2 = y2 - ny * leadLen;

    this.drawLead(ctx, x1, y1, bx1, by1, elm.volts[0] || 0);
    this.drawLead(ctx, bx2, by2, x2, y2, elm.volts[1] || 0);

    const perpX = -ny;
    const perpY = nx;

    ctx.strokeStyle = selected ? '#6366f1' : '#e0e0e8';
    ctx.lineWidth = 3 * zoom;
    ctx.lineCap = 'butt';
    ctx.beginPath();

    // Plate 1
    ctx.moveTo(bx1 - perpX * plateSize, by1 - perpY * plateSize);
    ctx.lineTo(bx1 + perpX * plateSize, by1 + perpY * plateSize);

    // Plate 2
    ctx.moveTo(bx2 - perpX * plateSize, by2 - perpY * plateSize);
    ctx.lineTo(bx2 + perpX * plateSize, by2 + perpY * plateSize);
    ctx.stroke();

    this.drawPost(ctx, x1, y1, elm.volts[0] || 0, selected, hoveredNode === 0 || hoveredNode === null);
    this.drawPost(ctx, x2, y2, elm.volts[1] || 0, selected, hoveredNode === 1 || hoveredNode === null);
    this.drawCurrentDots(ctx, x1, y1, x2, y2, elm.getCurrent(), time, zoom);
  }

  public drawInductor(
    ctx: CanvasRenderingContext2D,
    elm: ICircuitElement,
    selected: boolean,
    time: number,
    zoom: number,
    hoveredNode?: number | null
  ): void {
    const p1 = this.toScreen(elm.x, elm.y);
    const p2 = this.toScreen(elm.x2, elm.y2);
    const x1 = p1.x;
    const y1 = p1.y;
    const x2 = p2.x;
    const y2 = p2.y;

    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1) return;
    const nx = dx / len;
    const ny = dy / len;

    const bodyLen = Math.min(40 * zoom, len * 0.55);
    const leadLen = (len - bodyLen) / 2;

    const bx1 = x1 + nx * leadLen;
    const by1 = y1 + ny * leadLen;
    const bx2 = x2 - nx * leadLen;
    const by2 = y2 - ny * leadLen;

    this.drawLead(ctx, x1, y1, bx1, by1, elm.volts[0] || 0);
    this.drawLead(ctx, bx2, by2, x2, y2, elm.volts[1] || 0);

    const coils = 4;
    const coilLen = bodyLen / coils;
    const coilRad = 6 * zoom;
    const perpX = -ny;
    const perpY = nx;

    ctx.strokeStyle = selected ? '#6366f1' : '#e0e0e8';
    ctx.lineWidth = 2 * zoom;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(bx1, by1);

    for (let i = 0; i < coils; i++) {
      const cx1 = bx1 + nx * (i * coilLen + coilLen * 0.25);
      const cy1 = by1 + ny * (i * coilLen + coilLen * 0.25);
      const cx2 = bx1 + nx * (i * coilLen + coilLen * 0.75);
      const cy2 = by1 + ny * (i * coilLen + coilLen * 0.75);
      const endX = bx1 + nx * ((i + 1) * coilLen);
      const endY = by1 + ny * ((i + 1) * coilLen);

      ctx.bezierCurveTo(
        cx1 + perpX * coilRad * 2, cy1 + perpY * coilRad * 2,
        cx2 + perpX * coilRad * 2, cy2 + perpY * coilRad * 2,
        endX, endY
      );
    }
    ctx.stroke();

    this.drawPost(ctx, x1, y1, elm.volts[0] || 0, selected, hoveredNode === 0 || hoveredNode === null);
    this.drawPost(ctx, x2, y2, elm.volts[1] || 0, selected, hoveredNode === 1 || hoveredNode === null);
    this.drawCurrentDots(ctx, x1, y1, x2, y2, elm.getCurrent(), time, zoom);
  }

  public drawSwitch(
    ctx: CanvasRenderingContext2D,
    elm: ICircuitElement,
    selected: boolean,
    time: number,
    zoom: number,
    hoveredNode?: number | null
  ): void {
    const p1 = this.toScreen(elm.x, elm.y);
    const p2 = this.toScreen(elm.x2, elm.y2);
    const x1 = p1.x;
    const y1 = p1.y;
    const x2 = p2.x;
    const y2 = p2.y;

    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1) return;
    const nx = dx / len;
    const ny = dy / len;

    const gap = 16 * zoom;
    const leadLen = (len - gap) / 2;

    const bx1 = x1 + nx * leadLen;
    const by1 = y1 + ny * leadLen;
    const bx2 = x2 - nx * leadLen;
    const by2 = y2 - ny * leadLen;

    this.drawLead(ctx, x1, y1, bx1, by1, elm.volts[0] || 0);
    this.drawLead(ctx, bx2, by2, x2, y2, elm.volts[1] || 0);

    const closed = !!(elm as any).closed;
    ctx.strokeStyle = selected ? '#6366f1' : '#e0e0e8';
    ctx.lineWidth = 2.5 * zoom;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(bx1, by1);

    if (closed) {
      ctx.lineTo(bx2, by2);
    } else {
      const angle = Math.PI / 6;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      const px = gap * nx;
      const py = gap * ny;

      const openX = bx1 + px * cosA - py * sinA;
      const openY = by1 + px * sinA + py * cosA;

      ctx.lineTo(openX, openY);
    }
    ctx.stroke();

    ctx.fillStyle = selected ? '#6366f1' : '#e0e0e8';
    ctx.beginPath();
    ctx.arc(bx1, by1, 3 * zoom, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(bx2, by2, 3 * zoom, 0, Math.PI * 2);
    ctx.fill();

    this.drawPost(ctx, x1, y1, elm.volts[0] || 0, selected, hoveredNode === 0 || hoveredNode === null);
    this.drawPost(ctx, x2, y2, elm.volts[1] || 0, selected, hoveredNode === 1 || hoveredNode === null);
    if (closed) {
      this.drawCurrentDots(ctx, x1, y1, x2, y2, elm.getCurrent(), time, zoom);
    }
  }

  // ---- Main Draw Dispatcher ----

  public draw(
    circuit?: Circuit,
    selectedElementId?: string | null,
    hoveredElementId?: string | null,
    hoveredNode?: number | null
  ): void {
    const activeCircuit = circuit || this.circuit;
    if (!activeCircuit) return;

    const ctx = this.pc.ctx;
    const zoom = 2.0 * (this.pc.scale / 50);

    // 1. Draw element highlights
    for (const elm of activeCircuit.elements) {
      const isSelected = elm.id === selectedElementId;
      const isHovered = elm.id === hoveredElementId && hoveredNode === null;
      this.drawElementHighlight(ctx, elm, isSelected, isHovered, zoom);
    }

    // 2. Draw standard elements
    for (const elm of activeCircuit.elements) {
      const isSelected = elm.id === selectedElementId;
      const nodeHover = elm.id === hoveredElementId ? hoveredNode : null;

      switch (elm.type) {
        case 'wire':
          this.drawWire(ctx, elm, isSelected, activeCircuit.t, zoom, nodeHover);
          break;
        case 'resistor':
          this.drawResistor(ctx, elm, isSelected, activeCircuit.t, zoom, nodeHover);
          break;
        case 'voltage':
          this.drawVoltageSource(ctx, elm, isSelected, activeCircuit.t, zoom, nodeHover);
          break;
        case 'ground':
          this.drawGround(ctx, elm, isSelected, activeCircuit.t, zoom, nodeHover);
          break;
        case 'capacitor':
          this.drawCapacitor(ctx, elm, isSelected, activeCircuit.t, zoom, nodeHover);
          break;
        case 'inductor':
          this.drawInductor(ctx, elm, isSelected, activeCircuit.t, zoom, nodeHover);
          break;
        case 'switch':
          this.drawSwitch(ctx, elm, isSelected, activeCircuit.t, zoom, nodeHover);
          break;
        default: {
          // Fallback line rendering
          const p1 = this.toScreen(elm.x, elm.y);
          const p2 = this.toScreen(elm.x2, elm.y2);
          this.drawLead(ctx, p1.x, p1.y, p2.x, p2.y, elm.volts[0] || 0);
          this.drawPost(ctx, p1.x, p1.y, elm.volts[0] || 0, isSelected, nodeHover === 0 || nodeHover === null);
          this.drawPost(ctx, p2.x, p2.y, elm.volts[1] || 0, isSelected, nodeHover === 1 || nodeHover === null);
          this.drawCurrentDots(ctx, p1.x, p1.y, p2.x, p2.y, elm.getCurrent(), activeCircuit.t, zoom);
        }
      }
    }
  }
}
