import type { ThermoConfig } from '../types';
import { PhysicsCanvas } from '../PhysicsCanvas';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  mass: number;
  color: string;
  species: 'A' | 'B';
}

export class ThermoDiagram {
  private pc: PhysicsCanvas;
  private config!: ThermoConfig;

  // Simulation state
  public t: number = 0;
  public particles: Particle[] = [];
  public pressure: number = 0.5;
  public volume: number = 3.0;
  public temperature: number = 3.0;
  
  // Barrier state for diffusion
  public barrierClosed: boolean = true;
  public yBarrier: number = -4.0;

  // Thermodynamic process state
  public activeProcess: 'none' | 'isothermal' | 'isobaric' | 'isochoric' | 'adiabatic' = 'none';
  public heatTransfer: 'none' | 'heating' | 'cooling' = 'none';

  // Reference state variables
  public p0: number = 0.5;
  public v0: number = 3.0;
  public t0: number = 3.0;

  private readonly gamma: number = 1.67;

  // Carnot cycle state
  public autoCycle: boolean = false;
  public cycleStage: 0 | 1 | 2 | 3 = 0;
  public stageTimer: number = 0;
  public readonly stageDuration: number = 3.0;

  // Carnot cycle limits
  public readonly tHot: number = 6.0;
  public readonly tCold: number = 3.0;
  public readonly vA: number = 1.1;
  public readonly vB: number = 1.6;

  // Entropy state
  public entropy: number = 0;
  public entropyHistory: { t: number; entropy: number }[] = [];

  // Capped history array for graphing
  public history: { t: number; kineticEnergy: number; potentialEnergy: number; totalEnergy: number }[] = [];

  private accumulatedImpulse: number = 0;
  private pressureTimeWindow: number = 0;

  // Container dimensions
  private readonly xLeft: number = -6.0;
  private readonly yBottom: number = -4.0;
  private readonly yTop: number = 4.0;
  private readonly H: number = 8.0;

  constructor(pc: PhysicsCanvas) {
    this.pc = pc;
  }

  public setConfig(config: ThermoConfig): void {
    this.config = config;
    this.resetState();
  }

  public resetState(): void {
    if (!this.config) return;
    this.t = 0;
    this.pressure = 0.5;
    this.accumulatedImpulse = 0;
    this.pressureTimeWindow = 0;
    this.history = [];
    this.barrierClosed = true;
    this.yBarrier = -4.0;
    this.activeProcess = 'none';
    this.heatTransfer = 'none';

    this.autoCycle = this.config.autoCycle || false;
    this.cycleStage = 0;
    this.stageTimer = 0;

    this.entropy = 0;
    this.entropyHistory = [];

    this.volume = this.config.volume;
    this.temperature = this.config.temperature;

    this.initializeParticles();
    this.captureReferenceState();
  }

  public captureReferenceState(): void {
    this.v0 = this.volume;
    this.t0 = this.temperature;
    this.p0 = this.pressure;
  }

  private initializeParticles(): void {
    this.particles = [];
    const N = this.config.particleCount;
    const T = this.temperature;

    const xRight = this.xLeft + this.volume * 2.4;
    const xMid = (this.xLeft + xRight) / 2;

    const nHalf = Math.floor(N / 2);

    // Species A: Heavy, Red (mass=4.0, radius=10px -> ~0.2 units)
    const rA = 0.2;
    const mA = 4.0;
    const colorA = '#ef4444';

    // Species B: Light, Blue (mass=1.0, radius=6px -> ~0.12 units)
    const rB = 0.12;
    const mB = 1.0;
    const colorB = '#3b82f6';

    const spawnParticles = (
      count: number,
      xMin: number,
      xMax: number,
      r: number,
      m: number,
      color: string,
      species: 'A' | 'B'
    ) => {
      for (let i = 0; i < count; i++) {
        // Attempt to find a non-overlapping spawn position
        let x = 0, y = 0;
        let overlaps = true;
        let attempts = 0;

        while (overlaps && attempts < 100) {
          x = xMin + r + Math.random() * (xMax - xMin - 2 * r);
          y = this.yBottom + r + Math.random() * (this.H - 2 * r);
          overlaps = false;

          for (const p of this.particles) {
            const dx = p.x - x;
            const dy = p.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < p.radius + r) {
              overlaps = true;
              break;
            }
          }
          attempts++;
        }

        // Velocity: speed matches average kinetic temperature v = sqrt(2T / m)
        const speed = Math.sqrt((2 * T) / m);
        const theta = Math.random() * Math.PI * 2;
        const vx = speed * Math.cos(theta);
        const vy = speed * Math.sin(theta);

        this.particles.push({ x, y, vx, vy, radius: r, mass: m, color, species });
      }
    };

    // Initialize Red (Species A) on the left
    spawnParticles(nHalf, this.xLeft, xMid, rA, mA, colorA, 'A');

    // Initialize Blue (Species B) on the right
    spawnParticles(N - nHalf, xMid, xRight, rB, mB, colorB, 'B');
  }

  public step(dt: number): void {
    if (!this.config) return;

    this.t += dt;

    // Sync autoCycle from config
    const wasAuto = this.autoCycle;
    this.autoCycle = this.config.autoCycle || false;
    if (this.autoCycle && !wasAuto) {
      this.cycleStage = 0;
      this.stageTimer = 0;
      this.captureReferenceState();
    }

    let targetT = this.temperature;

    if (this.autoCycle) {
      // Carnot Cycle FSM
      this.stageTimer += dt;
      if (this.stageTimer >= this.stageDuration) {
        this.stageTimer = 0;
        this.cycleStage = ((this.cycleStage + 1) % 4) as 0 | 1 | 2 | 3;
      }

      const u = this.stageTimer / this.stageDuration;
      
      // Calculate Carnot volumes dynamically
      const vC = this.vB * Math.pow(this.tHot / this.tCold, 1 / (this.gamma - 1));
      const vD = this.vA * Math.pow(this.tHot / this.tCold, 1 / (this.gamma - 1));

      // N particles for P = N * T / V ideal curve calculation
      const N = this.particles.length > 0 ? this.particles.length : this.config.particleCount;

      if (this.cycleStage === 0) {
        // Stage 0: Isothermal Expansion (A -> B)
        this.activeProcess = 'isothermal';
        this.heatTransfer = 'heating';
        this.volume = this.vA + u * (this.vB - this.vA);
        targetT = this.tHot;
        this.pressure = (N * targetT) / this.volume;
      } else if (this.cycleStage === 1) {
        // Stage 1: Adiabatic Expansion (B -> C)
        this.activeProcess = 'adiabatic';
        this.heatTransfer = 'none';
        this.volume = this.vB + u * (vC - this.vB);
        targetT = this.tHot * Math.pow(this.vB / this.volume, this.gamma - 1);
        this.pressure = ((N * this.tHot) / this.vB) * Math.pow(this.vB / this.volume, this.gamma);
      } else if (this.cycleStage === 2) {
        // Stage 2: Isothermal Compression (C -> D)
        this.activeProcess = 'isothermal';
        this.heatTransfer = 'cooling';
        this.volume = vC - u * (vC - vD);
        targetT = this.tCold;
        this.pressure = (N * targetT) / this.volume;
      } else if (this.cycleStage === 3) {
        // Stage 3: Adiabatic Compression (D -> A)
        this.activeProcess = 'adiabatic';
        this.heatTransfer = 'none';
        this.volume = vD - u * (vD - this.vA);
        targetT = this.tCold * Math.pow(vD / this.volume, this.gamma - 1);
        this.pressure = ((N * this.tCold) / vD) * Math.pow(vD / this.volume, this.gamma);
      }
    } else {
      // Normal state update (non-auto cycle)
      let targetVolume = this.config.volume;
      if (this.activeProcess === 'isochoric') {
        targetVolume = this.v0;
      }

      // Smoothly transition volume towards target
      this.volume += (targetVolume - this.volume) * (1 - Math.exp(-10 * dt));
      // Keep volume in bounds
      this.volume = Math.max(1.0, Math.min(5.0, this.volume));

      targetT = this.temperature;

      if (this.activeProcess === 'isothermal') {
        targetT = this.t0;
        this.pressure = this.p0 * (this.v0 / this.volume);
      } else if (this.activeProcess === 'isobaric') {
        this.pressure = this.p0;
        targetT = this.t0 * (this.volume / this.v0);
      } else if (this.activeProcess === 'adiabatic') {
        this.pressure = this.p0 * Math.pow(this.v0 / this.volume, this.gamma);
        targetT = this.t0 * Math.pow(this.v0 / this.volume, this.gamma - 1);
      } else if (this.activeProcess === 'isochoric') {
        // In Isochoric, volume remains at v0
        this.volume = this.v0;
        if (this.heatTransfer === 'heating') {
          targetT = this.temperature + 1.0 * dt;
        } else if (this.heatTransfer === 'cooling') {
          targetT = this.temperature - 1.0 * dt;
        } else {
          targetT = this.t0;
        }
        targetT = Math.max(0.5, Math.min(15.0, targetT));
        this.pressure = this.p0 * (targetT / this.t0);
      } else {
        // activeProcess === 'none'
        targetT = this.config.temperature;
      }

      // Set heatTransfer automatically if activeProcess === 'none'
      if (this.activeProcess === 'none') {
        const tempDiff = this.config.temperature - this.temperature;
        if (tempDiff > 0.05) {
          this.heatTransfer = 'heating';
        } else if (tempDiff < -0.05) {
          this.heatTransfer = 'cooling';
        } else {
          this.heatTransfer = 'none';
        }
      } else {
        // For process modes, set heatTransfer based on volume changes relative to v0:
        if (this.activeProcess === 'isothermal' || this.activeProcess === 'isobaric') {
          if (this.volume > this.v0 + 0.02) {
            this.heatTransfer = 'heating';
          } else if (this.volume < this.v0 - 0.02) {
            this.heatTransfer = 'cooling';
          } else {
            this.heatTransfer = 'none';
          }
        } else if (this.activeProcess === 'adiabatic') {
          this.heatTransfer = 'none';
        }
      }
    }

    // 2. Perform velocity scaling to align particle speeds with macroscopic temperature
    const tCurrent = this.temperature;
    if (tCurrent > 1e-4 && targetT > 1e-4) {
      const alpha = Math.sqrt(targetT / tCurrent);
      const maxSpeed = 30.0;
      for (const p of this.particles) {
        p.vx *= alpha;
        p.vy *= alpha;

        // Prevent speed runaway
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > maxSpeed) {
          p.vx = (p.vx / speed) * maxSpeed;
          p.vy = (p.vy / speed) * maxSpeed;
        }
      }
    }

    const xRight = this.xLeft + this.volume * 2.4;
    const xMid = (this.xLeft + xRight) / 2;

    // Slide open barrier in diffusion mode
    if (this.config.mode === 'diffusion' && !this.barrierClosed) {
      if (this.yBarrier < this.yTop) {
        this.yBarrier += 8.0 * dt; // slide open completely in 1s
        if (this.yBarrier > this.yTop) {
          this.yBarrier = this.yTop;
        }
      }
    }

    // 3. Particle positions Verlet step update
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Keep particles strictly within container boundaries (prevent clipping during compression)
      if (p.x < this.xLeft + p.radius) {
        p.x = this.xLeft + p.radius;
        p.vx = Math.abs(p.vx);
        this.accumulatedImpulse += 2 * p.mass * Math.abs(p.vx);
      } else if (p.x > xRight - p.radius) {
        p.x = xRight - p.radius;
        p.vx = -Math.abs(p.vx);
        this.accumulatedImpulse += 2 * p.mass * Math.abs(p.vx);
      }

      // Top Wall
      if (p.y > this.yTop - p.radius) {
        p.y = this.yTop - p.radius;
        p.vy = -Math.abs(p.vy);
        this.accumulatedImpulse += 2 * p.mass * Math.abs(p.vy);
      }
      // Bottom Wall
      if (p.y < this.yBottom + p.radius) {
        p.y = this.yBottom + p.radius;
        p.vy = Math.abs(p.vy);
        this.accumulatedImpulse += 2 * p.mass * Math.abs(p.vy);
      }

      // Central Divider Barrier in diffusion mode
      if (this.config.mode === 'diffusion' && this.yBarrier < this.yTop) {
        if (p.y >= this.yBarrier - p.radius) {
          // Check collision with divider at xMid
          const crossedLeft = p.x > xMid - p.radius && p.x - p.vx * dt <= xMid - p.radius;
          const crossedRight = p.x < xMid + p.radius && p.x - p.vx * dt >= xMid + p.radius;

          if (crossedLeft) {
            p.x = xMid - p.radius;
            p.vx = -Math.abs(p.vx);
            this.accumulatedImpulse += 2 * p.mass * Math.abs(p.vx);
          } else if (crossedRight) {
            p.x = xMid + p.radius;
            p.vx = Math.abs(p.vx);
            this.accumulatedImpulse += 2 * p.mass * Math.abs(p.vx);
          }
        }
      }
    }

    // 2. Pairwise particle-particle collisions
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const p1 = this.particles[i];
        const p2 = this.particles[j];

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = p1.radius + p2.radius;

        if (dist < minDist) {
          // Resolve overlap
          const overlap = minDist - dist;
          const nx = dx / (dist > 0 ? dist : 1e-6);
          const ny = dy / (dist > 0 ? dist : 1e-6);

          p1.x -= nx * overlap * 0.5;
          p1.y -= ny * overlap * 0.5;
          p2.x += nx * overlap * 0.5;
          p2.y += ny * overlap * 0.5;

          // Elastic collision velocities update
          const kx = p1.vx - p2.vx;
          const ky = p1.vy - p2.vy;
          const vn = kx * nx + ky * ny;

          if (vn > 0) {
            // Moving towards each other
            const impulse = (2 * vn) / (p1.mass + p2.mass);
            p1.vx -= impulse * p2.mass * nx;
            p1.vy -= impulse * p2.mass * ny;
            p2.vx += impulse * p1.mass * nx;
            p2.vy += impulse * p1.mass * ny;
          }
        }
      }
    }

    // 3. Accumulate Pressure calculation
    this.pressureTimeWindow += dt;
    if (this.pressureTimeWindow >= 0.1) {
      const perimeter = 2 * ((xRight - this.xLeft) + this.H);
      const instantPressure = this.accumulatedImpulse / (perimeter * this.pressureTimeWindow);
      this.pressure = this.pressure * 0.8 + instantPressure * 0.2;

      this.accumulatedImpulse = 0;
      this.pressureTimeWindow = 0;
    }

    // 4. Calculate total energy components for plotting history
    let kineticSum = 0;
    for (const p of this.particles) {
      const v2 = p.vx * p.vx + p.vy * p.vy;
      kineticSum += 0.5 * p.mass * v2;
    }

    // For ideal gas, potential energy is zero, so total energy is purely kinetic
    const kineticAvg = kineticSum / this.particles.length;
    // Map avg kinetic energy back to temperature (T = 0.5 * m * v^2)
    this.temperature = kineticAvg;

    this.history.push({
      t: this.t,
      kineticEnergy: kineticSum,
      potentialEnergy: 0,
      totalEnergy: kineticSum
    });

    if (this.history.length > 200) {
      this.history.shift();
    }

    // 5. Calculate Shannon entropy of mixing in diffusion mode
    if (this.config.mode === 'diffusion') {
      const gridM = 4; // 4x4 grid
      const cellCounts: { countA: number; countB: number }[][] = Array.from({ length: gridM }, () =>
        Array.from({ length: gridM }, () => ({ countA: 0, countB: 0 }))
      );

      const xRight = this.xLeft + this.volume * 2.4;
      const width = xRight - this.xLeft;
      const height = this.H;

      for (const p of this.particles) {
        // Find grid cell coordinates
        const cellX = Math.max(0, Math.min(gridM - 1, Math.floor(((p.x - this.xLeft) / width) * gridM)));
        const cellY = Math.max(0, Math.min(gridM - 1, Math.floor(((p.y - this.yBottom) / height) * gridM)));
        if (p.species === 'A') {
          cellCounts[cellX][cellY].countA++;
        } else {
          cellCounts[cellX][cellY].countB++;
        }
      }

      let entropySum = 0;
      for (let i = 0; i < gridM; i++) {
        for (let j = 0; j < gridM; j++) {
          const cA = cellCounts[i][j].countA;
          const cB = cellCounts[i][j].countB;
          const total = cA + cB;
          if (total > 0) {
            const pA = cA / total;
            const pB = cB / total;
            const termA = pA > 0 ? -pA * Math.log(pA) : 0;
            const termB = pB > 0 ? -pB * Math.log(pB) : 0;
            entropySum += termA + termB;
          }
        }
      }

      // Average entropy over all grid cells
      this.entropy = entropySum / (gridM * gridM);

      // Record entropy history if the barrier is open
      if (!this.barrierClosed) {
        this.entropyHistory.push({
          t: this.t,
          entropy: this.entropy
        });

        if (this.entropyHistory.length > 200) {
          this.entropyHistory.shift();
        }
      } else {
        this.entropyHistory = [];
      }
    } else {
      this.entropy = 0;
      this.entropyHistory = [];
    }
  }

  public draw(): void {
    if (!this.config) return;

    this.pc.clear();
    this.pc.resetOrigin();

    // Center container vertically
    this.pc.originX = this.pc.canvas.clientWidth / 2 - 100 + this.pc.panX;
    this.pc.originY = this.pc.canvas.clientHeight / 2 + this.pc.panY;

    const xRight = this.xLeft + this.volume * 2.4;
    const xMax = this.xLeft + 5.0 * 2.4; // Maximum cylinder length
    const xMid = (this.xLeft + xRight) / 2;

    const sLeftBottom = this.pc.toScreen(this.xLeft, this.yBottom);
    const sMaxRightTop = this.pc.toScreen(xMax, this.yTop);
    const sRightTop = this.pc.toScreen(xRight, this.yTop);

    const boxW = sRightTop.x - sLeftBottom.x;
    const boxH = sLeftBottom.y - sRightTop.y;

    // 1. Draw container chamber backfill (active gas volume area)
    this.pc.ctx.save();
    this.pc.ctx.fillStyle = this.pc.theme === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)';
    this.pc.ctx.fillRect(sLeftBottom.x, sRightTop.y, boxW, boxH);
    this.pc.ctx.restore();

    // 2. Draw outer container casing
    if (this.config.mode === 'diffusion') {
      // Draw closed rectangle casing
      this.pc.ctx.save();
      this.pc.ctx.strokeStyle = this.pc.theme === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)';
      this.pc.ctx.lineWidth = 5;
      this.pc.ctx.strokeRect(sLeftBottom.x, sRightTop.y, boxW, boxH);
      this.pc.ctx.restore();
    } else {
      // Draw open U-shaped cylinder casing
      this.pc.ctx.save();
      this.pc.ctx.strokeStyle = this.pc.theme === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)';
      this.pc.ctx.lineWidth = 5;
      this.pc.ctx.lineCap = 'round';
      this.pc.ctx.beginPath();
      // Start at top-right of the maximum casing length
      this.pc.ctx.moveTo(sMaxRightTop.x, sMaxRightTop.y);
      // Line to top-left
      this.pc.ctx.lineTo(sLeftBottom.x, sMaxRightTop.y);
      // Line to bottom-left
      this.pc.ctx.lineTo(sLeftBottom.x, sLeftBottom.y);
      // Line to bottom-right
      this.pc.ctx.lineTo(sMaxRightTop.x, sLeftBottom.y);
      this.pc.ctx.stroke();
      this.pc.ctx.restore();
    }

    // 3. Draw heat source (flame) or sink (ice blocks) underneath the active chamber
    if (this.heatTransfer === 'heating') {
      this.pc.ctx.save();
      const burnerWidth = Math.min(120, boxW - 20);
      const burnerCenterX = (sLeftBottom.x + sRightTop.x) / 2;
      const burnerTopY = sLeftBottom.y + 10;
      const burnerHeight = 30;
      const timeSeed = Date.now() * 0.005;

      this.pc.ctx.beginPath();
      this.pc.ctx.moveTo(burnerCenterX - burnerWidth / 2, burnerTopY + burnerHeight);

      const steps = 5;
      const stepWidth = burnerWidth / steps;
      for (let i = 0; i <= steps; i++) {
        const x = burnerCenterX - burnerWidth / 2 + i * stepWidth;
        const heightNoise = 10 * Math.sin(timeSeed + i * 1.5) + 5 * Math.cos(timeSeed * 0.7 + i);
        const y = burnerTopY + (i % 2 === 0 ? 0 : -10) + heightNoise;

        if (i === 0) {
          this.pc.ctx.lineTo(x, y);
        } else {
          const prevX = x - stepWidth;
          const prevY = burnerTopY + ((i - 1) % 2 === 0 ? 0 : -10) + (10 * Math.sin(timeSeed + (i - 1) * 1.5) + 5 * Math.cos(timeSeed * 0.7 + (i - 1)));
          const cpX = (prevX + x) / 2;
          const cpY = Math.min(prevY, y) - 15;
          this.pc.ctx.quadraticCurveTo(cpX, cpY, x, y);
        }
      }
      this.pc.ctx.lineTo(burnerCenterX + burnerWidth / 2, burnerTopY + burnerHeight);
      this.pc.ctx.closePath();

      const flameGrad = this.pc.ctx.createLinearGradient(burnerCenterX, burnerTopY - 15, burnerCenterX, burnerTopY + burnerHeight);
      flameGrad.addColorStop(0, 'rgba(253, 224, 71, 0.9)');  // Yellow
      flameGrad.addColorStop(0.4, 'rgba(249, 115, 22, 0.85)'); // Orange
      flameGrad.addColorStop(0.8, 'rgba(239, 68, 68, 0.7)');   // Red
      flameGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');

      this.pc.ctx.fillStyle = flameGrad;
      this.pc.ctx.shadowBlur = 15;
      this.pc.ctx.shadowColor = '#f97316';
      this.pc.ctx.fill();
      this.pc.ctx.restore();
    } else if (this.heatTransfer === 'cooling') {
      this.pc.ctx.save();
      const iceBlockSize = 20;
      const burnerCenterX = (sLeftBottom.x + sRightTop.x) / 2;
      const iceTopY = sLeftBottom.y + 10;

      const numBlocks = Math.max(3, Math.min(6, Math.floor(boxW / (iceBlockSize + 6))));
      const spacing = 6;
      const totalWidth = numBlocks * iceBlockSize + (numBlocks - 1) * spacing;
      const startX = burnerCenterX - totalWidth / 2;

      for (let i = 0; i < numBlocks; i++) {
        const x = startX + i * (iceBlockSize + spacing);
        const y = iceTopY + (i % 2 === 0 ? 2 : 5);

        this.pc.ctx.fillStyle = 'rgba(186, 230, 253, 0.75)';
        this.pc.ctx.strokeStyle = 'rgba(125, 211, 252, 0.9)';
        this.pc.ctx.lineWidth = 1.5;

        const radius = 4;
        this.pc.ctx.beginPath();
        this.pc.ctx.moveTo(x + radius, y);
        this.pc.ctx.lineTo(x + iceBlockSize - radius, y);
        this.pc.ctx.quadraticCurveTo(x + iceBlockSize, y, x + iceBlockSize, y + radius);
        this.pc.ctx.lineTo(x + iceBlockSize, y + iceBlockSize - radius);
        this.pc.ctx.quadraticCurveTo(x + iceBlockSize, y + iceBlockSize, x + iceBlockSize - radius, y + iceBlockSize);
        this.pc.ctx.lineTo(x + radius, y + iceBlockSize);
        this.pc.ctx.quadraticCurveTo(x, y + iceBlockSize, x, y + iceBlockSize - radius);
        this.pc.ctx.lineTo(x, y + radius);
        this.pc.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.pc.ctx.closePath();
        this.pc.ctx.fill();
        this.pc.ctx.stroke();

        this.pc.ctx.strokeStyle = '#ffffff';
        this.pc.ctx.lineWidth = 2;
        this.pc.ctx.beginPath();
        this.pc.ctx.moveTo(x + 3, y + iceBlockSize - 5);
        this.pc.ctx.lineTo(x + 3, y + 3);
        this.pc.ctx.lineTo(x + iceBlockSize - 5, y + 3);
        this.pc.ctx.stroke();
      }
      this.pc.ctx.restore();
    }

    // 4. Draw central barrier in diffusion mode
    if (this.config.mode === 'diffusion' && this.yBarrier < this.yTop) {
      const sBarrierBottom = this.pc.toScreen(xMid, this.yBarrier);
      const sBarrierTop = this.pc.toScreen(xMid, this.yTop);

      this.pc.ctx.save();
      this.pc.ctx.strokeStyle = '#f59e0b'; // Amber colored barrier
      this.pc.ctx.lineWidth = 5;
      this.pc.ctx.beginPath();
      this.pc.ctx.moveTo(sBarrierBottom.x, sBarrierBottom.y);
      this.pc.ctx.lineTo(sBarrierTop.x, sBarrierTop.y);
      this.pc.ctx.stroke();
      this.pc.ctx.restore();
    }

    // 5. Draw particles
    for (const p of this.particles) {
      const sPos = this.pc.toScreen(p.x, p.y);
      const radiusScreen = p.radius * this.pc.scale;

      this.pc.ctx.save();
      this.pc.ctx.fillStyle = p.color;
      this.pc.ctx.strokeStyle = this.pc.theme === 'dark' ? '#fff' : '#000';
      this.pc.ctx.lineWidth = 1.0;
      this.pc.ctx.beginPath();
      this.pc.ctx.arc(sPos.x, sPos.y, radiusScreen, 0, 2 * Math.PI);
      this.pc.ctx.fill();
      this.pc.ctx.stroke();
      this.pc.ctx.restore();
    }

    // 6. Draw movable piston head and horizontal shaft/rod
    if (this.config.mode !== 'diffusion') {
      const pistonWidth = 0.4;
      const sPistonLeft = sRightTop.x;
      const sPistonWidth = pistonWidth * this.pc.scale;
      const sPistonTop = sRightTop.y;

      // Draw rod extending to the right
      const rodRightX = xMax + 1.5;
      const sRodLeft = sPistonLeft + sPistonWidth / 2;
      const sRodRight = this.pc.toScreen(rodRightX, 0).x;
      const sRodY = this.pc.toScreen(0, 0).y;
      const sRodThickness = 0.25 * this.pc.scale;

      this.pc.ctx.save();
      const rodGrad = this.pc.ctx.createLinearGradient(sRodLeft, sRodY - sRodThickness / 2, sRodLeft, sRodY + sRodThickness / 2);
      rodGrad.addColorStop(0, '#708090');
      rodGrad.addColorStop(0.3, '#d1d5db');
      rodGrad.addColorStop(0.7, '#9ca3af');
      rodGrad.addColorStop(1, '#4b5563');

      this.pc.ctx.fillStyle = rodGrad;
      this.pc.ctx.strokeStyle = this.pc.theme === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)';
      this.pc.ctx.lineWidth = 1.5;
      this.pc.ctx.fillRect(sRodLeft, sRodY - sRodThickness / 2, sRodRight - sRodLeft, sRodThickness);
      this.pc.ctx.strokeRect(sRodLeft, sRodY - sRodThickness / 2, sRodRight - sRodLeft, sRodThickness);
      this.pc.ctx.restore();

      // Draw piston head slab
      this.pc.ctx.save();
      const pistonGrad = this.pc.ctx.createLinearGradient(sPistonLeft, sPistonTop, sPistonLeft + sPistonWidth, sPistonTop);
      pistonGrad.addColorStop(0, '#4b5563');
      pistonGrad.addColorStop(0.2, '#9ca3af');
      pistonGrad.addColorStop(0.5, '#f3f4f6');
      pistonGrad.addColorStop(0.8, '#9ca3af');
      pistonGrad.addColorStop(1, '#374151');

      this.pc.ctx.fillStyle = pistonGrad;
      this.pc.ctx.strokeStyle = this.pc.theme === 'dark' ? '#f3f4f6' : '#1f2937';
      this.pc.ctx.lineWidth = 2;

      this.pc.ctx.fillRect(sPistonLeft, sPistonTop, sPistonWidth, boxH);
      this.pc.ctx.strokeRect(sPistonLeft, sPistonTop, sPistonWidth, boxH);

      // Draw grooves
      this.pc.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      this.pc.ctx.lineWidth = 3;
      const ringSpacing = boxH / 4;
      for (let i = 1; i <= 3; i++) {
        const ringY = sPistonTop + i * ringSpacing;
        this.pc.ctx.beginPath();
        this.pc.ctx.moveTo(sPistonLeft + 2, ringY);
        this.pc.ctx.lineTo(sPistonLeft + sPistonWidth - 2, ringY);
        this.pc.ctx.stroke();
      }
      this.pc.ctx.restore();
    }
  }

  public getCarnotLoopPoints(): { x: number; y: number }[] {
    const points: { x: number; y: number }[] = [];
    const N = this.particles.length > 0 ? this.particles.length : (this.config ? this.config.particleCount : 100);
    const gamma = this.gamma;
    const tHot = this.tHot;
    const tCold = this.tCold;
    const vA = this.vA;
    const vB = this.vB;

    const vC = vB * Math.pow(tHot / tCold, 1 / (gamma - 1));
    const vD = vA * Math.pow(tHot / tCold, 1 / (gamma - 1));

    const stepsPerStage = 25;

    // Stage 0: Isothermal Expansion (A -> B)
    for (let i = 0; i <= stepsPerStage; i++) {
      const u = i / stepsPerStage;
      const v = vA + u * (vB - vA);
      const p = (N * tHot) / v;
      points.push({ x: v, y: p });
    }

    // Stage 1: Adiabatic Expansion (B -> C)
    for (let i = 0; i <= stepsPerStage; i++) {
      const u = i / stepsPerStage;
      const v = vB + u * (vC - vB);
      const p = ((N * tHot) / vB) * Math.pow(vB / v, gamma);
      points.push({ x: v, y: p });
    }

    // Stage 2: Isothermal Compression (C -> D)
    for (let i = 0; i <= stepsPerStage; i++) {
      const u = i / stepsPerStage;
      const v = vC - u * (vC - vD);
      const p = (N * tCold) / v;
      points.push({ x: v, y: p });
    }

    // Stage 3: Adiabatic Compression (D -> A)
    for (let i = 0; i <= stepsPerStage; i++) {
      const u = i / stepsPerStage;
      const v = vD - u * (vD - vA);
      const p = ((N * tCold) / vD) * Math.pow(vD / v, gamma);
      points.push({ x: v, y: p });
    }

    return points;
  }

  public getCycleStageColor(): string {
    switch (this.cycleStage) {
      case 0: return '#10b981'; // green for isothermal expansion
      case 1: return '#eab308'; // yellow for adiabatic expansion
      case 2: return '#3b82f6'; // blue for isothermal compression
      case 3: return '#ef4444'; // red for adiabatic compression
      default: return '#8b5cf6';
    }
  }
}
