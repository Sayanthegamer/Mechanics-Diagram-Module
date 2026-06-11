import type { ShmState } from './ShmDiagram';
import type { FbdState } from './FbdDiagram';
import type { FluidsState } from './FluidsDiagram';
import type { ThermoDiagram } from './ThermoDiagram';

export type GraphMode = 'kinematics' | 'energy' | 'phase-space' | 'pv-diagram' | 'ts-diagram' | 'oscilloscope-yt' | 'oscilloscope-xy';

export interface EnergyStatePoint {
  t: number;
  kineticEnergy: number;
  potentialEnergy: number;
  totalEnergy: number;
  x?: number;
  v?: number;
  p?: number;
}

export class GraphModule {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  public theme: 'light' | 'dark' = 'dark';
  public mode: GraphMode = 'kinematics';

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not get 2D context for graph');
    this.ctx = context;
    this.resize();
  }

  public resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.resetTransform();
    this.ctx.scale(dpr, dpr);
  }

  public checkResize(): void {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const expectedWidth = Math.floor(rect.width * dpr);
    const expectedHeight = Math.floor(rect.height * dpr);
    
    if (this.canvas.width !== expectedWidth || this.canvas.height !== expectedHeight) {
      this.resize();
    }
  }

  public clear(): void {
    this.checkResize();
    this.ctx.clearRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
  }

  // Draw real-time plot
  public draw(history: EnergyStatePoint[]): void {
    this.clear();
    if (history.length < 2) return;

    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;

    
    // Grid colors
    const axisColor = this.theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';
    const gridColor = this.theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
    const textColor = this.theme === 'dark' ? '#888' : '#666';

    const padding = { top: 25, right: 20, bottom: 25, left: 45 };
    const graphWidth = width - padding.left - padding.right;
    const graphHeight = height - padding.top - padding.bottom;

    if (this.mode === 'phase-space') {
      this.drawPhaseSpace(history as ShmState[], graphWidth, graphHeight, padding, axisColor, gridColor, textColor);
      return;
    }

    // Determine Y scale bounds dynamically from history
    let yMin = Infinity;
    let yMax = -Infinity;

    if (this.mode === 'energy') {
      history.forEach((d) => {
        yMin = Math.min(yMin, d.kineticEnergy, d.potentialEnergy, d.totalEnergy);
        yMax = Math.max(yMax, d.kineticEnergy, d.potentialEnergy, d.totalEnergy);
      });
    } else {
      // kinematics (plots x and v)
      history.forEach((d) => {
        yMin = Math.min(yMin, d.x ?? 0, d.v ?? 0);
        yMax = Math.max(yMax, d.x ?? 0, d.v ?? 0);
      });
    }

    // Add small buffer to top/bottom
    const yRange = yMax - yMin;
    if (yRange < 0.01) {
      yMin -= 0.5;
      yMax += 0.5;
    } else {
      yMin -= yRange * 0.1;
      yMax += yRange * 0.1;
    }

    // X axis bounds
    const xMin = history[0].t;
    const xMax = history[history.length - 1].t;
    const xRange = xMax - xMin;

    const getXScreen = (t: number) => {
      return padding.left + ((t - xMin) / xRange) * graphWidth;
    };

    const getYScreen = (val: number) => {
      return padding.top + (1.0 - (val - yMin) / (yMax - yMin)) * graphHeight;
    };

    this.ctx.save();

    // 1. Draw Grid
    this.ctx.strokeStyle = gridColor;
    this.ctx.lineWidth = 1;
    
    // Draw Y grid lines (3 divisions)
    for (let i = 0; i <= 4; i++) {
      const val = yMin + (i / 4) * (yMax - yMin);
      const sy = getYScreen(val);

      this.ctx.beginPath();
      this.ctx.moveTo(padding.left, sy);
      this.ctx.lineTo(width - padding.right, sy);
      this.ctx.stroke();

      // Label
      this.ctx.fillStyle = textColor;
      this.ctx.font = '9px Outfit, sans-serif';
      this.ctx.textAlign = 'right';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(val.toFixed(2), padding.left - 8, sy);
    }

    // 2. Draw axes borders
    this.ctx.strokeStyle = axisColor;
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.moveTo(padding.left, padding.top);
    this.ctx.lineTo(padding.left, height - padding.bottom);
    this.ctx.lineTo(width - padding.right, height - padding.bottom);
    this.ctx.stroke();

    // Draw equilibrium zero axis line if it's within bounds
    if (yMin < 0 && yMax > 0) {
      const zeroY = getYScreen(0);
      this.ctx.strokeStyle = this.theme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';
      this.ctx.beginPath();
      this.ctx.moveTo(padding.left, zeroY);
      this.ctx.lineTo(width - padding.right, zeroY);
      this.ctx.stroke();
    }

    // 3. Plot curves
    const plotCurve = (
      getField: (s: EnergyStatePoint) => number,
      color: string,
      label: string,
      legendIdx: number
    ) => {
      this.ctx.save();
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();

      history.forEach((d, idx) => {
        const sx = getXScreen(d.t);
        const sy = getYScreen(getField(d));
        if (idx === 0) this.ctx.moveTo(sx, sy);
        else this.ctx.lineTo(sx, sy);
      });
      this.ctx.stroke();

      // Legend draw
      const legendX = padding.left + legendIdx * 90;
      const legendY = padding.top - 12;

      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.arc(legendX, legendY, 4, 0, 2 * Math.PI);
      this.ctx.fill();

      this.ctx.fillStyle = this.theme === 'dark' ? '#eee' : '#333';
      this.ctx.font = 'bold 10px Outfit, sans-serif';
      this.ctx.textAlign = 'left';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(label, legendX + 8, legendY);
      this.ctx.restore();
    };

    if (this.mode === 'energy') {
      plotCurve((d) => d.kineticEnergy, '#10b981', 'Kinetic (KE)', 0);
      plotCurve((d) => d.potentialEnergy, '#3b82f6', 'Potential (PE)', 1);
      plotCurve((d) => d.totalEnergy, '#ef4444', 'Total Energy', 2);
    } else {
      plotCurve((d) => d.x ?? 0, '#f59e0b', 'Position (x)', 0);
      plotCurve((d) => d.v ?? 0, '#10b981', 'Velocity (v)', 1);
    }

    this.ctx.restore();
  }

  // Draw Phase Space Plot (Velocity vs Position)
  private drawPhaseSpace(
    history: ShmState[],
    graphWidth: number,
    graphHeight: number,
    padding: { top: number; right: number; bottom: number; left: number },
    axisColor: string,
    gridColor: string,
    textColor: string
  ): void {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;

    // Bounds
    let xMin = Infinity;
    let xMax = -Infinity;
    let vMin = Infinity;
    let vMax = -Infinity;

    history.forEach((d) => {
      xMin = Math.min(xMin, d.x);
      xMax = Math.max(xMax, d.x);
      vMin = Math.min(vMin, d.v);
      vMax = Math.max(vMax, d.v);
    });

    const xRange = xMax - xMin;
    const vRange = vMax - vMin;

    if (xRange < 0.01) { xMin -= 0.5; xMax += 0.5; }
    else { xMin -= xRange * 0.15; xMax += xRange * 0.15; }

    if (vRange < 0.01) { vMin -= 0.5; vMax += 0.5; }
    else { vMin -= vRange * 0.15; vMax += vRange * 0.15; }

    const getXScreen = (xVal: number) => {
      return padding.left + ((xVal - xMin) / (xMax - xMin)) * graphWidth;
    };

    const getYScreen = (vVal: number) => {
      return padding.top + (1.0 - (vVal - vMin) / (vMax - vMin)) * graphHeight;
    };

    this.ctx.save();

    // 1. Draw Grid Lines
    this.ctx.strokeStyle = gridColor;
    this.ctx.lineWidth = 1;

    // X divisions
    for (let i = 0; i <= 4; i++) {
      const xVal = xMin + (i / 4) * (xMax - xMin);
      const sx = getXScreen(xVal);
      this.ctx.beginPath();
      this.ctx.moveTo(sx, padding.top);
      this.ctx.lineTo(sx, height - padding.bottom);
      this.ctx.stroke();

      // Label X
      this.ctx.fillStyle = textColor;
      this.ctx.font = '9px Outfit, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'top';
      this.ctx.fillText(xVal.toFixed(2), sx, height - padding.bottom + 6);
    }

    // Y divisions
    for (let i = 0; i <= 4; i++) {
      const vVal = vMin + (i / 4) * (vMax - vMin);
      const sy = getYScreen(vVal);
      this.ctx.beginPath();
      this.ctx.moveTo(padding.left, sy);
      this.ctx.lineTo(width - padding.right, sy);
      this.ctx.stroke();

      // Label Y
      this.ctx.textAlign = 'right';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(vVal.toFixed(2), padding.left - 8, sy);
    }

    // 2. Main axes crossing in center (or at 0, 0)
    this.ctx.strokeStyle = axisColor;
    this.ctx.lineWidth = 1.5;

    // X axis (v = 0 line)
    if (vMin < 0 && vMax > 0) {
      const vZero = getYScreen(0);
      this.ctx.beginPath();
      this.ctx.moveTo(padding.left, vZero);
      this.ctx.lineTo(width - padding.right, vZero);
      this.ctx.stroke();
    }

    // Y axis (x = 0 line)
    if (xMin < 0 && xMax > 0) {
      const xZero = getXScreen(0);
      this.ctx.beginPath();
      this.ctx.moveTo(xZero, padding.top);
      this.ctx.lineTo(xZero, height - padding.bottom);
      this.ctx.stroke();
    }

    // Axis Labels
    this.ctx.fillStyle = this.theme === 'dark' ? '#eee' : '#333';
    this.ctx.font = 'bold 10px Outfit, sans-serif';
    
    // Y Axis Label (Velocity)
    this.ctx.textAlign = 'left';
    this.ctx.fillText('Velocity (v)', padding.left + 5, padding.top - 12);
    // X Axis Label (Position)
    this.ctx.textAlign = 'right';
    this.ctx.fillText('Position (x)', width - padding.right, height - padding.bottom - 12);

    // 3. Plot Trajectory Line (damped spirals or closed ellipses)
    this.ctx.strokeStyle = '#a855f7'; // purple phase trail
    this.ctx.lineWidth = 2.0;
    this.ctx.beginPath();
    history.forEach((d, idx) => {
      const sx = getXScreen(d.x);
      const sy = getYScreen(d.v);
      if (idx === 0) this.ctx.moveTo(sx, sy);
      else this.ctx.lineTo(sx, sy);
    });
    this.ctx.stroke();

    // Draw current state dot at the tip of history
    const last = history[history.length - 1];
    const sLastX = getXScreen(last.x);
    const sLastY = getYScreen(last.v);
    
    this.ctx.fillStyle = '#ef4444'; // red dot for current state
    this.ctx.beginPath();
    this.ctx.arc(sLastX, sLastY, 5, 0, 2 * Math.PI);
    this.ctx.fill();

    this.ctx.restore();
  }

  // Draw FBD real-time graph (position, velocity, acceleration vs time)
  public drawFbd(history: FbdState[]): void {
    this.clear();
    if (history.length < 2) return;

    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;

    const axisColor = this.theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';
    const gridColor = this.theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
    const textColor = this.theme === 'dark' ? '#888' : '#666';

    const padding = { top: 25, right: 20, bottom: 25, left: 45 };
    const graphWidth = width - padding.left - padding.right;
    const graphHeight = height - padding.top - padding.bottom;

    // Determine Y scale bounds dynamically
    let yMin = Infinity;
    let yMax = -Infinity;

    history.forEach((d) => {
      yMin = Math.min(yMin, d.x, d.v, d.a);
      yMax = Math.max(yMax, d.x, d.v, d.a);
    });

    const yRange = yMax - yMin;
    if (yRange < 0.01) {
      yMin -= 0.5;
      yMax += 0.5;
    } else {
      yMin -= yRange * 0.1;
      yMax += yRange * 0.1;
    }

    const xMin = history[0].t;
    const xMax = history[history.length - 1].t;
    const xRange = xMax - xMin;

    const getXScreen = (t: number) => {
      return padding.left + ((t - xMin) / xRange) * graphWidth;
    };

    const getYScreen = (val: number) => {
      return padding.top + (1.0 - (val - yMin) / (yMax - yMin)) * graphHeight;
    };

    this.ctx.save();

    // Grid
    this.ctx.strokeStyle = gridColor;
    this.ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const val = yMin + (i / 4) * (yMax - yMin);
      const sy = getYScreen(val);
      this.ctx.beginPath();
      this.ctx.moveTo(padding.left, sy);
      this.ctx.lineTo(width - padding.right, sy);
      this.ctx.stroke();

      this.ctx.fillStyle = textColor;
      this.ctx.font = '9px Outfit, sans-serif';
      this.ctx.textAlign = 'right';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(val.toFixed(1), padding.left - 8, sy);
    }

    // Axes border
    this.ctx.strokeStyle = axisColor;
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.moveTo(padding.left, padding.top);
    this.ctx.lineTo(padding.left, height - padding.bottom);
    this.ctx.lineTo(width - padding.right, height - padding.bottom);
    this.ctx.stroke();

    // Zero line
    if (yMin < 0 && yMax > 0) {
      const zeroY = getYScreen(0);
      this.ctx.strokeStyle = this.theme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';
      this.ctx.beginPath();
      this.ctx.moveTo(padding.left, zeroY);
      this.ctx.lineTo(width - padding.right, zeroY);
      this.ctx.stroke();
    }

    // Plot curves helper
    const plotCurve = (
      getField: (s: FbdState) => number,
      color: string,
      label: string,
      legendIdx: number
    ) => {
      this.ctx.save();
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();

      history.forEach((d, idx) => {
        const sx = getXScreen(d.t);
        const sy = getYScreen(getField(d));
        if (idx === 0) this.ctx.moveTo(sx, sy);
        else this.ctx.lineTo(sx, sy);
      });
      this.ctx.stroke();

      // Legend
      const legendX = padding.left + legendIdx * 110;
      const legendY = padding.top - 12;

      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.arc(legendX, legendY, 4, 0, 2 * Math.PI);
      this.ctx.fill();

      this.ctx.fillStyle = this.theme === 'dark' ? '#eee' : '#333';
      this.ctx.font = 'bold 10px Outfit, sans-serif';
      this.ctx.textAlign = 'left';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(label, legendX + 8, legendY);
      this.ctx.restore();
    };

    plotCurve((d) => d.x, '#f59e0b', 'Position (x)', 0);
    plotCurve((d) => d.v, '#22d3ee', 'Velocity (v)', 1);
    plotCurve((d) => d.a, '#ef4444', 'Accel (a)', 2);

    this.ctx.restore();
  }

  // Draw Fluids real-time graph (blockY, blockVy, pressureGauge in kPa vs time)
  public drawFluids(history: FluidsState[], mode: 'buoyancy' | 'pascal' | 'bernoulli' | 'viscosity' = 'buoyancy'): void {
    this.clear();
    if (history.length < 2) return;

    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;

    const axisColor = this.theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';
    const gridColor = this.theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
    const textColor = this.theme === 'dark' ? '#888' : '#666';

    const padding = { top: 25, right: 20, bottom: 25, left: 45 };
    const graphWidth = width - padding.left - padding.right;
    const graphHeight = height - padding.top - padding.bottom;

    // Determine scale bounds dynamically based on active mode
    let yMin = Infinity;
    let yMax = -Infinity;

    if (mode === 'buoyancy') {
      history.forEach((d) => {
        const pKpa = d.pressureGauge / 1000 - 101.3;
        yMin = Math.min(yMin, d.blockY, d.blockVy, pKpa);
        yMax = Math.max(yMax, d.blockY, d.blockVy, pKpa);
      });
    } else if (mode === 'pascal') {
      history.forEach((d) => {
        const pKpa = d.pressureGauge / 1000 - 101.3;
        yMin = Math.min(yMin, d.piston1Y ?? 0, d.piston2Y ?? 0, pKpa);
        yMax = Math.max(yMax, d.piston1Y ?? 0, d.piston2Y ?? 0, pKpa);
      });
    } else if (mode === 'bernoulli') {
      history.forEach((d) => {
        yMin = Math.min(yMin, d.v1 ?? 0, d.v2 ?? 0, d.deltaP ?? 0);
        yMax = Math.max(yMax, d.v1 ?? 0, d.v2 ?? 0, d.deltaP ?? 0);
      });
    } else if (mode === 'viscosity') {
      history.forEach((d) => {
        const speed = Math.abs(d.sphereVy ?? 0);
        yMin = Math.min(yMin, d.sphereY ?? 0, speed, d.terminalVy ?? 0);
        yMax = Math.max(yMax, d.sphereY ?? 0, speed, d.terminalVy ?? 0);
      });
    }

    const yRange = yMax - yMin;
    if (yRange < 0.01) {
      yMin -= 0.5;
      yMax += 0.5;
    } else {
      yMin -= yRange * 0.1;
      yMax += yRange * 0.1;
    }

    const xMin = history[0].t;
    const xMax = history[history.length - 1].t;
    const xRange = xMax - xMin;

    const getXScreen = (t: number) => {
      return padding.left + ((t - xMin) / xRange) * graphWidth;
    };

    const getYScreen = (val: number) => {
      return padding.top + (1.0 - (val - yMin) / (yMax - yMin)) * graphHeight;
    };

    this.ctx.save();

    // Grid
    this.ctx.strokeStyle = gridColor;
    this.ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const val = yMin + (i / 4) * (yMax - yMin);
      const sy = getYScreen(val);
      this.ctx.beginPath();
      this.ctx.moveTo(padding.left, sy);
      this.ctx.lineTo(width - padding.right, sy);
      this.ctx.stroke();

      this.ctx.fillStyle = textColor;
      this.ctx.font = '9px Outfit, sans-serif';
      this.ctx.textAlign = 'right';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(val.toFixed(1), padding.left - 8, sy);
    }

    // Axes border
    this.ctx.strokeStyle = axisColor;
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.moveTo(padding.left, padding.top);
    this.ctx.lineTo(padding.left, height - padding.bottom);
    this.ctx.lineTo(width - padding.right, height - padding.bottom);
    this.ctx.stroke();

    // Zero line
    if (yMin < 0 && yMax > 0) {
      const zeroY = getYScreen(0);
      this.ctx.strokeStyle = this.theme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';
      this.ctx.beginPath();
      this.ctx.moveTo(padding.left, zeroY);
      this.ctx.lineTo(width - padding.right, zeroY);
      this.ctx.stroke();
    }

    // Plot curves helper
    const plotCurve = (
      getField: (s: FluidsState) => number,
      color: string,
      label: string,
      legendIdx: number
    ) => {
      this.ctx.save();
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();

      history.forEach((d, idx) => {
        const sx = getXScreen(d.t);
        const sy = getYScreen(getField(d));
        if (idx === 0) this.ctx.moveTo(sx, sy);
        else this.ctx.lineTo(sx, sy);
      });
      this.ctx.stroke();

      // Legend
      const legendX = padding.left + legendIdx * 125;
      const legendY = padding.top - 12;

      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.arc(legendX, legendY, 4, 0, 2 * Math.PI);
      this.ctx.fill();

      this.ctx.fillStyle = this.theme === 'dark' ? '#eee' : '#333';
      this.ctx.font = 'bold 9px Outfit, sans-serif';
      this.ctx.textAlign = 'left';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(label, legendX + 8, legendY);
      this.ctx.restore();
    };

    if (mode === 'buoyancy') {
      plotCurve((d) => d.blockY, '#f59e0b', 'Block Y (m)', 0);
      plotCurve((d) => d.blockVy, '#22d3ee', 'Velocity Y (m/s)', 1);
      plotCurve((d) => d.pressureGauge / 1000 - 101.3, '#8b5cf6', 'Gauge P (kPa)', 2);
    } else if (mode === 'pascal') {
      plotCurve((d) => d.piston1Y ?? 0, '#f59e0b', 'Piston 1 Y (m)', 0);
      plotCurve((d) => d.piston2Y ?? 0, '#22d3ee', 'Piston 2 Y (m)', 1);
      plotCurve((d) => d.pressureGauge / 1000 - 101.3, '#8b5cf6', 'Fluid P (kPa)', 2);
    } else if (mode === 'bernoulli') {
      plotCurve((d) => d.v1 ?? 0, '#f59e0b', 'Inlet Speed v1 (m/s)', 0);
      plotCurve((d) => d.v2 ?? 0, '#22d3ee', 'Throat Speed v2 (m/s)', 1);
      plotCurve((d) => d.deltaP ?? 0, '#8b5cf6', 'Press Drop ΔP (kPa)', 2);
    } else if (mode === 'viscosity') {
      plotCurve((d) => d.sphereY ?? 0, '#f59e0b', 'Sphere Pos Y (m)', 0);
      plotCurve((d) => Math.abs(d.sphereVy ?? 0), '#22d3ee', 'Sphere Speed (m/s)', 1);
      plotCurve((d) => d.terminalVy ?? 0, '#8b5cf6', 'Terminal vt (m/s)', 2);
    }

    this.ctx.restore();
  }

  public drawThermo(diagram: ThermoDiagram): void {
    this.clear();

    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;

    const axisColor = this.theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';
    const gridColor = this.theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
    const textColor = this.theme === 'dark' ? '#888' : '#666';

    const padding = { top: 25, right: 20, bottom: 25, left: 45 };
    const graphWidth = width - padding.left - padding.right;
    const graphHeight = height - padding.top - padding.bottom;

    const mode = diagram.config?.mode || 'kinetic-theory';

    this.ctx.save();

    if (mode === 'kinetic-theory') {
      // 1. Particle Speed Histogram Binning (20 bins)
      const B = 20;
      const vMax = 8.0; // Capturing typical speed range
      const w = vMax / B;

      const countsA = new Array(B).fill(0);
      const countsB = new Array(B).fill(0);
      let nA = 0;
      let nB = 0;

      for (const p of diagram.particles) {
        const v = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        const b = Math.max(0, Math.min(B - 1, Math.floor((v / vMax) * B)));
        if (p.species === 'A') {
          countsA[b]++;
          nA++;
        } else {
          countsB[b]++;
          nB++;
        }
      }

      // Calculate experimental probability densities
      const P_A = new Array(B).fill(0);
      const P_B = new Array(B).fill(0);
      let maxDensity = 0.5;

      for (let b = 0; b < B; b++) {
        if (nA > 0) {
          P_A[b] = countsA[b] / (nA * w);
          maxDensity = Math.max(maxDensity, P_A[b]);
        }
        if (nB > 0) {
          P_B[b] = countsB[b] / (nB * w);
          maxDensity = Math.max(maxDensity, P_B[b]);
        }
      }

      // Theoretical Rayleigh distribution peak calculations
      const T = diagram.temperature;
      if (T > 0.01) {
        // Peak of Rayleigh is at v_peak = sqrt(T / m). Peak value: sqrt(m/T)*exp(-0.5)
        const peakValA = Math.sqrt(4.0 / T) * Math.exp(-0.5); // m=4.0
        const peakValB = Math.sqrt(1.0 / T) * Math.exp(-0.5); // m=1.0
        maxDensity = Math.max(maxDensity, peakValA, peakValB);
      }

      const yMax = maxDensity * 1.15;

      // Draw Y grid lines
      this.ctx.strokeStyle = gridColor;
      this.ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const val = (i / 4) * yMax;
        const sy = padding.top + (1.0 - i / 4) * graphHeight;
        this.ctx.beginPath();
        this.ctx.moveTo(padding.left, sy);
        this.ctx.lineTo(width - padding.right, sy);
        this.ctx.stroke();

        this.ctx.fillStyle = textColor;
        this.ctx.font = '9px Outfit, sans-serif';
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(val.toFixed(2), padding.left - 8, sy);
      }

      // Draw X grid lines / speed labels
      for (let i = 0; i <= 5; i++) {
        const speedVal = (i / 5) * vMax;
        const sx = padding.left + (i / 5) * graphWidth;
        this.ctx.beginPath();
        this.ctx.moveTo(sx, padding.top);
        this.ctx.lineTo(sx, height - padding.bottom);
        this.ctx.stroke();

        this.ctx.fillStyle = textColor;
        this.ctx.font = '9px Outfit, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText(speedVal.toFixed(1), sx, height - padding.bottom + 6);
      }

      // Draw binned histograms
      const barW = graphWidth / B - 1.5;
      for (let b = 0; b < B; b++) {
        const sx = padding.left + (b / B) * graphWidth;
        
        // Species A: Heavy (Red)
        if (nA > 0 && P_A[b] > 0) {
          const barH = (P_A[b] / yMax) * graphHeight;
          this.ctx.fillStyle = 'rgba(239, 68, 68, 0.28)';
          this.ctx.fillRect(sx, padding.top + graphHeight - barH, barW, barH);
        }

        // Species B: Light (Blue)
        if (nB > 0 && P_B[b] > 0) {
          const barH = (P_B[b] / yMax) * graphHeight;
          this.ctx.fillStyle = 'rgba(59, 130, 246, 0.28)';
          this.ctx.fillRect(sx, padding.top + graphHeight - barH, barW, barH);
        }
      }

      // Plot Theoretical Rayleigh Distribution Curves
      if (T > 0.01) {
        const drawRayleighCurve = (m: number, color: string) => {
          this.ctx.beginPath();
          this.ctx.strokeStyle = color;
          this.ctx.lineWidth = 2.0;

          let first = true;
          for (let v = 0; v <= vMax; v += 0.08) {
            // f(v) = m * v / T * exp(-m * v^2 / 2T)
            const fVal = (m * v / T) * Math.exp(-m * v * v / (2 * T));
            const sx = padding.left + (v / vMax) * graphWidth;
            const sy = padding.top + (1.0 - fVal / yMax) * graphHeight;

            if (first) {
              this.ctx.moveTo(sx, sy);
              first = false;
            } else {
              this.ctx.lineTo(sx, sy);
            }
          }
          this.ctx.stroke();
        };

        // Species A: Red m=4.0
        drawRayleighCurve(4.0, '#ef4444');
        // Species B: Blue m=1.0
        drawRayleighCurve(1.0, '#3b82f6');
      }

      // Render legend
      const drawLegendItem = (label: string, color: string, idx: number) => {
        const lx = padding.left + idx * 110;
        const ly = padding.top - 12;
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(lx, ly, 4, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.fillStyle = this.theme === 'dark' ? '#eee' : '#333';
        this.ctx.font = 'bold 9px Outfit, sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(label, lx + 8, ly);
      };
      drawLegendItem('Heavy Species (A)', '#ef4444', 0);
      drawLegendItem('Light Species (B)', '#3b82f6', 1);
    } else if (mode === 'piston-engine') {
      if (this.mode === 'ts-diagram') {
        // 2b. Temperature-Entropy (TS) Diagram
        let sMin = 2.5;
        let sMax = 3.5;
        let tMin = 2.0;
        let tMax = 7.0;

        const sVals: number[] = [];
        const tVals: number[] = [];

        const calcEntropy = (t: number, v: number) => {
          const safeT = Math.max(0.1, t);
          const safeV = Math.max(0.1, v);
          return 1.5 * Math.log(safeT) + Math.log(safeV);
        };

        const N = diagram.particles.length > 0 ? diagram.particles.length : 60;

        for (const pt of diagram.history) {
          if (pt.v !== undefined && pt.kineticEnergy !== undefined) {
            const ptT = pt.kineticEnergy / N;
            const ptS = calcEntropy(ptT, pt.v);
            sVals.push(ptS);
            tVals.push(ptT);
          }
        }

        if (diagram.autoCycle) {
          const loop = diagram.getCarnotLoopPoints();
          for (const pt of loop) {
            const ptT = (pt.y * pt.x) / N;
            const ptS = calcEntropy(ptT, pt.x);
            sVals.push(ptS);
            tVals.push(ptT);
          }
        }

        if (sVals.length > 0) {
          const maxS = Math.max(...sVals);
          const minS = Math.min(...sVals);
          const rangeS = maxS - minS;
          sMin = minS - Math.max(0.08, rangeS * 0.15);
          sMax = maxS + Math.max(0.08, rangeS * 0.15);

          const maxT = Math.max(...tVals);
          const minT = Math.min(...tVals);
          const rangeT = maxT - minT;
          tMin = Math.max(0.2, minT - Math.max(0.4, rangeT * 0.15));
          tMax = maxT + Math.max(0.4, rangeT * 0.15);
        }

        const getXScreen = (s: number) => padding.left + ((s - sMin) / (sMax - sMin)) * graphWidth;
        const getYScreen = (t: number) => padding.top + (1.0 - (t - tMin) / (tMax - tMin)) * graphHeight;

        // Draw Grid divisions
        this.ctx.strokeStyle = gridColor;
        this.ctx.lineWidth = 1;

        // Y Grid
        for (let i = 0; i <= 4; i++) {
          const val = tMin + (i / 4) * (tMax - tMin);
          const sy = getYScreen(val);
          this.ctx.beginPath();
          this.ctx.moveTo(padding.left, sy);
          this.ctx.lineTo(width - padding.right, sy);
          this.ctx.stroke();

          this.ctx.fillStyle = textColor;
          this.ctx.font = '9px Outfit, sans-serif';
          this.ctx.textAlign = 'right';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText(`T=${val.toFixed(1)}`, padding.left - 8, sy);
        }

        // X Grid
        for (let i = 0; i <= 4; i++) {
          const val = sMin + (i / 4) * (sMax - sMin);
          const sx = getXScreen(val);
          this.ctx.beginPath();
          this.ctx.moveTo(sx, padding.top);
          this.ctx.lineTo(sx, height - padding.bottom);
          this.ctx.stroke();

          this.ctx.fillStyle = textColor;
          this.ctx.font = '9px Outfit, sans-serif';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'top';
          this.ctx.fillText(`S=${val.toFixed(2)}`, sx, height - padding.bottom + 6);
        }

        // Draw Carnot Loop Segment Paths in T-S Coordinates
        if (diagram.autoCycle) {
          const loop = diagram.getCarnotLoopPoints();
          if (loop.length >= 100) {
            const drawStageSegment = (startIdx: number, endIdx: number, color: string) => {
              this.ctx.beginPath();
              this.ctx.strokeStyle = color;
              this.ctx.lineWidth = 3;
              this.ctx.setLineDash([4, 3]);

              const firstT = (loop[startIdx].y * loop[startIdx].x) / N;
              const firstS = calcEntropy(firstT, loop[startIdx].x);
              this.ctx.moveTo(getXScreen(firstS), getYScreen(firstT));

              for (let idx = startIdx + 1; idx <= endIdx; idx++) {
                const ptT = (loop[idx].y * loop[idx].x) / N;
                const ptS = calcEntropy(ptT, loop[idx].x);
                this.ctx.lineTo(getXScreen(ptS), getYScreen(ptT));
              }
              this.ctx.stroke();
              this.ctx.setLineDash([]);
            };

            // Stage 0: Isothermal Exp
            drawStageSegment(0, 25, '#10b981');
            // Stage 1: Adiabatic Exp
            drawStageSegment(25, 50, '#eab308');
            // Stage 2: Isothermal Comp
            drawStageSegment(50, 75, '#3b82f6');
            // Stage 3: Adiabatic Comp
            drawStageSegment(75, 100, '#ef4444');
          }
        }

        // Draw real-time trace path
        if (diagram.history.length > 1) {
          this.ctx.beginPath();
          this.ctx.strokeStyle = '#8b5cf6';
          this.ctx.lineWidth = 2.5;
          let first = true;
          for (const pt of diagram.history) {
            if (pt.v !== undefined && pt.kineticEnergy !== undefined) {
              const ptT = pt.kineticEnergy / N;
              const ptS = calcEntropy(ptT, pt.v);
              const sx = getXScreen(ptS);
              const sy = getYScreen(ptT);
              if (first) {
                this.ctx.moveTo(sx, sy);
                first = false;
              } else {
                this.ctx.lineTo(sx, sy);
              }
            }
          }
          this.ctx.stroke();
        }

        // Draw current state tracking dot
        const curT = diagram.temperature;
        const curS = calcEntropy(curT, diagram.volume);
        const dotX = getXScreen(curS);
        const dotY = getYScreen(curT);

        this.ctx.beginPath();
        this.ctx.fillStyle = diagram.getCycleStageColor();
        this.ctx.shadowColor = diagram.getCycleStageColor();
        this.ctx.shadowBlur = 10;
        this.ctx.arc(dotX, dotY, 6, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.shadowBlur = 0; // Reset shadow

        // Draw legend
        const drawPistLegend = (label: string, color: string, idx: number) => {
          const lx = padding.left + idx * 82;
          const ly = padding.top - 12;
          this.ctx.fillStyle = color;
          this.ctx.fillRect(lx, ly - 3, 10, 6);
          this.ctx.fillStyle = this.theme === 'dark' ? '#eee' : '#333';
          this.ctx.font = 'bold 8px Outfit, sans-serif';
          this.ctx.textAlign = 'left';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText(label, lx + 14, ly);
        };
        if (diagram.autoCycle) {
          drawPistLegend('Isotherm Exp', '#10b981', 0);
          drawPistLegend('Adiabat Exp', '#eab308', 1);
          drawPistLegend('Isotherm Comp', '#3b82f6', 2);
          drawPistLegend('Adiabat Comp', '#ef4444', 3);
        } else {
          drawPistLegend('TS State Trace', '#8b5cf6', 0);
        }

      } else {
        // 2. Pressure-Volume (PV) Diagram
        let yMin = 0;
        let yMax = 300;
        const pValues: number[] = [];

        for (const pt of diagram.history) {
          if (pt.p !== undefined) pValues.push(pt.p);
        }
        if (diagram.autoCycle) {
          const loop = diagram.getCarnotLoopPoints();
          for (const pt of loop) pValues.push(pt.y);
        }

        if (pValues.length > 0) {
          const maxP = Math.max(...pValues);
          const minP = Math.min(...pValues);
          const range = maxP - minP;
          yMin = Math.max(0, minP - range * 0.15);
          yMax = maxP + range * 0.15;
          if (yMax - yMin < 10) {
            yMin = Math.max(0, yMin - 10);
            yMax += 10;
          }
        }

        const getXScreen = (v: number) => padding.left + ((v - 1.0) / 4.0) * graphWidth;
        const getYScreen = (p: number) => padding.top + (1.0 - (p - yMin) / (yMax - yMin)) * graphHeight;

        // Draw Grid divisions
        this.ctx.strokeStyle = gridColor;
        this.ctx.lineWidth = 1;

        // Y Grid
        for (let i = 0; i <= 4; i++) {
          const val = yMin + (i / 4) * (yMax - yMin);
          const sy = getYScreen(val);
          this.ctx.beginPath();
          this.ctx.moveTo(padding.left, sy);
          this.ctx.lineTo(width - padding.right, sy);
          this.ctx.stroke();

          this.ctx.fillStyle = textColor;
          this.ctx.font = '9px Outfit, sans-serif';
          this.ctx.textAlign = 'right';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText(val.toFixed(1), padding.left - 8, sy);
        }

        // X Grid (Volume 1.0 to 5.0)
        for (let v = 1.0; v <= 5.0; v += 1.0) {
          const sx = getXScreen(v);
          this.ctx.beginPath();
          this.ctx.moveTo(sx, padding.top);
          this.ctx.lineTo(sx, height - padding.bottom);
          this.ctx.stroke();

          this.ctx.fillStyle = textColor;
          this.ctx.font = '9px Outfit, sans-serif';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'top';
          this.ctx.fillText(`V=${v.toFixed(1)}`, sx, height - padding.bottom + 6);
        }

        // Draw Carnot Loop Segment Paths
        if (diagram.autoCycle) {
          const loop = diagram.getCarnotLoopPoints();
          if (loop.length >= 100) {
            const drawStageSegment = (startIdx: number, endIdx: number, color: string) => {
              this.ctx.beginPath();
              this.ctx.strokeStyle = color;
              this.ctx.lineWidth = 3;
              this.ctx.setLineDash([4, 3]);

              this.ctx.moveTo(getXScreen(loop[startIdx].x), getYScreen(loop[startIdx].y));
              for (let idx = startIdx + 1; idx <= endIdx; idx++) {
                this.ctx.lineTo(getXScreen(loop[idx].x), getYScreen(loop[idx].y));
              }
              this.ctx.stroke();
              this.ctx.setLineDash([]);
            };

            // Stage 0: Isothermal Exp
            drawStageSegment(0, 25, '#10b981');
            // Stage 1: Adiabatic Exp
            drawStageSegment(25, 50, '#eab308');
            // Stage 2: Isothermal Comp
            drawStageSegment(50, 75, '#3b82f6');
            // Stage 3: Adiabatic Comp
            drawStageSegment(75, 100, '#ef4444');
          }
        }

        // Draw real-time trace path
        if (diagram.history.length > 1) {
          this.ctx.beginPath();
          this.ctx.strokeStyle = '#8b5cf6';
          this.ctx.lineWidth = 2.5;
          let first = true;
          for (const pt of diagram.history) {
            if (pt.v !== undefined && pt.p !== undefined) {
              const sx = getXScreen(pt.v);
              const sy = getYScreen(pt.p);
              if (first) {
                this.ctx.moveTo(sx, sy);
                first = false;
              } else {
                this.ctx.lineTo(sx, sy);
              }
            }
          }
          this.ctx.stroke();
        }

        // Draw current state tracking dot
        const curV = diagram.volume;
        const curP = diagram.pressure;
        const dotX = getXScreen(curV);
        const dotY = getYScreen(curP);

        this.ctx.beginPath();
        this.ctx.fillStyle = diagram.getCycleStageColor();
        this.ctx.shadowColor = diagram.getCycleStageColor();
        this.ctx.shadowBlur = 10;
        this.ctx.arc(dotX, dotY, 6, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.shadowBlur = 0; // Reset shadow

        // Draw legend
        const drawPistLegend = (label: string, color: string, idx: number) => {
          const lx = padding.left + idx * 82;
          const ly = padding.top - 12;
          this.ctx.fillStyle = color;
          this.ctx.fillRect(lx, ly - 3, 10, 6);
          this.ctx.fillStyle = this.theme === 'dark' ? '#eee' : '#333';
          this.ctx.font = 'bold 8px Outfit, sans-serif';
          this.ctx.textAlign = 'left';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText(label, lx + 14, ly);
        };
        if (diagram.autoCycle) {
          drawPistLegend('Isotherm Exp', '#10b981', 0);
          drawPistLegend('Adiabat Exp', '#eab308', 1);
          drawPistLegend('Isotherm Comp', '#3b82f6', 2);
          drawPistLegend('Adiabat Comp', '#ef4444', 3);
        } else {
          drawPistLegend('PV State Trace', '#8b5cf6', 0);
        }
      }
    } else if (mode === 'diffusion') {
      // 3. Shannon Entropy over time
      const yMin = 0.0;
      const yMax = 0.8;

      const getXScreen = (t: number, tMin: number, tMax: number) => {
        const range = tMax - tMin;
        return padding.left + (range > 0 ? (t - tMin) / range : 0) * graphWidth;
      };
      const getYScreen = (s: number) => padding.top + (1.0 - (s - yMin) / (yMax - yMin)) * graphHeight;

      let tMin = 0;
      let tMax = 10;
      if (diagram.entropyHistory.length > 0) {
        tMin = diagram.entropyHistory[0].t;
        tMax = diagram.entropyHistory[diagram.entropyHistory.length - 1].t;
      }

      // Draw Y Grid lines
      this.ctx.strokeStyle = gridColor;
      this.ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const val = (i / 4) * yMax;
        const sy = getYScreen(val);
        this.ctx.beginPath();
        this.ctx.moveTo(padding.left, sy);
        this.ctx.lineTo(width - padding.right, sy);
        this.ctx.stroke();

        this.ctx.fillStyle = textColor;
        this.ctx.font = '9px Outfit, sans-serif';
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(val.toFixed(2), padding.left - 8, sy);
      }

      // Draw X Grid lines
      for (let i = 0; i <= 4; i++) {
        const val = tMin + (i / 4) * (tMax - tMin);
        const sx = padding.left + (i / 4) * graphWidth;
        this.ctx.beginPath();
        this.ctx.moveTo(sx, padding.top);
        this.ctx.lineTo(sx, height - padding.bottom);
        this.ctx.stroke();

        this.ctx.fillStyle = textColor;
        this.ctx.font = '9px Outfit, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText(`${val.toFixed(1)}s`, sx, height - padding.bottom + 6);
      }

      // Draw dashed reference line at Max Shannon entropy = ln(2) approx 0.693
      const sMaxY = getYScreen(Math.log(2));
      this.ctx.beginPath();
      this.ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
      this.ctx.lineWidth = 1.5;
      this.ctx.setLineDash([4, 4]);
      this.ctx.moveTo(padding.left, sMaxY);
      this.ctx.lineTo(width - padding.right, sMaxY);
      this.ctx.stroke();
      this.ctx.setLineDash([]);

      // Draw theoretical limit text
      this.ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
      this.ctx.font = '8px Outfit, sans-serif';
      this.ctx.textAlign = 'left';
      this.ctx.fillText('Max Mixed Entropy S=ln(2) ≈ 0.693', padding.left + 6, sMaxY - 4);

      // Plot experimental Shannon entropy history path
      if (diagram.entropyHistory.length > 1) {
        this.ctx.beginPath();
        this.ctx.strokeStyle = '#06b6d4';
        this.ctx.lineWidth = 3.0;
        let first = true;
        for (const pt of diagram.entropyHistory) {
          const sx = getXScreen(pt.t, tMin, tMax);
          const sy = getYScreen(pt.entropy);
          if (first) {
            this.ctx.moveTo(sx, sy);
            first = false;
          } else {
            this.ctx.lineTo(sx, sy);
          }
        }
        this.ctx.stroke();
      }

      // Display live entropy value in corner
      this.ctx.fillStyle = this.theme === 'dark' ? '#fff' : '#000';
      this.ctx.font = 'bold 11px Outfit, sans-serif';
      this.ctx.textAlign = 'right';
      this.ctx.fillText(`Entropy S: ${diagram.entropy.toFixed(4)}`, width - padding.right - 8, padding.top + 15);
    }

    // 4. Draw axes borders
    this.ctx.strokeStyle = axisColor;
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.moveTo(padding.left, padding.top);
    this.ctx.lineTo(padding.left, height - padding.bottom);
    this.ctx.lineTo(width - padding.right, height - padding.bottom);
    this.ctx.stroke();

    this.ctx.restore();
  }

  public drawCircuit(
    history: {
      t: number;
      voltages: number[];
      elementStates?: {
        id: string;
        volts: number[];
        current: number;
        voltageDiff: number;
        power: number;
      }[];
    }[],
    selectedElementId?: string | null,
    presetName?: string
  ): void {
    if (this.mode === 'oscilloscope-yt') {
      this.drawOscilloscopeYT(history, selectedElementId || null, presetName || '');
      return;
    }
    if (this.mode === 'oscilloscope-xy') {
      this.drawOscilloscopeXY(history, selectedElementId || null, presetName || '');
      return;
    }

    this.clear();
    if (history.length < 2) return;

    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;

    const axisColor = this.theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';
    const gridColor = this.theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
    const textColor = this.theme === 'dark' ? '#888' : '#666';

    const padding = { top: 25, right: 20, bottom: 25, left: 45 };
    const graphWidth = width - padding.left - padding.right;
    const graphHeight = height - padding.top - padding.bottom;

    // Determine Y scale bounds dynamically based on all node voltages in history
    let yMin = Infinity;
    let yMax = -Infinity;

    history.forEach((d) => {
      d.voltages.forEach((v) => {
        yMin = Math.min(yMin, v);
        yMax = Math.max(yMax, v);
      });
    });

    // Default bounds if empty or static
    if (yMin === Infinity) {
      yMin = -1;
      yMax = 6;
    }

    const yRange = yMax - yMin;
    if (yRange < 0.01) {
      yMin -= 1.0;
      yMax += 1.0;
    } else {
      yMin -= yRange * 0.1;
      yMax += yRange * 0.1;
    }

    const xMin = history[0].t;
    const xMax = history[history.length - 1].t;
    const xRange = xMax - xMin;

    const getXScreen = (t: number) => {
      return padding.left + ((t - xMin) / (xRange || 1)) * graphWidth;
    };

    const getYScreen = (val: number) => {
      return padding.top + (1.0 - (val - yMin) / (yMax - yMin)) * graphHeight;
    };

    this.ctx.save();

    // Grid
    this.ctx.strokeStyle = gridColor;
    this.ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const val = yMin + (i / 4) * (yMax - yMin);
      const sy = getYScreen(val);
      this.ctx.beginPath();
      this.ctx.moveTo(padding.left, sy);
      this.ctx.lineTo(width - padding.right, sy);
      this.ctx.stroke();

      this.ctx.fillStyle = textColor;
      this.ctx.font = '9px Outfit, sans-serif';
      this.ctx.textAlign = 'right';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(val.toFixed(2) + ' V', padding.left - 8, sy);
    }

    // Axes border
    this.ctx.strokeStyle = axisColor;
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.moveTo(padding.left, padding.top);
    this.ctx.lineTo(padding.left, height - padding.bottom);
    this.ctx.lineTo(width - padding.right, height - padding.bottom);
    this.ctx.stroke();

    // Zero line
    if (yMin < 0 && yMax > 0) {
      const zeroY = getYScreen(0);
      this.ctx.strokeStyle = this.theme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';
      this.ctx.beginPath();
      this.ctx.moveTo(padding.left, zeroY);
      this.ctx.lineTo(width - padding.right, zeroY);
      this.ctx.stroke();
    }

    // Plot curves for each node in the history
    const colors = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6'];
    const numNodes = history[0].voltages.length;

    for (let nodeIdx = 0; nodeIdx < numNodes; nodeIdx++) {
      const color = colors[nodeIdx % colors.length];
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();

      history.forEach((d, idx) => {
        const sx = getXScreen(d.t);
        const sy = getYScreen(d.voltages[nodeIdx] ?? 0);
        if (idx === 0) this.ctx.moveTo(sx, sy);
        else this.ctx.lineTo(sx, sy);
      });
      this.ctx.stroke();

      // Legend
      const legendX = padding.left + nodeIdx * 100;
      const legendY = padding.top - 12;

      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.arc(legendX, legendY, 4, 0, 2 * Math.PI);
      this.ctx.fill();

      this.ctx.fillStyle = this.theme === 'dark' ? '#eee' : '#333';
      this.ctx.font = 'bold 9px Outfit, sans-serif';
      this.ctx.textAlign = 'left';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(`Node ${nodeIdx + 1}`, legendX + 8, legendY);
    }

    this.ctx.restore();
  }

  private getChannelValues(
    pt: {
      t: number;
      voltages: number[];
      elementStates?: {
        id: string;
        volts: number[];
        current: number;
        voltageDiff: number;
        power: number;
      }[];
    },
    selectedElementId: string | null,
    _presetName: string
  ) {
    if (selectedElementId && pt.elementStates) {
      const state = pt.elementStates.find(e => e.id === selectedElementId);
      const valA = state ? state.voltageDiff : 0;
      const valB = state ? state.current * 1000 : 0; // Convert to mA
      return {
        valA, labelA: `${selectedElementId.toUpperCase()} Volts`, unitA: 'V',
        valB, labelB: `${selectedElementId.toUpperCase()} Current`, unitB: 'mA'
      };
    }

    // Fallback defaults for presets
    const vsrc = pt.elementStates?.find(e => e.id === 'vsrc');
    const c1 = pt.elementStates?.find(e => e.id === 'c1');
    return {
      valA: vsrc ? vsrc.voltageDiff : 0, labelA: 'Source Voltage', unitA: 'V',
      valB: c1 ? c1.voltageDiff : 0, labelB: 'Capacitor Voltage', unitB: 'V'
    };
  }

  private drawOscilloscopeYT(
    history: {
      t: number;
      voltages: number[];
      elementStates?: {
        id: string;
        volts: number[];
        current: number;
        voltageDiff: number;
        power: number;
      }[];
    }[],
    selectedElementId: string | null,
    presetName: string
  ): void {
    this.clear();
    if (history.length < 2) return;

    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;

    const axisColor = this.theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';
    const gridColor = this.theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
    const textColor = this.theme === 'dark' ? '#888' : '#666';

    const padding = { top: 30, right: 20, bottom: 25, left: 45 };
    const graphWidth = width - padding.left - padding.right;
    const graphHeight = height - padding.top - padding.bottom;

    let yMinA = Infinity;
    let yMaxA = -Infinity;
    let yMinB = Infinity;
    let yMaxB = -Infinity;

    history.forEach((pt) => {
      const vals = this.getChannelValues(pt, selectedElementId, presetName);
      yMinA = Math.min(yMinA, vals.valA);
      yMaxA = Math.max(yMaxA, vals.valA);
      yMinB = Math.min(yMinB, vals.valB);
      yMaxB = Math.max(yMaxB, vals.valB);
    });

    if (yMinA === Infinity) { yMinA = -1; yMaxA = 1; }
    if (yMinB === Infinity) { yMinB = -1; yMaxB = 1; }

    let rangeA = yMaxA - yMinA;
    if (rangeA < 0.01) {
      yMinA -= 0.5;
      yMaxA += 0.5;
      rangeA = 1.0;
    } else {
      yMinA -= rangeA * 0.1;
      yMaxA += rangeA * 0.1;
      rangeA = yMaxA - yMinA;
    }

    let rangeB = yMaxB - yMinB;
    if (rangeB < 0.01) {
      yMinB -= 0.5;
      yMaxB += 0.5;
      rangeB = 1.0;
    } else {
      yMinB -= rangeB * 0.1;
      yMaxB += rangeB * 0.1;
      rangeB = yMaxB - yMinB;
    }

    const xMin = history[0].t;
    const xMax = history[history.length - 1].t;
    const xRange = xMax - xMin;

    const getXScreen = (t: number) => {
      return padding.left + ((t - xMin) / (xRange || 1)) * graphWidth;
    };

    const getYScreenA = (val: number) => {
      return padding.top + (1.0 - (val - yMinA) / (rangeA || 1)) * graphHeight;
    };

    const getYScreenB = (val: number) => {
      return padding.top + (1.0 - (val - yMinB) / (rangeB || 1)) * graphHeight;
    };

    this.ctx.save();

    // 1. Draw Grid
    this.ctx.strokeStyle = gridColor;
    this.ctx.lineWidth = 1;

    for (let i = 0; i <= 4; i++) {
      const sy = padding.top + (i / 4) * graphHeight;
      this.ctx.beginPath();
      this.ctx.moveTo(padding.left, sy);
      this.ctx.lineTo(width - padding.right, sy);
      this.ctx.stroke();
    }

    for (let i = 0; i <= 4; i++) {
      const sx = padding.left + (i / 4) * graphWidth;
      this.ctx.beginPath();
      this.ctx.moveTo(sx, padding.top);
      this.ctx.lineTo(sx, height - padding.bottom);
      this.ctx.stroke();

      const valT = xMin + (i / 4) * xRange;
      this.ctx.fillStyle = textColor;
      this.ctx.font = '9px Outfit, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'top';
      this.ctx.fillText(`${valT.toFixed(3)}s`, sx, height - padding.bottom + 6);
    }

    // 2. Draw axes borders
    this.ctx.strokeStyle = axisColor;
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.moveTo(padding.left, padding.top);
    this.ctx.lineTo(padding.left, height - padding.bottom);
    this.ctx.lineTo(width - padding.right, height - padding.bottom);
    this.ctx.stroke();

    // 3. Plot curves
    const colorA = '#3b82f6';
    const colorB = '#10b981';

    // Channel A
    this.ctx.beginPath();
    this.ctx.strokeStyle = colorA;
    this.ctx.lineWidth = 2;
    history.forEach((pt, idx) => {
      const sx = getXScreen(pt.t);
      const vals = this.getChannelValues(pt, selectedElementId, presetName);
      const sy = getYScreenA(vals.valA);
      if (idx === 0) this.ctx.moveTo(sx, sy);
      else this.ctx.lineTo(sx, sy);
    });
    this.ctx.stroke();

    // Channel B
    this.ctx.beginPath();
    this.ctx.strokeStyle = colorB;
    this.ctx.lineWidth = 2;
    history.forEach((pt, idx) => {
      const sx = getXScreen(pt.t);
      const vals = this.getChannelValues(pt, selectedElementId, presetName);
      const sy = getYScreenB(vals.valB);
      if (idx === 0) this.ctx.moveTo(sx, sy);
      else this.ctx.lineTo(sx, sy);
    });
    this.ctx.stroke();

    // 4. Draw legends
    const latestPt = history[history.length - 1];
    const latestVals = this.getChannelValues(latestPt, selectedElementId, presetName);

    const drawLegend = (label: string, value: number, unit: string, color: string, legendIdx: number) => {
      const legendX = padding.left + legendIdx * 160;
      const legendY = padding.top - 12;

      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.arc(legendX, legendY, 4, 0, 2 * Math.PI);
      this.ctx.fill();

      this.ctx.fillStyle = this.theme === 'dark' ? '#eee' : '#333';
      this.ctx.font = 'bold 10px Outfit, sans-serif';
      this.ctx.textAlign = 'left';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(`${label}: ${value.toFixed(2)}${unit}`, legendX + 8, legendY);
    };

    drawLegend(latestVals.labelA, latestVals.valA, latestVals.unitA, colorA, 0);
    drawLegend(latestVals.labelB, latestVals.valB, latestVals.unitB, colorB, 1);

    this.ctx.restore();
  }

  private drawOscilloscopeXY(
    history: {
      t: number;
      voltages: number[];
      elementStates?: {
        id: string;
        volts: number[];
        current: number;
        voltageDiff: number;
        power: number;
      }[];
    }[],
    selectedElementId: string | null,
    presetName: string
  ): void {
    this.clear();
    if (history.length < 2) return;

    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;

    const axisColor = this.theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';
    const gridColor = this.theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';

    const padding = { top: 30, right: 20, bottom: 25, left: 45 };
    const graphWidth = width - padding.left - padding.right;
    const graphHeight = height - padding.top - padding.bottom;

    // Restrict plotted history to the last 200 points
    const windowPoints = history.slice(-200);

    let xMin = Infinity;
    let xMax = -Infinity;
    let yMin = Infinity;
    let yMax = -Infinity;

    windowPoints.forEach((pt) => {
      const vals = this.getChannelValues(pt, selectedElementId, presetName);
      xMin = Math.min(xMin, vals.valA);
      xMax = Math.max(xMax, vals.valA);
      yMin = Math.min(yMin, vals.valB);
      yMax = Math.max(yMax, vals.valB);
    });

    if (xMin === Infinity) { xMin = -1; xMax = 1; }
    if (yMin === Infinity) { yMin = -1; yMax = 1; }

    let rangeX = xMax - xMin;
    if (rangeX < 0.01) {
      xMin -= 0.5;
      xMax += 0.5;
      rangeX = 1.0;
    } else {
      xMin -= rangeX * 0.1;
      xMax += rangeX * 0.1;
      rangeX = xMax - xMin;
    }

    let rangeY = yMax - yMin;
    if (rangeY < 0.01) {
      yMin -= 0.5;
      yMax += 0.5;
      rangeY = 1.0;
    } else {
      yMin -= rangeY * 0.1;
      yMax += rangeY * 0.1;
      rangeY = yMax - yMin;
    }

    const getXScreen = (valA: number) => {
      return padding.left + ((valA - xMin) / (rangeX || 1)) * graphWidth;
    };

    const getYScreen = (valB: number) => {
      return padding.top + (1.0 - (valB - yMin) / (rangeY || 1)) * graphHeight;
    };

    this.ctx.save();

    // 1. Draw Grid Lines
    this.ctx.strokeStyle = gridColor;
    this.ctx.lineWidth = 1;

    for (let i = 0; i <= 4; i++) {
      const sy = padding.top + (i / 4) * graphHeight;
      this.ctx.beginPath();
      this.ctx.moveTo(padding.left, sy);
      this.ctx.lineTo(width - padding.right, sy);
      this.ctx.stroke();
    }

    for (let i = 0; i <= 4; i++) {
      const sx = padding.left + (i / 4) * graphWidth;
      this.ctx.beginPath();
      this.ctx.moveTo(sx, padding.top);
      this.ctx.lineTo(sx, height - padding.bottom);
      this.ctx.stroke();
    }

    // 2. Draw zero crossing lines
    this.ctx.strokeStyle = axisColor;
    this.ctx.lineWidth = 1.5;

    if (yMin < 0 && yMax > 0) {
      const yZero = getYScreen(0);
      this.ctx.beginPath();
      this.ctx.moveTo(padding.left, yZero);
      this.ctx.lineTo(width - padding.right, yZero);
      this.ctx.stroke();
    }

    if (xMin < 0 && xMax > 0) {
      const xZero = getXScreen(0);
      this.ctx.beginPath();
      this.ctx.moveTo(xZero, padding.top);
      this.ctx.lineTo(xZero, height - padding.bottom);
      this.ctx.stroke();
    }

    // 3. Trailing orbit path
    this.ctx.strokeStyle = '#a855f7';
    this.ctx.lineWidth = 2.0;
    this.ctx.beginPath();
    windowPoints.forEach((pt, idx) => {
      const vals = this.getChannelValues(pt, selectedElementId, presetName);
      const sx = getXScreen(vals.valA);
      const sy = getYScreen(vals.valB);
      if (idx === 0) this.ctx.moveTo(sx, sy);
      else this.ctx.lineTo(sx, sy);
    });
    this.ctx.stroke();

    // 4. Current state dot
    const latestPt = windowPoints[windowPoints.length - 1];
    const latestVals = this.getChannelValues(latestPt, selectedElementId, presetName);
    const sLastX = getXScreen(latestVals.valA);
    const sLastY = getYScreen(latestVals.valB);

    this.ctx.fillStyle = '#ef4444';
    this.ctx.beginPath();
    this.ctx.arc(sLastX, sLastY, 5, 0, 2 * Math.PI);
    this.ctx.fill();

    // 5. Draw Axis Labels
    this.ctx.fillStyle = this.theme === 'dark' ? '#eee' : '#333';
    this.ctx.font = 'bold 10px Outfit, sans-serif';
    
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(`${latestVals.labelB} (${latestVals.unitB})`, padding.left + 5, padding.top - 12);
    
    this.ctx.textAlign = 'right';
    this.ctx.fillText(`${latestVals.labelA} (${latestVals.unitA})`, width - padding.right, height - padding.bottom - 12);

    this.ctx.restore();
  }

  public drawEmptyState(heading: string, body: string): void {
    this.clear();
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    this.ctx.save();
    
    // Draw heading
    this.ctx.fillStyle = this.theme === 'dark' ? '#eee' : '#333';
    this.ctx.font = 'bold 13px Outfit, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(heading, width / 2, height / 2 - 10);

    // Draw body
    this.ctx.fillStyle = this.theme === 'dark' ? '#888' : '#666';
    this.ctx.font = '11px Outfit, sans-serif';
    this.ctx.fillText(body, width / 2, height / 2 + 10);

    this.ctx.restore();
  }
}
