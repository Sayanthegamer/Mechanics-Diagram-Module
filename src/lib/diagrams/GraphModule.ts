import type { ShmState } from './ShmDiagram';
import type { FbdState } from './FbdDiagram';
import type { FluidsState } from './FluidsDiagram';

export type GraphMode = 'kinematics' | 'energy' | 'phase-space';

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
  public draw(history: ShmState[]): void {
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
      this.drawPhaseSpace(history, graphWidth, graphHeight, padding, axisColor, gridColor, textColor);
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
        yMin = Math.min(yMin, d.x, d.v);
        yMax = Math.max(yMax, d.x, d.v);
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
      getField: (s: ShmState) => number,
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
      plotCurve((d) => d.x, '#f59e0b', 'Position (x)', 0);
      plotCurve((d) => d.v, '#10b981', 'Velocity (v)', 1);
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
  public drawFluids(history: FluidsState[]): void {
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

    // Determine scale bounds dynamically
    let yMin = Infinity;
    let yMax = -Infinity;

    history.forEach((d) => {
      const pKpa = d.pressureGauge / 1000 - 101.3; // Gauge or relative pressure in kPa to scale nicely
      yMin = Math.min(yMin, d.blockY, d.blockVy, pKpa);
      yMax = Math.max(yMax, d.blockY, d.blockVy, pKpa);
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

    plotCurve((d) => d.blockY, '#f59e0b', 'Block Y (m)', 0);
    plotCurve((d) => d.blockVy, '#22d3ee', 'Velocity Y (m/s)', 1);
    plotCurve((d) => d.pressureGauge / 1000 - 101.3, '#8b5cf6', 'Gauge P (kPa)', 2);

    this.ctx.restore();
  }
}
