import type { FluidsConfig } from '../types';
import { PhysicsCanvas } from '../PhysicsCanvas';

export interface FluidsState {
  t: number;
  blockY: number;
  blockVy: number;
  pressureGauge: number;
}

export class FluidsDiagram {
  private config!: FluidsConfig;

  // Physical State Variables
  public t: number = 0;
  
  // Buoyancy specific state
  public blockY: number = 2.0; // vertical position in physics coordinates (meters)
  public blockVy: number = 0;   // vertical velocity (m/s)
  public blockVx: number = 0;   // horizontal velocity (m/s) - normally 0
  public blockX: number = 0;    // horizontal position (center of container)

  // Pascal specific state
  public pistonOffset: number = 0; // vertical shift in meters (left down, right up)

  // Dragging Probe state
  public probeX: number = 2.0;
  public probeY: number = 1.0;

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
    this.history = [];
  }

  // Find nearest draggable target node
  public getDragTarget(physicsPt: { x: number; y: number }): 'block' | 'probe' | 'piston1' | 'piston2' | null {
    if (!this.config) return null;

    if (this.config.mode === 'buoyancy') {
      // Check block center
      const dxBlock = physicsPt.x - this.blockX;
      const dyBlock = physicsPt.y - this.blockY;
      const distBlock = Math.sqrt(dxBlock * dxBlock + dyBlock * dyBlock);
      if (distBlock < 0.6) return 'block';

      // Check probe tip
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
    }

    return null;
  }

  // Drag handler modifier
  public updateDrag(target: 'block' | 'probe' | 'piston1' | 'piston2', physicsPt: { x: number; y: number }): void {
    if (!this.config) return;

    if (target === 'block') {
      // Constrain inside container bounds
      this.blockX = Math.max(-1.5, Math.min(1.5, physicsPt.x));
      this.blockY = Math.max(0.3, Math.min(3.5, physicsPt.y));
      this.blockVy = 0;
    } else if (target === 'probe') {
      // Constrain inside container bounds
      this.probeX = Math.max(-1.8, Math.min(1.8, physicsPt.x));
      this.probeY = Math.max(0.1, Math.min(3.3, physicsPt.y));
    } else if (target === 'piston1') {
      const deltaY = 1.5 - physicsPt.y;
      // Limit displacement (so fluid doesn't empty left cylinder or hit container bottom)
      this.pistonOffset = Math.max(-0.8, Math.min(0.8, deltaY));
    } else if (target === 'piston2') {
      const areaRatio = this.config.pascal.area1 / this.config.pascal.area2;
      const deltaY = physicsPt.y - 1.5;
      // Invert Pascal displacement logic
      this.pistonOffset = Math.max(-0.8, Math.min(0.8, deltaY / areaRatio));
    }
  }

  public step(dt: number): void {
    if (!this.config) return;
    this.t += dt;

    if (this.config.mode === 'buoyancy') {
      const { fluidDensity, blockMass, blockVolume, gravity } = this.config.buoyancy;
      const m = blockMass;
      const g = gravity;

      // Define container geometry
      const containerBottom = 0.2;
      const fluidLevel = 2.0; // relative to containerBottom, fluid surface at y = 2.0

      // Block dimensions (assume a cube)
      // Volume V = w * h * d. Let's assume height h = width w = cubeRoot(V)
      const blockHeight = Math.pow(blockVolume, 1/3);
      
      // Submerged height calculation
      const blockBottom = this.blockY - blockHeight / 2;
      const blockTop = this.blockY + blockHeight / 2;
      
      let hSub = 0;
      if (blockTop <= fluidLevel) {
        hSub = blockHeight; // fully submerged
      } else if (blockBottom >= fluidLevel) {
        hSub = 0; // fully in air
      } else {
        hSub = fluidLevel - blockBottom; // partially submerged
      }

      const vSub = blockVolume * (hSub / blockHeight);
      
      // Force computations
      const Fg = m * g;
      const Fb = fluidDensity * vSub * g;
      
      // Viscous damping scaling with submerged ratio
      const dampingCoeff = 8.0;
      const Fd = -dampingCoeff * this.blockVy * (vSub / blockVolume);

      const Fnet = Fb - Fg + Fd;
      const ay = Fnet / m;

      // Euler-Cromer stepping
      this.blockVy += ay * dt;
      this.blockY += this.blockVy * dt;

      // Collision boundary constraints
      const blockMinY = containerBottom + blockHeight / 2;
      if (this.blockY < blockMinY) {
        this.blockY = blockMinY;
        this.blockVy = 0;
      }
    }

    // Append to graph history
    const pressure = this.getProbePressure();
    this.history.push({
      t: this.t,
      blockY: this.blockY,
      blockVy: this.blockVy,
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
      fluidDensity = 1000; // standard water density for pascal press
      gravity = this.config.pascal.gravity;
      // Fluid level shifts with piston displacement
      // Left side x < 0: level is 1.5 - displacement
      // Right side x > 0: level is 1.5 + displacement * ratio
      if (this.probeX < 0) {
        fluidLevel = 1.5 - this.pistonOffset;
      } else {
        fluidLevel = 1.5 + this.pistonOffset * (this.config.pascal.area1 / this.config.pascal.area2);
      }
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
    }
  }

  private drawBuoyancy(canvas: PhysicsCanvas): void {
    const ctx = canvas.ctx;
    const { fluidDensity, blockMass, blockVolume, showVectors } = this.config.buoyancy;

    // 1. Draw Grid
    canvas.drawGrid(1.0);

    // Container geometry
    const leftX = -2.0;
    const rightX = 2.0;
    const bottomY = 0.2;
    const fluidLevel = 2.0;

    // 2. Draw Fluid Liquid block
    ctx.fillStyle = 'rgba(56, 189, 248, 0.25)'; // glassy sky blue
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2;
    
    const ptTopLeft = canvas.toScreen(leftX, fluidLevel);
    const ptBottomRight = canvas.toScreen(rightX, bottomY);
    ctx.beginPath();
    ctx.rect(ptTopLeft.x, ptTopLeft.y, ptBottomRight.x - ptTopLeft.x, ptBottomRight.y - ptTopLeft.y);
    ctx.fill();
    ctx.stroke();

    // Draw wavy lines at fluid surface
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

    // 3. Draw outer glass container walls
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

    // 4. Draw Block
    const blockHeight = Math.pow(blockVolume, 1/3);
    const blockWidth = blockHeight;
    canvas.drawBlock(this.blockX, this.blockY, blockWidth, blockHeight, 0, 'rgba(245, 158, 11, 0.8)', `${blockMass} kg`);

    // 5. Draw Buoyancy and Gravity vectors
    if (showVectors) {
      // Calculate forces for vectors drawing scale
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

      const scale = 0.035; // Newton to meters
      
      // Draw Gravity vector (from center downwards)
      canvas.drawArrow(
        this.blockX, this.blockY,
        this.blockX, this.blockY - Fg * scale,
        '#ef4444',
        'Fg'
      );

      // Draw Buoyancy vector (from center upwards)
      if (Fb > 0.1) {
        canvas.drawArrow(
          this.blockX, this.blockY,
          this.blockX, this.blockY + Fb * scale,
          '#06b6d4',
          'Fb'
        );
      }
    }

    // 6. Draw Hydrostatic Pressure Probe
    const probePt = canvas.toScreen(this.probeX, this.probeY);
    ctx.fillStyle = '#8b5cf6'; // premium violet probe sensor tip
    ctx.strokeStyle = '#7c3aed';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(probePt.x, probePt.y, 6, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    // Draw dotted sensor cord to the HUD container
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

    // Draw HUD box for Pressure reading
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

    // Cylinder positions
    const leftX = -2.0;
    const rightX = 2.0;
    
    // Left cylinder fluid level is 1.5 - offset
    // Right cylinder fluid level is 1.5 + offset * ratio
    const areaRatio = area1 / area2;
    const yLeft = 1.5 - this.pistonOffset;
    const yRight = 1.5 + this.pistonOffset * areaRatio;

    // Draw interconnected cylinder base vessel
    ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 3;

    ctx.beginPath();
    const leftL = leftX - 0.7;
    const leftR = leftX + 0.7;
    const rightL = rightX - 1.1;
    const rightR = rightX + 1.1;

    // Screen coordinates path outline
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

    // Draw outer steel walls of hydraulic press cylinders
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 4;
    
    // Left cylinder walls
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

    // Connecting pipe wall
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

    // Right cylinder walls
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

    // Draw Left Piston block
    canvas.drawBlock(leftX, yLeft - 0.075, 1.4, 0.15, 0, '#475569');

    // Draw Right Piston block
    canvas.drawBlock(rightX, yRight - 0.075, 2.2, 0.15, 0, '#475569');

    // Force vectors
    const F1 = force1;
    const F2 = F1 * (area2 / area1);
    const scale = 0.04;

    // Force vector on Left Piston (acting down)
    canvas.drawArrow(
      leftX, yLeft + 0.5,
      leftX, yLeft + 0.5 - F1 * scale,
      '#ef4444',
      `F1: ${F1}N`
    );

    // Force vector on Right Piston (acting up)
    canvas.drawArrow(
      rightX, yRight,
      rightX, yRight + F2 * scale,
      '#3b82f6',
      `F2: ${F2.toFixed(1)}N`
    );

    // Draw labels indicating areas
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    
    const ptLabel1 = canvas.toScreen(leftX, yLeft - 0.5);
    ctx.fillText(`Area A1: ${area1} m²`, ptLabel1.x, ptLabel1.y);

    const ptLabel2 = canvas.toScreen(rightX, yRight - 0.5);
    ctx.fillText(`Area A2: ${area2} m²`, ptLabel2.x, ptLabel2.y);
  }
}
