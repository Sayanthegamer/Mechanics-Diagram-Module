import type { FluidsConfig } from '../types';
import { PhysicsCanvas } from '../PhysicsCanvas';

export interface FluidsState {
  t: number;
  blockY: number;
  blockVy: number;
  pressureGauge: number;
}

export class FluidsDiagram {
  private pc: PhysicsCanvas;
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

  constructor(pc: PhysicsCanvas) {
    this.pc = pc;
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
      const containerHeight = 3.0;
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

    if (this.config.mode === 'buoyancy') {
      this.drawBuoyancy(canvas);
    } else if (this.config.mode === 'pascal') {
      this.drawPascal(canvas);
    }
  }

  private drawBuoyancy(canvas: PhysicsCanvas): void {
    const ctx = canvas.getContext();
    const { fluidDensity, blockMass, blockVolume, showVectors } = this.config.buoyancy;

    // 1. Draw Grid
    canvas.drawGrid(1.0, 1.0, '#334155');

    // Container geometry
    const leftX = -2.0;
    const rightX = 2.0;
    const bottomY = 0.2;
    const fluidLevel = 2.0;

    // 2. Draw Fluid Liquid block
    ctx.fillStyle = 'rgba(56, 189, 248, 0.25)'; // glassy sky blue
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2;
    canvas.rect(leftX, bottomY, rightX - leftX, fluidLevel - bottomY, true, true);

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
    canvas.line(leftX, 3.5, leftX, bottomY);
    canvas.line(leftX, bottomY, rightX, bottomY);
    canvas.line(rightX, bottomY, rightX, 3.5);

    // 4. Draw Block
    const blockHeight = Math.pow(blockVolume, 1/3);
    const blockWidth = blockHeight;
    ctx.fillStyle = 'rgba(245, 158, 11, 0.8)'; // premium amber block
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 3;
    
    const blockLeftX = this.blockX - blockWidth / 2;
    const blockBottomY = this.blockY - blockHeight / 2;
    canvas.rect(blockLeftX, blockBottomY, blockWidth, blockHeight, true, true);

    // Label block mass
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const textPt = canvas.toScreen(this.blockX, this.blockY);
    ctx.fillText(`${blockMass}kg`, textPt.x, textPt.y);

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
      canvas.drawVector(
        { x: this.blockX, y: this.blockY },
        { x: 0, y: -Fg * scale },
        '#ef4444',
        'Fg',
        2.5
      );

      // Draw Buoyancy vector (from center upwards)
      if (Fb > 0.1) {
        canvas.drawVector(
          { x: this.blockX, y: this.blockY },
          { x: 0, y: Fb * scale },
          '#06b6d4',
          'Fb',
          2.5
        );
      }
    }

    // 6. Draw Hydrostatic Pressure Probe
    ctx.fillStyle = '#8b5cf6'; // premium violet probe sensor tip
    ctx.strokeStyle = '#7c3aed';
    ctx.lineWidth = 2;
    canvas.circle(this.probeX, this.probeY, 0.12, true, true);

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

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = 2;
    canvas.rect(2.0, 2.7, 1.8, 0.9, true, true);

    ctx.fillStyle = '#ffffff';
    ctx.font = '11px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const textHUD = canvas.toScreen(2.1, 3.5);
    ctx.fillText(`P_gauge: ${((pressure - (this.showAtmosphericPressure ? 101325 : 0)) / 1000).toFixed(1)} kPa`, textHUD.x, textHUD.y + 4);
    ctx.fillText(`P_total: ${pKpa} kPa`, textHUD.x, textHUD.y + 18);
    ctx.fillText(`P_total: ${pAtm} atm`, textHUD.x, textHUD.y + 32);
  }

  private drawPascal(canvas: PhysicsCanvas): void {
    const ctx = canvas.getContext();
    const { area1, area2, force1 } = this.config.pascal;

    canvas.drawGrid(1.0, 1.0, '#334155');

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
    canvas.line(leftL, 3.0, leftL, 0.2);
    canvas.line(leftR, 3.0, leftR, 0.4);

    // Connecting pipe wall
    canvas.line(leftR, 0.4, rightL, 0.4);
    canvas.line(leftL, 0.2, rightR, 0.2);

    // Right cylinder walls
    canvas.line(rightL, 3.0, rightL, 0.4);
    canvas.line(rightR, 3.0, rightR, 0.2);

    // Draw Left Piston block
    ctx.fillStyle = '#475569';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3;
    canvas.rect(leftL + 0.05, yLeft - 0.15, 1.3, 0.15, true, true);

    // Draw Right Piston block
    canvas.rect(rightL + 0.05, yRight - 0.15, 2.1, 0.15, true, true);

    // Force vectors
    const F1 = force1;
    const F2 = F1 * (area2 / area1);
    const scale = 0.04;

    // Force vector on Left Piston (acting down)
    canvas.drawVector(
      { x: leftX, y: yLeft + 0.5 },
      { x: 0, y: -F1 * scale },
      '#ef4444',
      `F1: ${F1}N`,
      2
    );

    // Force vector on Right Piston (acting up)
    canvas.drawVector(
      { x: rightX, y: yRight },
      { x: 0, y: F2 * scale },
      '#3b82f6',
      `F2: ${F2.toFixed(1)}N`,
      2
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
