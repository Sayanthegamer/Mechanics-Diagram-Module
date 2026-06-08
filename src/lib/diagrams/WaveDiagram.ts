import type { WaveConfig } from '../types';
import { PhysicsCanvas } from '../PhysicsCanvas';

export class WaveDiagram {
  private pc: PhysicsCanvas;
  private config!: WaveConfig;
  public t: number = 0;

  constructor(pc: PhysicsCanvas) {
    this.pc = pc;
  }

  public setConfig(config: WaveConfig): void {
    this.config = config;
    this.resetState();
  }

  public resetState(): void {
    this.t = 0;
  }

  public step(dt: number): void {
    this.t += dt;
    if (this.config && this.config.waveType === 'superposition') {
      const pA = this.config.superposition.pulseA;
      // Pulse travels from -3.5 to 3.5, total path = 7.0
      // Time to cross = 7.0 / speed. Adding small padding to let them go off-screen
      const limitT = 7.2 / pA.speed;
      if (this.t > limitT) {
        this.t = 0;
      }
    }
  }

  public draw(): void {
    if (!this.config) return;

    this.pc.clear();
    this.pc.resetOrigin();

    const { waveType } = this.config;

    // Center coordinates for wave drawing with pan offsets
    this.pc.originY = this.pc.canvas.clientHeight / 2 + this.pc.panY;

    if (waveType === 'transverse') {
      this.drawTransverseWave();
    } else if (waveType === 'longitudinal') {
      this.drawLongitudinalWave();
    } else if (waveType === 'superposition') {
      this.drawSuperposition();
    } else if (waveType === 'standing') {
      this.drawStandingWave();
    }
  }

  private drawTransverseWave(): void {
    const { amplitude, frequency, wavelength, damping } = this.config;

    const A = amplitude * 0.5; // Scale down slightly to fit canvas
    const lambda = wavelength;
    const f = frequency;
    
    const k = (2 * Math.PI) / lambda;
    const omega = 2 * Math.PI * f;

    const numPoints = 80;
    const xMin = -4.5;
    const xMax = 4.5;
    const step = (xMax - xMin) / numPoints;

    this.pc.ctx.save();
    
    // Draw equilibrium line
    this.pc.ctx.strokeStyle = this.pc.theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)';
    this.pc.ctx.lineWidth = 1.5;
    this.pc.ctx.setLineDash([3, 3]);
    const sStart = this.pc.toScreen(xMin, 0);
    const sEnd = this.pc.toScreen(xMax, 0);
    this.pc.ctx.beginPath();
    this.pc.ctx.moveTo(sStart.x, sStart.y);
    this.pc.ctx.lineTo(sEnd.x, sEnd.y);
    this.pc.ctx.stroke();

    // Generate wave coordinates
    const coords: { x: number; y: number }[] = [];
    for (let i = 0; i <= numPoints; i++) {
      const x = xMin + i * step;
      // Damping factor e^(-damping * (x - xMin))
      const dampFactor = Math.exp(-damping * (x - xMin));
      // Wave function: y = A * sin(k*x - omega*t)
      const y = A * Math.sin(k * x - omega * this.t) * dampFactor;
      coords.push({ x, y });
    }

    // Draw continuous wave line
    this.pc.ctx.strokeStyle = '#3b82f6';
    this.pc.ctx.lineWidth = 2.5;
    this.pc.ctx.setLineDash([]);
    this.pc.ctx.beginPath();
    coords.forEach((c, idx) => {
      const sPos = this.pc.toScreen(c.x, c.y);
      if (idx === 0) {
        this.pc.ctx.moveTo(sPos.x, sPos.y);
      } else {
        this.pc.ctx.lineTo(sPos.x, sPos.y);
      }
    });
    this.pc.ctx.stroke();

    // Draw individual particles (textbook visualization)
    // Draw particles spaced out, with vertical displacement indicators
    const particleStep = 5;
    coords.forEach((c, idx) => {
      if (idx % particleStep === 0) {
        const sPos = this.pc.toScreen(c.x, c.y);
        const sEq = this.pc.toScreen(c.x, 0);

        // Draw dashed displacement line
        this.pc.ctx.strokeStyle = this.pc.theme === 'dark' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)';
        this.pc.ctx.lineWidth = 1.0;
        this.pc.ctx.setLineDash([1, 2]);
        this.pc.ctx.beginPath();
        this.pc.ctx.moveTo(sEq.x, sEq.y);
        this.pc.ctx.lineTo(sPos.x, sPos.y);
        this.pc.ctx.stroke();

        // Draw particle dot
        this.pc.ctx.fillStyle = idx === 40 ? '#ef4444' : '#10b981'; // Red highlight for one key particle
        this.pc.ctx.beginPath();
        this.pc.ctx.arc(sPos.x, sPos.y, idx === 40 ? 5 : 3.5, 0, 2 * Math.PI);
        this.pc.ctx.fill();
      }
    });

    this.pc.ctx.restore();
  }

  private drawLongitudinalWave(): void {
    const { amplitude, frequency, wavelength, damping } = this.config;

    const A = amplitude * 0.4; // Max horizontal displacement
    const lambda = wavelength;
    const f = frequency;
    
    const k = (2 * Math.PI) / lambda;
    const omega = 2 * Math.PI * f;

    const xMin = -4.5;
    const xMax = 4.5;
    const numLines = 65; // Density of particle vertical lines
    const step = (xMax - xMin) / numLines;

    this.pc.ctx.save();

    // Draw boundary borders
    const sTopLeft = this.pc.toScreen(xMin, 1.2);
    const sTopRight = this.pc.toScreen(xMax, 1.2);
    const sBottomLeft = this.pc.toScreen(xMin, -1.2);
    const sBottomRight = this.pc.toScreen(xMax, -1.2);

    this.pc.ctx.strokeStyle = this.pc.theme === 'dark' ? '#555' : '#ccc';
    this.pc.ctx.lineWidth = 2;
    this.pc.ctx.beginPath();
    this.pc.ctx.moveTo(sTopLeft.x, sTopLeft.y); this.pc.ctx.lineTo(sTopRight.x, sTopRight.y);
    this.pc.ctx.moveTo(sBottomLeft.x, sBottomLeft.y); this.pc.ctx.lineTo(sBottomRight.x, sBottomRight.y);
    this.pc.ctx.stroke();

    // Render longitudinal layers
    for (let i = 0; i <= numLines; i++) {
      const xEq = xMin + i * step; // Equilibrium position
      const dampFactor = Math.exp(-damping * (xEq - xMin));
      
      // Horizontal displacement: s = A * sin(k*x - omega*t)
      const s = A * Math.sin(k * xEq - omega * this.t) * dampFactor;
      
      // Actual horizontal coordinate: X = xEq + s
      const xActual = xEq + s;

      // Draw vertical line layer of particles
      const sTop = this.pc.toScreen(xActual, 1.1);
      const sBottom = this.pc.toScreen(xActual, -1.1);

      this.pc.ctx.strokeStyle = '#10b981';
      this.pc.ctx.lineWidth = 1.8;

      // Highlight a single slice in red to show its horizontal oscillation
      if (i === 32) {
        this.pc.ctx.strokeStyle = '#ef4444';
        this.pc.ctx.lineWidth = 3.0;

        // Draw equilibrium reference line for this slice
        const sRefTop = this.pc.toScreen(xEq, 1.4);
        const sRefBot = this.pc.toScreen(xEq, -1.4);
        this.pc.ctx.save();
        this.pc.ctx.strokeStyle = '#f59e0b';
        this.pc.ctx.setLineDash([2, 3]);
        this.pc.ctx.lineWidth = 1.0;
        this.pc.ctx.beginPath();
        this.pc.ctx.moveTo(sRefTop.x, sRefTop.y);
        this.pc.ctx.lineTo(sRefBot.x, sRefBot.y);
        this.pc.ctx.stroke();
        this.pc.ctx.restore();
      }

      this.pc.ctx.beginPath();
      this.pc.ctx.moveTo(sTop.x, sTop.y);
      this.pc.ctx.lineTo(sBottom.x, sBottom.y);
      this.pc.ctx.stroke();

      // Render dots along the vertical slice to look like particles
      this.pc.ctx.fillStyle = this.pc.ctx.strokeStyle;
      const numDots = 8;
      const dotStep = 2.2 / numDots;
      for (let d = 0; d <= numDots; d++) {
        const dy = -1.1 + d * dotStep;
        const sDot = this.pc.toScreen(xActual, dy);
        this.pc.ctx.beginPath();
        this.pc.ctx.arc(sDot.x, sDot.y, i === 32 ? 4.5 : 2.5, 0, 2 * Math.PI);
        this.pc.ctx.fill();
      }
    }

    // Overlay labels indicating compression & rarefaction
    this.pc.ctx.fillStyle = this.pc.theme === 'dark' ? '#aaa' : '#666';
    this.pc.ctx.font = 'bold 10px Outfit, sans-serif';
    this.pc.ctx.textAlign = 'center';



    this.pc.ctx.restore();
  }

  private drawSuperposition(): void {
    const { superposition } = this.config;
    const pA = superposition.pulseA;
    const pB = superposition.pulseB;

    const xMin = -4.5;
    const xMax = 4.5;
    const numPoints = 120;
    const step = (xMax - xMin) / numPoints;

    // Let pulses start centered at opposite sides and travel towards center
    // Centered initially at xA_start = -3.5, xB_start = 3.5
    const startA_x = -3.5;
    const startB_x = 3.5;

    // Current centers: position = start + direction * speed * t
    const centerA = startA_x + pA.direction * pA.speed * this.t;
    const centerB = startB_x + pB.direction * pB.speed * this.t;

    this.pc.ctx.save();

    // Gaussian pulse function: y(x) = A * exp(-(x - center)^2 / (2 * width^2))
    const getPulseHeight = (x: number, amp: number, width: number, center: number) => {
      if (width <= 0) return 0;
      return amp * Math.exp(-Math.pow(x - center, 2) / (2 * Math.pow(width, 2)));
    };

    const pulseACoords: { x: number; y: number }[] = [];
    const pulseBCoords: { x: number; y: number }[] = [];
    const combinedCoords: { x: number; y: number }[] = [];

    for (let i = 0; i <= numPoints; i++) {
      const x = xMin + i * step;

      const yA = getPulseHeight(x, pA.amplitude * 0.5, pA.width, centerA);
      const yB = getPulseHeight(x, pB.amplitude * 0.5, pB.width, centerB);
      const yCombined = yA + yB;

      pulseACoords.push({ x, y: yA });
      pulseBCoords.push({ x, y: yB });
      combinedCoords.push({ x, y: yCombined });
    }

    // 1. Draw equilibrium line
    this.pc.ctx.strokeStyle = this.pc.theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)';
    this.pc.ctx.lineWidth = 1.5;
    const sStart = this.pc.toScreen(xMin, 0);
    const sEnd = this.pc.toScreen(xMax, 0);
    this.pc.ctx.beginPath();
    this.pc.ctx.moveTo(sStart.x, sStart.y);
    this.pc.ctx.lineTo(sEnd.x, sEnd.y);
    this.pc.ctx.stroke();

    // 2. Draw Pulse A component (dashed red)
    this.pc.ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)'; // soft red
    this.pc.ctx.lineWidth = 1.5;
    this.pc.ctx.setLineDash([4, 4]);
    this.pc.ctx.beginPath();
    pulseACoords.forEach((c, idx) => {
      const sPos = this.pc.toScreen(c.x, c.y);
      if (idx === 0) this.pc.ctx.moveTo(sPos.x, sPos.y);
      else this.pc.ctx.lineTo(sPos.x, sPos.y);
    });
    this.pc.ctx.stroke();

    // 3. Draw Pulse B component (dashed blue)
    this.pc.ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)'; // soft blue
    this.pc.ctx.lineWidth = 1.5;
    this.pc.ctx.setLineDash([4, 4]);
    this.pc.ctx.beginPath();
    pulseBCoords.forEach((c, idx) => {
      const sPos = this.pc.toScreen(c.x, c.y);
      if (idx === 0) this.pc.ctx.moveTo(sPos.x, sPos.y);
      else this.pc.ctx.lineTo(sPos.x, sPos.y);
    });
    this.pc.ctx.stroke();

    // 4. Draw Combined Superposition Waveform (thick green)
    this.pc.ctx.strokeStyle = '#10b981'; // solid green
    this.pc.ctx.lineWidth = 3.0;
    this.pc.ctx.setLineDash([]);
    this.pc.ctx.beginPath();
    combinedCoords.forEach((c, idx) => {
      const sPos = this.pc.toScreen(c.x, c.y);
      if (idx === 0) this.pc.ctx.moveTo(sPos.x, sPos.y);
      else this.pc.ctx.lineTo(sPos.x, sPos.y);
    });
    this.pc.ctx.stroke();

    // 5. Draw indicator circles for pulse centers with direction arrows
    const drawPulseCenterIndicator = (center: number, direction: number, color: string, label: string) => {
      // Check if pulse is within render boundary
      if (center >= xMin && center <= xMax) {
        const sCenter = this.pc.toScreen(center, 0);
        this.pc.ctx.fillStyle = color;
        this.pc.ctx.beginPath();
        this.pc.ctx.arc(sCenter.x, sCenter.y, 4, 0, 2 * Math.PI);
        this.pc.ctx.fill();

        // Draw horizontal direction vector
        const arrowLen = 0.5 * direction;
        this.pc.drawArrow(center, -0.25, center + arrowLen, -0.25, color, label, { headSize: 6, lineWidth: 1.5 });
      }
    };

    drawPulseCenterIndicator(centerA, pA.direction, 'rgba(239, 68, 68, 0.7)', 'Pulse A');
    drawPulseCenterIndicator(centerB, pB.direction, 'rgba(59, 130, 246, 0.7)', 'Pulse B');

    this.pc.ctx.restore();
  }

  private drawStandingWave(): void {
    const { amplitude, frequency, wavelength } = this.config;

    const A = amplitude * 0.5;
    const lambda = wavelength;
    const f = frequency;

    const k = (2 * Math.PI) / lambda;
    const omega = 2 * Math.PI * f;

    const numPoints = 120;
    const xMin = -4.5;
    const xMax = 4.5;
    const step = (xMax - xMin) / numPoints;

    this.pc.ctx.save();

    // Equilibrium line
    this.pc.ctx.strokeStyle = this.pc.theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)';
    this.pc.ctx.lineWidth = 1.5;
    this.pc.ctx.setLineDash([3, 3]);
    const sStart = this.pc.toScreen(xMin, 0);
    const sEnd = this.pc.toScreen(xMax, 0);
    this.pc.ctx.beginPath();
    this.pc.ctx.moveTo(sStart.x, sStart.y);
    this.pc.ctx.lineTo(sEnd.x, sEnd.y);
    this.pc.ctx.stroke();
    this.pc.ctx.setLineDash([]);

    // Generate wave data
    const wave1Coords: { x: number; y: number }[] = [];
    const wave2Coords: { x: number; y: number }[] = [];
    const standingCoords: { x: number; y: number }[] = [];
    const envelopeTop: { x: number; y: number }[] = [];
    const envelopeBot: { x: number; y: number }[] = [];

    for (let i = 0; i <= numPoints; i++) {
      const x = xMin + i * step;
      // Wave traveling right: y1 = A sin(kx - ωt)
      const y1 = A * Math.sin(k * x - omega * this.t);
      // Wave traveling left: y2 = A sin(kx + ωt)
      const y2 = A * Math.sin(k * x + omega * this.t);
      // Standing wave: y = y1 + y2 = 2A sin(kx) cos(ωt)
      const yStanding = y1 + y2;
      // Envelope: ±2A |sin(kx)|
      const envAmp = 2 * A * Math.abs(Math.sin(k * x));

      wave1Coords.push({ x, y: y1 });
      wave2Coords.push({ x, y: y2 });
      standingCoords.push({ x, y: yStanding });
      envelopeTop.push({ x, y: envAmp });
      envelopeBot.push({ x, y: -envAmp });
    }

    // Draw envelope (semi-transparent fill)
    this.pc.ctx.fillStyle = this.pc.theme === 'dark' ? 'rgba(168, 85, 247, 0.06)' : 'rgba(168, 85, 247, 0.04)';
    this.pc.ctx.beginPath();
    envelopeTop.forEach((c, idx) => {
      const sPos = this.pc.toScreen(c.x, c.y);
      if (idx === 0) this.pc.ctx.moveTo(sPos.x, sPos.y);
      else this.pc.ctx.lineTo(sPos.x, sPos.y);
    });
    for (let i = envelopeBot.length - 1; i >= 0; i--) {
      const sPos = this.pc.toScreen(envelopeBot[i].x, envelopeBot[i].y);
      this.pc.ctx.lineTo(sPos.x, sPos.y);
    }
    this.pc.ctx.closePath();
    this.pc.ctx.fill();

    // Draw envelope outline
    this.pc.ctx.strokeStyle = 'rgba(168, 85, 247, 0.3)';
    this.pc.ctx.lineWidth = 1.5;
    this.pc.ctx.setLineDash([5, 3]);
    this.pc.ctx.beginPath();
    envelopeTop.forEach((c, idx) => {
      const sPos = this.pc.toScreen(c.x, c.y);
      if (idx === 0) this.pc.ctx.moveTo(sPos.x, sPos.y);
      else this.pc.ctx.lineTo(sPos.x, sPos.y);
    });
    this.pc.ctx.stroke();
    this.pc.ctx.beginPath();
    envelopeBot.forEach((c, idx) => {
      const sPos = this.pc.toScreen(c.x, c.y);
      if (idx === 0) this.pc.ctx.moveTo(sPos.x, sPos.y);
      else this.pc.ctx.lineTo(sPos.x, sPos.y);
    });
    this.pc.ctx.stroke();
    this.pc.ctx.setLineDash([]);

    // Draw component wave 1 (dashed red)
    this.pc.ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)';
    this.pc.ctx.lineWidth = 1.5;
    this.pc.ctx.setLineDash([4, 4]);
    this.pc.ctx.beginPath();
    wave1Coords.forEach((c, idx) => {
      const sPos = this.pc.toScreen(c.x, c.y);
      if (idx === 0) this.pc.ctx.moveTo(sPos.x, sPos.y);
      else this.pc.ctx.lineTo(sPos.x, sPos.y);
    });
    this.pc.ctx.stroke();

    // Draw component wave 2 (dashed blue)
    this.pc.ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
    this.pc.ctx.beginPath();
    wave2Coords.forEach((c, idx) => {
      const sPos = this.pc.toScreen(c.x, c.y);
      if (idx === 0) this.pc.ctx.moveTo(sPos.x, sPos.y);
      else this.pc.ctx.lineTo(sPos.x, sPos.y);
    });
    this.pc.ctx.stroke();
    this.pc.ctx.setLineDash([]);

    // Draw standing wave (thick green)
    this.pc.ctx.strokeStyle = '#10b981';
    this.pc.ctx.lineWidth = 3.0;
    this.pc.ctx.beginPath();
    standingCoords.forEach((c, idx) => {
      const sPos = this.pc.toScreen(c.x, c.y);
      if (idx === 0) this.pc.ctx.moveTo(sPos.x, sPos.y);
      else this.pc.ctx.lineTo(sPos.x, sPos.y);
    });
    this.pc.ctx.stroke();

    // Label nodes (N) and antinodes (A)
    this.pc.ctx.font = 'bold 10px Outfit, sans-serif';
    this.pc.ctx.textAlign = 'center';

    // Nodes occur at kx = nπ → x = nπ/k = nλ/2
    const halfLambda = lambda / 2;
    for (let x = Math.ceil(xMin / halfLambda) * halfLambda; x <= xMax; x += halfLambda) {
      const sPos = this.pc.toScreen(x, 0);
      // Check if it's a node or antinode
      const kxNorm = Math.abs(Math.sin(k * x));
      if (kxNorm < 0.1) {
        // Node
        this.pc.ctx.fillStyle = '#ef4444';
        this.pc.ctx.beginPath();
        this.pc.ctx.arc(sPos.x, sPos.y, 4, 0, 2 * Math.PI);
        this.pc.ctx.fill();
        this.pc.ctx.fillText('N', sPos.x, sPos.y + 16);
      }
    }

    // Antinodes at kx = (n+0.5)π → x = (n+0.5)λ/2
    const quarterLambda = lambda / 4;
    for (let x = Math.ceil((xMin - quarterLambda) / halfLambda) * halfLambda + quarterLambda; x <= xMax; x += halfLambda) {
      const sPos = this.pc.toScreen(x, 0);
      const kxNorm = Math.abs(Math.sin(k * x));
      if (kxNorm > 0.9) {
        // Antinode
        this.pc.ctx.fillStyle = '#22d3ee';
        this.pc.ctx.beginPath();
        this.pc.ctx.arc(sPos.x, sPos.y, 4, 0, 2 * Math.PI);
        this.pc.ctx.fill();
        this.pc.ctx.fillText('A', sPos.x, sPos.y + 16);
      }
    }

    this.pc.ctx.restore();
  }
}
