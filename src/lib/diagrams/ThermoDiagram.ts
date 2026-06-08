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

    // 1. Solve thermodynamic transition formulas and update volume/temperature
    let targetVolume = this.config.volume;
    if (this.activeProcess === 'isochoric') {
      targetVolume = this.v0;
    }

    // Smoothly transition volume towards target
    this.volume += (targetVolume - this.volume) * (1 - Math.exp(-10 * dt));
    // Keep volume in bounds
    this.volume = Math.max(1.0, Math.min(5.0, this.volume));

    let targetT = this.temperature;

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
  }

  public draw(): void {
    if (!this.config) return;

    this.pc.clear();
    this.pc.resetOrigin();

    // Center container vertically
    this.pc.originX = this.pc.canvas.clientWidth / 2 - 100 + this.pc.panX;
    this.pc.originY = this.pc.canvas.clientHeight / 2 + this.pc.panY;

    const xRight = this.xLeft + this.volume * 2.4;
    const xMid = (this.xLeft + xRight) / 2;

    const sLeftBottom = this.pc.toScreen(this.xLeft, this.yBottom);
    const sRightTop = this.pc.toScreen(xRight, this.yTop);

    const boxW = sRightTop.x - sLeftBottom.x;
    const boxH = sLeftBottom.y - sRightTop.y;

    // 1. Draw container chamber backfill
    this.pc.ctx.save();
    this.pc.ctx.fillStyle = this.pc.theme === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)';
    this.pc.ctx.fillRect(sLeftBottom.x, sRightTop.y, boxW, boxH);
    this.pc.ctx.restore();

    // 2. Draw active container border lines
    this.pc.ctx.save();
    this.pc.ctx.strokeStyle = this.pc.theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';
    this.pc.ctx.lineWidth = 4;
    this.pc.ctx.strokeRect(sLeftBottom.x, sRightTop.y, boxW, boxH);
    this.pc.ctx.restore();

    // 3. Draw central barrier in diffusion mode
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

    // 4. Draw particles
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
  }
}
