import type { ShmConfig } from '../types';
import { PhysicsCanvas } from '../PhysicsCanvas';

export interface ShmState {
  t: number;
  x: number; // position (m) or angle (rad)
  v: number; // velocity (m/s) or angular velocity (rad/s)
  kineticEnergy: number;
  potentialEnergy: number;
  totalEnergy: number;
}

export class ShmDiagram {
  private pc: PhysicsCanvas;
  private config!: ShmConfig;

  // Simulation state variables
  public t: number = 0;
  public x: number = 0; // position or angle (radians)
  public v: number = 0; // velocity or angular velocity
  public history: ShmState[] = [];
  private maxHistoryLen = 200;

  constructor(pc: PhysicsCanvas) {
    this.pc = pc;
  }

  public setConfig(config: ShmConfig): void {
    this.config = config;
    this.resetState();
  }

  public resetState(): void {
    if (!this.config) return;
    this.t = 0;
    this.history = [];

    const { systemType, initialDisplacement, initialVelocity } = this.config;

    if (systemType === 'simple-pendulum') {
      // Convert initial displacement from degrees to radians
      this.x = initialDisplacement * (Math.PI / 180);
      this.v = initialVelocity; // in rad/s
    } else {
      this.x = initialDisplacement; // in meters
      this.v = initialVelocity; // in m/s
    }
  }

  // Physics Euler-Cromer Solver Step
  public step(dt: number): void {
    if (!this.config) return;

    const { systemType, mass, springK, length, gravity, damping, drivingForce, drivingFreq } = this.config;

    const m = mass;
    const g = gravity;
    const b = damping;
    const Fd = drivingForce;
    const wd = drivingFreq;

    let a = 0; // acceleration or angular acceleration

    if (systemType === 'spring-mass-horizontal' || systemType === 'spring-mass-vertical') {
      const k = springK;
      // Equation of motion: m*x'' + b*x' + k*x = F_d*cos(w_d*t)
      // a = x'' = (-k*x - b*v + F_d*cos(w_d*t)) / m
      const springF = -k * this.x;
      const dampingF = -b * this.v;
      const drivingF = Fd * Math.cos(wd * this.t);

      a = (springF + dampingF + drivingF) / m;
      this.v += a * dt;
      this.x += this.v * dt;

    } else if (systemType === 'simple-pendulum') {
      const L = length;
      // Equation of motion: m*L^2 * theta'' + b*L^2 * theta' + m*g*L*sin(theta) = F_d*cos(w_d*t)
      // theta'' = (-m*g*L*sin(theta) - b*L^2*theta' + F_d*cos(w_d*t)) / (m*L^2)
      // theta'' = -(g/L)*sin(theta) - (b/m)*theta' + F_d/(m*L^2)*cos(w_d*t)
      const gravityTorque = -m * g * L * Math.sin(this.x);
      const dampingTorque = -b * L * L * this.v;
      const drivingTorque = Fd * Math.cos(wd * this.t);
      const MoI = m * L * L; // Moment of Inertia

      a = (gravityTorque + dampingTorque + drivingTorque) / MoI;
      this.v += a * dt;
      this.x += this.v * dt;
    }

    this.t += dt;

    // Calculate energy
    let kinetic = 0;
    let potential = 0;

    if (systemType === 'spring-mass-horizontal' || systemType === 'spring-mass-vertical') {
      const k = springK;
      kinetic = 0.5 * m * this.v * this.v;
      potential = 0.5 * k * this.x * this.x;
    } else if (systemType === 'simple-pendulum') {
      const L = length;
      // KE = 0.5 * I * omega^2 = 0.5 * (m*L^2) * v^2
      kinetic = 0.5 * m * L * L * this.v * this.v;
      // PE = m*g*h = m*g*L*(1 - cos(theta))
      potential = m * g * L * (1 - Math.cos(this.x));
    }

    const total = kinetic + potential;

    // Save history
    this.history.push({
      t: this.t,
      x: this.x,
      v: this.v,
      kineticEnergy: kinetic,
      potentialEnergy: potential,
      totalEnergy: total
    });

    if (this.history.length > this.maxHistoryLen) {
      this.history.shift();
    }
  }

  // Draw simulation state
  public draw(): void {
    if (!this.config) return;

    this.pc.clear();
    this.pc.resetOrigin();

    const { systemType } = this.config;

    // Setup coordinates for SHM
    if (systemType === 'spring-mass-horizontal') {
      this.pc.originX = this.pc.canvas.clientWidth * 0.25; // Wall on the left
      this.pc.originY = this.pc.canvas.clientHeight * 0.6; // Ground line
      this.drawHorizontalSpringMass();
    } else if (systemType === 'spring-mass-vertical') {
      this.pc.originX = this.pc.canvas.clientWidth / 2;
      this.pc.originY = this.pc.canvas.clientHeight * 0.25; // Ceiling top
      this.drawVerticalSpringMass();
    } else if (systemType === 'simple-pendulum') {
      this.pc.originX = this.pc.canvas.clientWidth / 2;
      this.pc.originY = this.pc.canvas.clientHeight * 0.25; // Pivot top
      this.drawPendulum();
    }
  }

  private drawHorizontalSpringMass(): void {
    const k = this.config.springK;
    const m = this.config.mass;

    // Render floor
    this.drawFloor(-3, 8);

    // Wall at x = -2
    const wallX = -2;
    this.drawWall(wallX, 0, 1.5);

    // Block position (equilibrium at x = 2)
    const eqX = 2;
    const bx = eqX + this.x;
    const by = 0.5;
    const bw = 1.0;
    const bh = 1.0;

    // Draw Spring from wall to block edge
    this.pc.drawSpring(wallX, by, bx - bw / 2, by, 15, 12, '#4f46e5');

    // Draw equilibrium marker line
    this.pc.ctx.save();
    this.pc.ctx.strokeStyle = '#f59e0b';
    this.pc.ctx.setLineDash([2, 4]);
    this.pc.ctx.lineWidth = 1.5;
    const sEq = this.pc.toScreen(eqX, -0.5);
    const sEqTop = this.pc.toScreen(eqX, 1.5);
    this.pc.ctx.beginPath();
    this.pc.ctx.moveTo(sEq.x, sEq.y);
    this.pc.ctx.lineTo(sEqTop.x, sEqTop.y);
    this.pc.ctx.stroke();
    
    // Draw label "x=0" (equilibrium)
    this.pc.ctx.fillStyle = '#f59e0b';
    this.pc.ctx.font = '10px Outfit, sans-serif';
    this.pc.ctx.fillText('Equilibrium (x=0)', sEqTop.x + 5, sEqTop.y + 10);
    this.pc.ctx.restore();

    // Draw block
    this.pc.drawBlock(bx, by, bw, bh, 0, '#3b82f6', `${m} kg`);

    // Draw physical vectors on the block
    const vecScale = 0.5; // velocity scale for drawing
    const forceScale = 0.15;

    // 1. Displacement vector (orange) from equilibrium to block center
    this.pc.drawArrow(eqX, by + 1.2, bx, by + 1.2, '#f59e0b', `x = ${this.x.toFixed(2)}m`, { labelOffset: -12 });

    // 2. Velocity vector (green) originating from block center
    if (Math.abs(this.v) > 0.05) {
      this.pc.drawArrow(bx, by, bx + this.v * vecScale, by, '#10b981', `v = ${this.v.toFixed(2)}m/s`, { labelOffset: 12 });
    }

    // 3. Spring restoring force (purple) from block center back to equilibrium
    const Fs = -k * this.x;
    if (Math.abs(Fs) > 0.1) {
      this.pc.drawArrow(bx, by - 1.2, bx + Fs * forceScale, by - 1.2, '#a855f7', `Fs = ${Fs.toFixed(1)}N`);
    }
  }

  private drawVerticalSpringMass(): void {
    const k = this.config.springK;
    const m = this.config.mass;
    const g = this.config.gravity;

    // Ceiling line
    this.drawCeiling(-3, 3);

    // Equilibrium calculation (including gravity stretch delta_x = mg/k)
    // Equilibrium position is at y = -length_unstretched - mg/k
    const unstretchedLength = 2.0;
    const stretchEq = (m * g) / k;
    const eqY = -unstretchedLength - stretchEq;
    const by = eqY + this.x; // Block center
    const bx = 0;
    const bw = 1.0;
    const bh = 1.0;

    // Spring from ceiling (0, 0) to top of block (bx, by + bh/2)
    this.pc.drawSpring(0, 0, bx, by + bh/2, 16, 12, '#4f46e5');

    // Draw equilibrium line
    this.pc.ctx.save();
    this.pc.ctx.strokeStyle = '#f59e0b';
    this.pc.ctx.setLineDash([2, 4]);
    this.pc.ctx.lineWidth = 1.5;
    const sEqLeft = this.pc.toScreen(-2, eqY);
    const sEqRight = this.pc.toScreen(2, eqY);
    this.pc.ctx.beginPath();
    this.pc.ctx.moveTo(sEqLeft.x, sEqLeft.y);
    this.pc.ctx.lineTo(sEqRight.x, sEqRight.y);
    this.pc.ctx.stroke();
    
    this.pc.ctx.fillStyle = '#f59e0b';
    this.pc.ctx.font = '10px Outfit, sans-serif';
    this.pc.ctx.fillText('Equilibrium (y_eq)', sEqRight.x - 85, sEqRight.y - 5);
    this.pc.ctx.restore();

    // Draw block
    this.pc.drawBlock(bx, by, bw, bh, 0, '#3b82f6', `${m} kg`);

    // Vectors
    const vecScale = 0.5;
    const forceScale = 0.15;

    // 1. Displacement (orange)
    this.pc.drawArrow(bx - 1.2, eqY, bx - 1.2, by, '#f59e0b', `y = ${this.x.toFixed(2)}m`, { labelOffset: -15 });

    // 2. Velocity (green)
    if (Math.abs(this.v) > 0.05) {
      this.pc.drawArrow(bx, by, bx, by + this.v * vecScale, '#10b981', `v = ${this.v.toFixed(2)}m/s`, { labelOffset: 15 });
    }

    // 3. Restoring spring force (Fs = -k * x)
    const Fs = -k * this.x;
    if (Math.abs(Fs) > 0.1) {
      this.pc.drawArrow(bx + 1.2, by, bx + 1.2, by + Fs * forceScale, '#a855f7', `Fs = ${Fs.toFixed(1)}N`, { labelOffset: 15 });
    }
  }

  private drawPendulum(): void {
    const L = this.config.length;
    const m = this.config.mass;
    const theta = this.x;

    // Ceiling
    this.drawCeiling(-2, 2);

    // Pivot center at 0, 0
    this.pc.ctx.save();
    this.pc.ctx.fillStyle = this.pc.theme === 'dark' ? '#fff' : '#000';
    const sPivot = this.pc.toScreen(0, 0);
    this.pc.ctx.beginPath();
    this.pc.ctx.arc(sPivot.x, sPivot.y, 6, 0, 2 * Math.PI);
    this.pc.ctx.fill();
    this.pc.ctx.restore();

    // Bob position: x = L*sin(theta), y = -L*cos(theta)
    const bobX = L * Math.sin(theta);
    const bobY = -L * Math.cos(theta);

    // String line
    this.pc.ctx.save();
    this.pc.ctx.strokeStyle = this.pc.theme === 'dark' ? '#ccc' : '#444';
    this.pc.ctx.lineWidth = 1.8;
    const sBob = this.pc.toScreen(bobX, bobY);
    this.pc.ctx.beginPath();
    this.pc.ctx.moveTo(sPivot.x, sPivot.y);
    this.pc.ctx.lineTo(sBob.x, sBob.y);
    this.pc.ctx.stroke();
    this.pc.ctx.restore();

    // Draw central alignment guideline
    this.pc.ctx.save();
    this.pc.ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    if (this.pc.theme === 'light') this.pc.ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    this.pc.ctx.setLineDash([3, 5]);
    this.pc.ctx.beginPath();
    this.pc.ctx.moveTo(sPivot.x, sPivot.y);
    this.pc.ctx.lineTo(sPivot.x, sPivot.y + L * this.pc.scale);
    this.pc.ctx.stroke();
    this.pc.ctx.restore();

    // Draw angle arc at pivot
    const thetaDeg = theta * (180 / Math.PI);
    this.pc.drawAngleArc(0, 0, 50, -90, -90 + thetaDeg, '#f59e0b', `${Math.abs(thetaDeg).toFixed(1)}°`);

    // Draw bob (circle mass)
    this.pc.ctx.save();
    this.pc.ctx.fillStyle = '#3b82f6';
    this.pc.ctx.strokeStyle = this.pc.theme === 'dark' ? '#fff' : '#000';
    this.pc.ctx.lineWidth = 2;
    this.pc.ctx.beginPath();
    const radius = 15 + m * 2; // radius based on mass
    this.pc.ctx.arc(sBob.x, sBob.y, radius, 0, 2 * Math.PI);
    this.pc.ctx.fill();
    this.pc.ctx.stroke();

    // Draw mass text inside bob
    this.pc.ctx.fillStyle = '#fff';
    this.pc.ctx.font = 'bold 9px Outfit, sans-serif';
    this.pc.ctx.textAlign = 'center';
    this.pc.ctx.textBaseline = 'middle';
    this.pc.ctx.fillText(`${m}kg`, sBob.x, sBob.y);
    this.pc.ctx.restore();

    // Velocity vector (tangential to path)
    const vecScale = 0.5;
    if (Math.abs(this.v) > 0.05) {
      // Tangential velocity vector: dx = v * cos(theta), dy = v * sin(theta)
      const tangentX = this.v * Math.cos(theta);
      const tangentY = this.v * Math.sin(theta);
      this.pc.drawArrow(
        bobX, bobY,
        bobX + tangentX * vecScale, bobY + tangentY * vecScale,
        '#10b981', `v = ${(this.v * L).toFixed(2)}m/s`
      );
    }
  }

  private drawFloor(xStart: number, xEnd: number): void {
    const y = 0;
    const start = this.pc.toScreen(xStart, y);
    const end = this.pc.toScreen(xEnd, y);

    this.pc.ctx.save();
    this.pc.ctx.strokeStyle = this.pc.theme === 'dark' ? '#888' : '#444';
    this.pc.ctx.lineWidth = 4;
    this.pc.ctx.beginPath();
    this.pc.ctx.moveTo(start.x, start.y);
    this.pc.ctx.lineTo(end.x, end.y);
    this.pc.ctx.stroke();

    this.pc.ctx.restore();
  }

  private drawWall(x: number, yBottom: number, yTop: number): void {
    const bottom = this.pc.toScreen(x, yBottom);
    const top = this.pc.toScreen(x, yTop);

    this.pc.ctx.save();
    this.pc.ctx.strokeStyle = this.pc.theme === 'dark' ? '#888' : '#444';
    this.pc.ctx.lineWidth = 4;
    this.pc.ctx.beginPath();
    this.pc.ctx.moveTo(bottom.x, bottom.y);
    this.pc.ctx.lineTo(top.x, top.y);
    this.pc.ctx.stroke();

    // wall hatching
    this.pc.ctx.strokeStyle = this.pc.theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)';
    this.pc.ctx.lineWidth = 1.5;
    for (let sy = top.y; sy <= bottom.y; sy += 8) {
      this.pc.ctx.beginPath();
      this.pc.ctx.moveTo(bottom.x, sy);
      this.pc.ctx.lineTo(bottom.x - 6, sy + 6);
      this.pc.ctx.stroke();
    }

    this.pc.ctx.restore();
  }

  private drawCeiling(xStart: number, xEnd: number): void {
    const y = 0;
    const start = this.pc.toScreen(xStart, y);
    const end = this.pc.toScreen(xEnd, y);

    this.pc.ctx.save();
    this.pc.ctx.strokeStyle = this.pc.theme === 'dark' ? '#888' : '#444';
    this.pc.ctx.lineWidth = 4;
    this.pc.ctx.beginPath();
    this.pc.ctx.moveTo(start.x, start.y);
    this.pc.ctx.lineTo(end.x, end.y);
    this.pc.ctx.stroke();

    // ceiling hatching
    this.pc.ctx.strokeStyle = this.pc.theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)';
    this.pc.ctx.lineWidth = 1.5;
    for (let sx = start.x; sx <= end.x; sx += 8) {
      this.pc.ctx.beginPath();
      this.pc.ctx.moveTo(sx, start.y);
      this.pc.ctx.lineTo(sx + 6, start.y - 6);
      this.pc.ctx.stroke();
    }

    this.pc.ctx.restore();
  }
}
