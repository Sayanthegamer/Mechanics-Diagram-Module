import type { FluidsConfig } from '../types';
import { PhysicsCanvas } from '../PhysicsCanvas';

export interface FluidsState {
  t: number;
  blockY: number;
  blockVy: number;
  pressureGauge: number;
}

interface StreamlineParticle {
  x: number;
  lane: number; // 0 to 4
}

export class FluidsDiagram {
  private config!: FluidsConfig;

  // Physical State Variables
  public t: number = 0;
  
  // Buoyancy specific state
  public blockY: number = 2.0; // vertical position in physics coordinates (meters)
  public blockVy: number = 0;   // vertical velocity (m/s)
  public blockVx: number = 0;   // horizontal velocity (m/s)
  public blockX: number = 0;    // horizontal position

  // Pascal specific state
  public pistonOffset: number = 0; // vertical shift in meters (left down, right up)

  // Dragging Probe state
  public probeX: number = 2.0;
  public probeY: number = 1.0;

  // Bernoulli specific state
  private particles: StreamlineParticle[] = [];

  // Viscosity specific state
  public sphereY: number = 3.0;
  public sphereVy: number = 0;

  // History for plotting
  public history: FluidsState[] = [];
  private readonly maxHistory = 500;

  // Flag for atmospheric pressure toggle
  public showAtmosphericPressure: boolean = true;

  constructor(_pc: PhysicsCanvas) {
    this.resetState();
  }

  public setConfig(config: FluidsConfig): void {
    const isNewMode = !this.config || this.config.mode !== config.mode;
    this.config = config;
    if (isNewMode) {
      this.resetState();
    }
  }

  public resetState(): void {
    this.t = 0;
    this.blockY = 2.5; // start slightly above water
    this.blockVy = 0;
    this.blockVx = 0;
    this.blockX = 0;
    this.pistonOffset = 0;
    this.probeX = 1.8;
    this.probeY = 1.2;
    this.sphereY = 3.0;
    this.sphereVy = 0;
    this.history = [];

    // Initialize Bernoulli streamline particles
    this.particles = [];
    for (let i = 0; i < 35; i++) {
      this.particles.push({
        x: -2.5 + Math.random() * 5.0,
        lane: Math.floor(Math.random() * 5)
      });
    }
  }

  // Get pipe diameter at position x for Venturi tube
  public getPipeDiameter(x: number): number {
    if (!this.config || this.config.mode !== 'bernoulli') return 1.0;
    const d1 = this.config.bernoulli.diameter1;
    const d2 = this.config.bernoulli.diameter2;
    // Throat at center x=0, opening up smoothly to ends x = -2.5 and +2.5
    // Simple Gaussian transition profile
    return d1 - (d1 - d2) * Math.exp(-(x * x) / 0.8);
  }

  // Find nearest draggable target node
  public getDragTarget(physicsPt: { x: number; y: number }): 'block' | 'probe' | 'piston1' | 'piston2' | 'sphere' | null {
    if (!this.config) return null;

    if (this.config.mode === 'buoyancy') {
      const dxBlock = physicsPt.x - this.blockX;
      const dyBlock = physicsPt.y - this.blockY;
      const distBlock = Math.sqrt(dxBlock * dxBlock + dyBlock * dyBlock);
      if (distBlock < 0.6) return 'block';

      const dxProbe = physicsPt.x - this.probeX;
      const dyProbe = physicsPt.y - this.probeY;
      const distProbe = Math.sqrt(dxProbe * dxProbe + dyProbe * dyProbe);
      if (distProbe < 0.4) return 'probe';
    } else if (this.config.mode === 'pascal') {
      const leftPistonX = -2.0;
      const rightPistonX = 2.0;
      const leftPistonY = 1.5 - this.pistonOffset;
      const rightPistonY = 1.5 + this.pistonOffset * (this.config.pascal.area1 / this.config.pascal.area2);

      const dxLeft = physicsPt.x - leftPistonX;
      const dyLeft = physicsPt.y - leftPistonY;
      const distLeft = Math.sqrt(dxLeft * dxLeft + dyLeft * dyLeft);

      const dxRight = physicsPt.x - rightPistonX;
      const dyRight = physicsPt.y - rightPistonY;
      const distRight = Math.sqrt(dxRight * dxRight + dyRight * dyRight);

      if (distLeft < 0.6) return 'piston1';
      if (distRight < 0.8) return 'piston2';
    } else if (this.config.mode === 'viscosity') {
      const dxSphere = physicsPt.x - 0.0;
      const dySphere = physicsPt.y - this.sphereY;
      const distSphere = Math.sqrt(dxSphere * dxSphere + dySphere * dySphere);
      if (distSphere < 0.5) return 'sphere';
    }

    return null;
  }

  // Drag handler modifier
  public updateDrag(target: 'block' | 'probe' | 'piston1' | 'piston2' | 'sphere', physicsPt: { x: number; y: number }): void {
    if (!this.config) return;

    if (target === 'block') {
      this.blockX = Math.max(-1.5, Math.min(1.5, physicsPt.x));
      this.blockY = Math.max(0.3, Math.min(3.5, physicsPt.y));
      this.blockVy = 0;
    } else if (target === 'probe') {
      this.probeX = Math.max(-1.8, Math.min(1.8, physicsPt.x));
      this.probeY = Math.max(0.1, Math.min(3.3, physicsPt.y));
    } else if (target === 'piston1') {
      const deltaY = 1.5 - physicsPt.y;
      this.pistonOffset = Math.max(-0.8, Math.min(0.8, deltaY));
    } else if (target === 'piston2') {
      const areaRatio = this.config.pascal.area1 / this.config.pascal.area2;
      const deltaY = physicsPt.y - 1.5;
      this.pistonOffset = Math.max(-0.8, Math.min(0.8, deltaY / areaRatio));
    } else if (target === 'sphere') {
      this.sphereY = Math.max(0.4, Math.min(3.2, physicsPt.y));
      this.sphereVy = 0;
    }
  }

  public step(dt: number): void {
    if (!this.config) return;
    this.t += dt;

    if (this.config.mode === 'buoyancy') {
      const { fluidDensity, blockMass, blockVolume, gravity } = this.config.buoyancy;
      const m = blockMass;
      const g = gravity;

      const containerBottom = 0.2;
      const fluidLevel = 2.0;

      const blockHeight = Math.pow(blockVolume, 1/3);
      const blockBottom = this.blockY - blockHeight / 2;
      const blockTop = this.blockY + blockHeight / 2;
      
      let hSub = 0;
      if (blockTop <= fluidLevel) {
        hSub = blockHeight;
      } else if (blockBottom >= fluidLevel) {
        hSub = 0;
      } else {
        hSub = fluidLevel - blockBottom;
      }

      const vSub = blockVolume * (hSub / blockHeight);
      
      const Fg = m * g;
      const Fb = fluidDensity * vSub * g;
      const dampingCoeff = 8.0;
      const Fd = -dampingCoeff * this.blockVy * (vSub / blockVolume);

      const Fnet = Fb - Fg + Fd;
      const ay = Fnet / m;

      this.blockVy += ay * dt;
      this.blockY += this.blockVy * dt;

      const blockMinY = containerBottom + blockHeight / 2;
      if (this.blockY < blockMinY) {
        this.blockY = blockMinY;
        this.blockVy = 0;
      }
    } else if (this.config.mode === 'bernoulli') {
      const { flowRate } = this.config.bernoulli;
      // Step streamline particles
      this.particles.forEach((p) => {
        const d = this.getPipeDiameter(p.x);
        const area = Math.PI * (d / 2) * (d / 2);
        // Speed in m/s (1D along horizontal axis x)
        const speed = flowRate / area;
        
        p.x += speed * dt;
        if (p.x > 2.5) {
          p.x = -2.5;
          p.lane = Math.floor(Math.random() * 5);
        }
      });
    } else if (this.config.mode === 'viscosity') {
      const { fluidDensity, viscosity, sphereRadius, sphereDensity, gravity } = this.config.viscosity;
      const g = gravity;
      const r = sphereRadius;
      const rhoSphere = sphereDensity;
      const rhoFluid = fluidDensity;

      // Sphere properties
      const volume = (4 / 3) * Math.PI * Math.pow(r, 3);
      const m = volume * rhoSphere;

      const Fg = m * g;
      const Fb = volume * rhoFluid * g;
      // Stokes' Law: Fd = 6 * pi * eta * r * v
      // Speed is downward positive, velocity sign handled explicitly
      const Fd = 6 * Math.PI * viscosity * r * (-this.sphereVy);

      // Sphere acceleration
      const Fnet = Fb + Fd - Fg; // Y coordinates: Fg acts down, Fb and Fd act up
      const ay = Fnet / m;

      this.sphereVy += ay * dt;
      this.sphereY += this.sphereVy * dt;

      // Container bottom constraint
      const bottomLimit = 0.4;
      if (this.sphereY < bottomLimit) {
        this.sphereY = bottomLimit;
        this.sphereVy = 0;
      }
    }

    // Append to graph history
    const pressure = this.getProbePressure();
    this.history.push({
      t: this.t,
      blockY: this.config.mode === 'viscosity' ? this.sphereY : this.blockY,
      blockVy: this.config.mode === 'viscosity' ? this.sphereVy : this.blockVy,
      pressureGauge: pressure
    });
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  // Get current pressure at probe tip
  public getProbePressure(): number {
    if (!this.config) return 0;
    
    let fluidDensity = 1000;
    let gravity = 9.81;
    let fluidLevel = 2.0;

    if (this.config.mode === 'buoyancy') {
      fluidDensity = this.config.buoyancy.fluidDensity;
      gravity = this.config.buoyancy.gravity;
    } else if (this.config.mode === 'pascal') {
      fluidDensity = 1000;
      gravity = this.config.pascal.gravity;
      if (this.probeX < 0) {
        fluidLevel = 1.5 - this.pistonOffset;
      } else {
        fluidLevel = 1.5 + this.pistonOffset * (this.config.pascal.area1 / this.config.pascal.area2);
      }
    } else if (this.config.mode === 'bernoulli') {
      fluidDensity = this.config.bernoulli.fluidDensity;
      gravity = 9.81;
      
      const { flowRate, diameter1 } = this.config.bernoulli;
      // Continuity and Bernoulli solvers
      const dInlet = diameter1;
      const aInlet = Math.PI * (dInlet / 2) * (dInlet / 2);
      const vInlet = flowRate / aInlet;

      const dLocal = this.getPipeDiameter(this.probeX);
      const aLocal = Math.PI * (dLocal / 2) * (dLocal / 2);
      const vLocal = flowRate / aLocal;

      const pInlet = 5000; // Reference pressure at inlet (in Pa)
      const pLocal = pInlet + 0.5 * fluidDensity * (vInlet * vInlet - vLocal * vLocal);
      
      const Patm = this.showAtmosphericPressure ? 101325 : 0;
      return Patm + Math.max(0, pLocal);
    } else if (this.config.mode === 'viscosity') {
      fluidDensity = this.config.viscosity.fluidDensity;
      gravity = this.config.viscosity.gravity;
      fluidLevel = 3.5;
    }

    const depth = Math.max(0, fluidLevel - this.probeY);
    const Pgauge = fluidDensity * gravity * depth;
    const Patm = this.showAtmosphericPressure ? 101325 : 0;
    return Patm + Pgauge;
  }

  public draw(canvas: PhysicsCanvas): void {
    if (!this.config) return;

    canvas.clear();
    canvas.resetOrigin();

    if (this.config.mode === 'buoyancy') {
      this.drawBuoyancy(canvas);
    } else if (this.config.mode === 'pascal') {
      this.drawPascal(canvas);
    } else if (this.config.mode === 'bernoulli') {
      this.drawBernoulli(canvas);
    } else if (this.config.mode === 'viscosity') {
      this.drawViscosity(canvas);
    }
  }

  private drawBuoyancy(canvas: PhysicsCanvas): void {
    const ctx = canvas.ctx;
    const { fluidDensity, blockMass, blockVolume, showVectors } = this.config.buoyancy;

    canvas.drawGrid(1.0);

    const leftX = -2.0;
    const rightX = 2.0;
    const bottomY = 0.2;
    const fluidLevel = 2.0;

    // Fluid liquid block
    ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2;
    
    const ptTopLeft = canvas.toScreen(leftX, fluidLevel);
    const ptBottomRight = canvas.toScreen(rightX, bottomY);
    ctx.beginPath();
    ctx.rect(ptTopLeft.x, ptTopLeft.y, ptBottomRight.x - ptTopLeft.x, ptBottomRight.y - ptTopLeft.y);
    ctx.fill();
    ctx.stroke();

    // Wavy surface
    ctx.beginPath();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#0284c7';
    const surfaceYScreen = canvas.toScreen(0, fluidLevel).y;
    const leftXScreen = canvas.toScreen(leftX, 0).x;
    const rightXScreen = canvas.toScreen(rightX, 0).x;
    
    ctx.moveTo(leftXScreen, surfaceYScreen);
    for (let xScreen = leftXScreen; xScreen <= rightXScreen; xScreen += 10) {
      const xPhys = canvas.toPhysics(xScreen, 0).x;
      const waveY = fluidLevel + 0.04 * Math.sin(xPhys * 8 + this.t * 3);
      ctx.lineTo(xScreen, canvas.toScreen(0, waveY).y);
    }
    ctx.stroke();

    // Outer glass container walls
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 4;
    const wallLeftTop = canvas.toScreen(leftX, 3.5);
    const wallLeftBottom = canvas.toScreen(leftX, bottomY);
    const wallRightBottom = canvas.toScreen(rightX, bottomY);
    const wallRightTop = canvas.toScreen(rightX, 3.5);

    ctx.beginPath();
    ctx.moveTo(wallLeftTop.x, wallLeftTop.y);
    ctx.lineTo(wallLeftBottom.x, wallLeftBottom.y);
    ctx.lineTo(wallRightBottom.x, wallRightBottom.y);
    ctx.lineTo(wallRightTop.x, wallRightTop.y);
    ctx.stroke();

    // Block
    const blockHeight = Math.pow(blockVolume, 1/3);
    const blockWidth = blockHeight;
    canvas.drawBlock(this.blockX, this.blockY, blockWidth, blockHeight, 0, 'rgba(245, 158, 11, 0.8)', `${blockMass} kg`);

    // Force vectors
    if (showVectors) {
      const g = this.config.buoyancy.gravity;
      const Fg = blockMass * g;
      const blockBottom = this.blockY - blockHeight / 2;
      const blockTop = this.blockY + blockHeight / 2;
      let hSub = 0;
      if (blockTop <= fluidLevel) hSub = blockHeight;
      else if (blockBottom >= fluidLevel) hSub = 0;
      else hSub = fluidLevel - blockBottom;
      const vSub = blockVolume * (hSub / blockHeight);
      const Fb = fluidDensity * vSub * g;

      const scale = 0.035;
      
      canvas.drawArrow(this.blockX, this.blockY, this.blockX, this.blockY - Fg * scale, '#ef4444', 'Fg');
      if (Fb > 0.1) {
        canvas.drawArrow(this.blockX, this.blockY, this.blockX, this.blockY + Fb * scale, '#06b6d4', 'Fb');
      }
    }

    // Pressure Probe
    const probePt = canvas.toScreen(this.probeX, this.probeY);
    ctx.fillStyle = '#8b5cf6';
    ctx.strokeStyle = '#7c3aed';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(probePt.x, probePt.y, 6, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.4)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 2;
    const startCord = canvas.toScreen(this.probeX, this.probeY);
    const endCord = canvas.toScreen(2.5, 3.2);
    ctx.moveTo(startCord.x, startCord.y);
    ctx.lineTo(endCord.x, endCord.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // HUD box
    const pressure = this.getProbePressure();
    const pKpa = (pressure / 1000).toFixed(2);
    const pAtm = (pressure / 101325).toFixed(3);

    const hudLeft = canvas.toScreen(2.0, 3.5);
    const hudWidth = 1.8 * canvas.scale;
    const hudHeight = 0.9 * canvas.scale;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(hudLeft.x, hudLeft.y, hudWidth, hudHeight);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '11px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`P_gauge: ${((pressure - (this.showAtmosphericPressure ? 101325 : 0)) / 1000).toFixed(1)} kPa`, hudLeft.x + 8, hudLeft.y + 8);
    ctx.fillText(`P_total: ${pKpa} kPa`, hudLeft.x + 8, hudLeft.y + 24);
    ctx.fillText(`P_total: ${pAtm} atm`, hudLeft.x + 8, hudLeft.y + 40);
  }

  private drawPascal(canvas: PhysicsCanvas): void {
    const ctx = canvas.ctx;
    const { area1, area2, force1 } = this.config.pascal;

    canvas.drawGrid(1.0);

    const leftX = -2.0;
    const rightX = 2.0;
    
    const areaRatio = area1 / area2;
    const yLeft = 1.5 - this.pistonOffset;
    const yRight = 1.5 + this.pistonOffset * areaRatio;

    ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 3;

    ctx.beginPath();
    const leftL = leftX - 0.7;
    const leftR = leftX + 0.7;
    const rightL = rightX - 1.1;
    const rightR = rightX + 1.1;

    const ptLeftLTop = canvas.toScreen(leftL, yLeft);
    const ptLeftRTop = canvas.toScreen(leftR, yLeft);
    const ptLeftRBottom = canvas.toScreen(leftR, 0.4);
    const ptRightLBottom = canvas.toScreen(rightL, 0.4);
    const ptRightLTop = canvas.toScreen(rightL, yRight);
    const ptRightRTop = canvas.toScreen(rightR, yRight);
    const ptRightRBase = canvas.toScreen(rightR, 0.2);
    const ptLeftLBase = canvas.toScreen(leftL, 0.2);

    ctx.moveTo(ptLeftLTop.x, ptLeftLTop.y);
    ctx.lineTo(ptLeftRTop.x, ptLeftRTop.y);
    ctx.lineTo(ptLeftRBottom.x, ptLeftRBottom.y);
    ctx.lineTo(ptRightLBottom.x, ptRightLBottom.y);
    ctx.lineTo(ptRightLTop.x, ptRightLTop.y);
    ctx.lineTo(ptRightRTop.x, ptRightRTop.y);
    ctx.lineTo(ptRightRBase.x, ptRightRBase.y);
    ctx.lineTo(ptLeftLBase.x, ptLeftLBase.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 4;
    
    const ptWallLeftL1 = canvas.toScreen(leftL, 3.0);
    const ptWallLeftL2 = canvas.toScreen(leftL, 0.2);
    const ptWallLeftR1 = canvas.toScreen(leftR, 3.0);
    const ptWallLeftR2 = canvas.toScreen(leftR, 0.4);
    ctx.beginPath();
    ctx.moveTo(ptWallLeftL1.x, ptWallLeftL1.y);
    ctx.lineTo(ptWallLeftL2.x, ptWallLeftL2.y);
    ctx.moveTo(ptWallLeftR1.x, ptWallLeftR1.y);
    ctx.lineTo(ptWallLeftR2.x, ptWallLeftR2.y);
    ctx.stroke();

    const ptPipeBottom1 = canvas.toScreen(leftR, 0.4);
    const ptPipeBottom2 = canvas.toScreen(rightL, 0.4);
    const ptPipeTop1 = canvas.toScreen(leftL, 0.2);
    const ptPipeTop2 = canvas.toScreen(rightR, 0.2);
    ctx.beginPath();
    ctx.moveTo(ptPipeBottom1.x, ptPipeBottom1.y);
    ctx.lineTo(ptPipeBottom2.x, ptPipeBottom2.y);
    ctx.moveTo(ptPipeTop1.x, ptPipeTop1.y);
    ctx.lineTo(ptPipeTop2.x, ptPipeTop2.y);
    ctx.stroke();

    const ptWallRightL1 = canvas.toScreen(rightL, 3.0);
    const ptWallRightL2 = canvas.toScreen(rightL, 0.4);
    const ptWallRightR1 = canvas.toScreen(rightR, 3.0);
    const ptWallRightR2 = canvas.toScreen(rightR, 0.2);
    ctx.beginPath();
    ctx.moveTo(ptWallRightL1.x, ptWallRightL1.y);
    ctx.lineTo(ptWallRightL2.x, ptWallRightL2.y);
    ctx.moveTo(ptWallRightR1.x, ptWallRightR1.y);
    ctx.lineTo(ptWallRightR2.x, ptWallRightR2.y);
    ctx.stroke();

    canvas.drawBlock(leftX, yLeft - 0.075, 1.4, 0.15, 0, '#475569');
    canvas.drawBlock(rightX, yRight - 0.075, 2.2, 0.15, 0, '#475569');

    const F1 = force1;
    const F2 = F1 * (area2 / area1);
    const scale = 0.04;

    canvas.drawArrow(leftX, yLeft + 0.5, leftX, yLeft + 0.5 - F1 * scale, '#ef4444', `F1: ${F1}N`);
    canvas.drawArrow(rightX, yRight, rightX, yRight + F2 * scale, '#3b82f6', `F2: ${F2.toFixed(1)}N`);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    
    const ptLabel1 = canvas.toScreen(leftX, yLeft - 0.5);
    ctx.fillText(`Area A1: ${area1} m²`, ptLabel1.x, ptLabel1.y);

    const ptLabel2 = canvas.toScreen(rightX, yRight - 0.5);
    ctx.fillText(`Area A2: ${area2} m²`, ptLabel2.x, ptLabel2.y);
  }

  private drawBernoulli(canvas: PhysicsCanvas): void {
    const ctx = canvas.ctx;
    canvas.drawGrid(1.0);

    // Draw varying cross-section pipe contours
    ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 3;

    ctx.beginPath();
    const resolution = 50;
    
    // Top boundary coordinates
    const startPt = canvas.toScreen(-2.5, this.getPipeDiameter(-2.5) / 2);
    ctx.moveTo(startPt.x, startPt.y);
    for (let i = 1; i <= resolution; i++) {
      const x = -2.5 + (i / resolution) * 5.0;
      const pt = canvas.toScreen(x, this.getPipeDiameter(x) / 2);
      ctx.lineTo(pt.x, pt.y);
    }
    
    // Bottom boundary coordinates (sweep backwards)
    for (let i = resolution; i >= 0; i--) {
      const x = -2.5 + (i / resolution) * 5.0;
      const pt = canvas.toScreen(x, -this.getPipeDiameter(x) / 2);
      ctx.lineTo(pt.x, pt.y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw three vertical pressure tubes (Venturi Columns) at x = -1.8 (inlet), x = 0 (throat), x = 1.8 (outlet)
    const columnsX = [-1.8, 0.0, 1.8];
    const { fluidDensity } = this.config.bernoulli;
    
    ctx.strokeStyle = '#0284c7';
    ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.lineWidth = 3;

    columnsX.forEach((cx) => {
      // Calculate local pressure height
      // Reference inlet pressure 5000 Pa
      const dInlet = this.config.bernoulli.diameter1;
      const aInlet = Math.PI * (dInlet / 2) * (dInlet / 2);
      const vInlet = this.config.bernoulli.flowRate / aInlet;

      const dLocal = this.getPipeDiameter(cx);
      const aLocal = Math.PI * (dLocal / 2) * (dLocal / 2);
      const vLocal = this.config.bernoulli.flowRate / aLocal;

      const pLocal = 5000 + 0.5 * fluidDensity * (vInlet * vInlet - vLocal * vLocal);
      
      // Map pressure to visual water column height (physics Y)
      const topY = this.getPipeDiameter(cx) / 2;
      const colHeightY = topY + 0.5 + Math.max(0, pLocal) / 4000;

      // Draw column liquid
      const colL = canvas.toScreen(cx - 0.1, colHeightY);
      const colR = canvas.toScreen(cx + 0.1, topY);
      ctx.beginPath();
      ctx.rect(colL.x, colL.y, colR.x - colL.x, colR.y - colL.y);
      ctx.fill();
      ctx.stroke();

      // Draw column glass walls
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 2;
      
      const ptColL1 = canvas.toScreen(cx - 0.1, topY);
      const ptColL2 = canvas.toScreen(cx - 0.1, colHeightY + 0.2);
      ctx.beginPath();
      ctx.moveTo(ptColL1.x, ptColL1.y);
      ctx.lineTo(ptColL2.x, ptColL2.y);
      ctx.stroke();

      const ptColR1 = canvas.toScreen(cx + 0.1, topY);
      const ptColR2 = canvas.toScreen(cx + 0.1, colHeightY + 0.2);
      ctx.beginPath();
      ctx.moveTo(ptColR1.x, ptColR1.y);
      ctx.lineTo(ptColR2.x, ptColR2.y);
      ctx.stroke();
    });

    // Draw flow particles inside the pipe
    ctx.fillStyle = '#0ea5e9';
    ctx.lineWidth = 0;
    this.particles.forEach((p) => {
      const d = this.getPipeDiameter(p.x);
      // Lane distribution: space particles evenly inside current pipe diameter
      const laneOffset = -d / 2 + ((p.lane + 0.5) / 5) * d;
      const pt = canvas.toScreen(p.x, laneOffset);
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 4, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Draw flow rate callout
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    const ptCallout = canvas.toScreen(0, -1.8);
    ctx.fillText(`Volume Flow Rate: ${this.config.bernoulli.flowRate.toFixed(3)} m³/s`, ptCallout.x, ptCallout.y);
  }

  private drawViscosity(canvas: PhysicsCanvas): void {
    const ctx = canvas.ctx;
    canvas.drawGrid(1.0);

    const leftX = -1.0;
    const rightX = 1.0;
    const bottomY = 0.2;
    const fluidTopY = 3.5;

    // Draw dynamic viscosity fluid cylinder
    ctx.fillStyle = 'rgba(245, 158, 11, 0.15)'; // light amber tint for oil
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2;
    
    const ptTopLeft = canvas.toScreen(leftX, fluidTopY);
    const ptBottomRight = canvas.toScreen(rightX, bottomY);
    ctx.beginPath();
    ctx.rect(ptTopLeft.x, ptTopLeft.y, ptBottomRight.x - ptTopLeft.x, ptBottomRight.y - ptTopLeft.y);
    ctx.fill();
    ctx.stroke();

    // Draw cylinder steel side lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 4;
    
    const ptCylL1 = canvas.toScreen(leftX, bottomY);
    const ptCylL2 = canvas.toScreen(leftX, fluidTopY + 0.2);
    ctx.beginPath();
    ctx.moveTo(ptCylL1.x, ptCylL1.y);
    ctx.lineTo(ptCylL2.x, ptCylL2.y);
    ctx.stroke();

    const ptCylR1 = canvas.toScreen(rightX, bottomY);
    const ptCylR2 = canvas.toScreen(rightX, fluidTopY + 0.2);
    ctx.beginPath();
    ctx.moveTo(ptCylR1.x, ptCylR1.y);
    ctx.lineTo(ptCylR2.x, ptCylR2.y);
    ctx.stroke();

    const ptCylB1 = canvas.toScreen(leftX, bottomY);
    const ptCylB2 = canvas.toScreen(rightX, bottomY);
    ctx.beginPath();
    ctx.moveTo(ptCylB1.x, ptCylB1.y);
    ctx.lineTo(ptCylB2.x, ptCylB2.y);
    ctx.stroke();

    // Draw sphere
    const r = this.config.viscosity.sphereRadius;
    ctx.fillStyle = 'rgba(14, 165, 233, 0.9)'; // glass sphere blue
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2.5;
    const ptSphere = canvas.toScreen(0, this.sphereY);
    ctx.beginPath();
    ctx.arc(ptSphere.x, ptSphere.y, r * canvas.scale, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    // Draw dynamic viscosity force vectors (Gravity down, Buoyancy/Drag up)
    const { fluidDensity, viscosity, sphereDensity, gravity } = this.config.viscosity;
    const vol = (4 / 3) * Math.PI * Math.pow(r, 3);
    const m = vol * sphereDensity;

    const Fg = m * gravity;
    const Fb = vol * fluidDensity * gravity;
    const Fd = 6 * Math.PI * viscosity * r * (-this.sphereVy);
    const scale = 0.85 / Fg; // normalize vector scale to look good

    // Gravity (down)
    canvas.drawArrow(0, this.sphereY, 0, this.sphereY - Fg * scale, '#ef4444', 'Fg');
    // Buoyancy (up)
    canvas.drawArrow(0, this.sphereY, 0, this.sphereY + Fb * scale, '#06b6d4', 'Fb');
    // Viscous Drag (up)
    if (Fd > 0.05) {
      canvas.drawArrow(0, this.sphereY, 0, this.sphereY + (Fb + Fd) * scale, '#a855f7', 'Fd', {
        labelOffset: 25
      });
    }

    // Terminal velocity label HUD
    const vt = (2 * r * r * gravity * (sphereDensity - fluidDensity)) / (9 * viscosity);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '11px monospace';
    ctx.textAlign = 'left';
    const ptHUD = canvas.toScreen(1.2, 3.2);
    ctx.fillText(`Sphere Speed: ${(-this.sphereVy).toFixed(2)} m/s`, ptHUD.x, ptHUD.y);
    ctx.fillText(`Terminal Vt: ${vt.toFixed(2)} m/s`, ptHUD.x, ptHUD.y + 16);
  }
}
