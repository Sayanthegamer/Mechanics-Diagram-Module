import type { FbdConfig } from '../types';
import { PhysicsCanvas } from '../PhysicsCanvas';

export interface FbdState {
  t: number;
  x: number;
  v: number;
  a: number;
}

export class FbdDiagram {
  private pc: PhysicsCanvas;
  private config!: FbdConfig;

  // Physical State Variables
  public x: number = 0; // displacement along surface (m) or y coordinate (suspended)
  public v: number = 0; // velocity (m/s)
  public t: number = 0; // time (s)
  public a: number = 0; // last computed acceleration (m/s^2)

  // History for graphing
  public history: FbdState[] = [];
  private readonly maxHistory = 500;

  constructor(pc: PhysicsCanvas) {
    this.pc = pc;
  }

  public setConfig(config: FbdConfig): void {
    const isNewType = !this.config || this.config.surfaceType !== config.surfaceType;
    this.config = config;
    if (isNewType) {
      this.resetState();
    }
  }

  public resetState(): void {
    this.t = 0;
    this.v = 0;
    this.a = 0;
    this.history = [];
    if (this.config && this.config.surfaceType === 'suspended') {
      this.x = -1.5; // start unstretched and bob downwards
    } else {
      this.x = 0; // start at center
    }
  }

  // Euler Integration of FBD Forces
  public step(dt: number): void {
    if (!this.config) return;
    this.t += dt;
    let stepAccel = 0;

    const { surfaceType, inclineAngle, blockMass, mu, gravity, appliedForce } = this.config;
    const m = blockMass;
    const g = gravity;

    if (surfaceType === 'horizontal') {
      const appAngleRad = appliedForce.angle * (Math.PI / 180);
      const Fapp_y = appliedForce.magnitude * Math.sin(appAngleRad);
      const Fapp_x = appliedForce.magnitude * Math.cos(appAngleRad);

      const Fn = Math.max(0, m * g - Fapp_y);
      const Ff_max = mu * Fn;

      let a = 0;
      if (Math.abs(this.v) < 0.001) {
        // Static friction
        const Fdrive = Fapp_x;
        if (Math.abs(Fdrive) > Ff_max) {
          const Ff = -Math.sign(Fdrive) * Ff_max;
          a = (Fdrive + Ff) / m;
        } else {
          a = 0;
          this.v = 0;
        }
      } else {
        // Kinetic friction
        const Ff = -Math.sign(this.v) * Ff_max;
        a = (Fapp_x + Ff) / m;
      }
      stepAccel = a;

      this.v += a * dt;
      this.x += this.v * dt;

      // Restrict boundaries
      const limitX = 3.5;
      if (this.x > limitX) {
        this.x = limitX;
        this.v = 0;
      } else if (this.x < -limitX) {
        this.x = -limitX;
        this.v = 0;
      }

    } else if (surfaceType === 'inclined') {
      const thetaRad = inclineAngle * (Math.PI / 180);
      const cosT = Math.cos(thetaRad);
      const sinT = Math.sin(thetaRad);

      const Fn = m * g * cosT;
      const Fg_parallel = m * g * sinT; // weight down the slope

      const appAngleRad = appliedForce.angle * (Math.PI / 180);
      const Fapp_parallel = appliedForce.magnitude * Math.cos(appAngleRad);
      const Fapp_perp = appliedForce.magnitude * Math.sin(appAngleRad);

      const Fn_net = Math.max(0, Fn - Fapp_perp);
      const Fdrive = Fapp_parallel - Fg_parallel; // net parallel force pushing UP
      const Ff_max = mu * Fn_net;

      let a = 0;
      if (Math.abs(this.v) < 0.001) {
        // Static friction
        if (Math.abs(Fdrive) > Ff_max) {
          const Ff = -Math.sign(Fdrive) * Ff_max;
          a = (Fdrive + Ff) / m;
        } else {
          a = 0;
          this.v = 0;
        }
      } else {
        // Kinetic friction
        const Ff = -Math.sign(this.v) * Ff_max;
        a = (Fdrive + Ff) / m;
      }
      stepAccel = a;

      this.v += a * dt;
      this.x += this.v * dt;

      // Restrict boundaries
      const limitX = 3.0;
      if (this.x > limitX) {
        this.x = limitX;
        this.v = 0;
      } else if (this.x < -limitX) {
        this.x = -limitX;
        this.v = 0;
      }

    } else if (surfaceType === 'suspended') {
      // Dynamic vertical elastic cable model
      const k = 150; // cable stiffness (N/m)
      const b = 15;  // damping factor
      const Fg = m * g;
      const Fapp = appliedForce.magnitude; // pulling down

      // Spring displacement relative to unstretched length -1.5
      const y = this.x;
      const Fs = -k * (y - (-1.5)); // tension opposes stretching below -1.5
      const Fnet = Fs - Fg - Fapp - b * this.v;

      const a = Fnet / m;
      stepAccel = a;
      this.v += a * dt;
      this.x += this.v * dt;

      // Ceil boundary: block top cannot go higher than ceiling (1.5)
      const limitY = 1.0;
      if (this.x > limitY) {
        this.x = limitY;
        this.v = 0;
      }
    }

    // Record acceleration and push to history
    this.a = stepAccel;
    this.history.push({ t: this.t, x: this.x, v: this.v, a: this.a });
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  public draw(): void {
    if (!this.config) return;

    this.pc.clear();
    this.pc.resetOrigin();

    // Adjust origin for drawing
    if (this.config.surfaceType === 'inclined') {
      this.pc.originX = this.pc.canvas.clientWidth * 0.45 + this.pc.panX;
      this.pc.originY = this.pc.canvas.clientHeight * 0.6 + this.pc.panY;
    } else if (this.config.surfaceType === 'horizontal') {
      this.pc.originX = this.pc.canvas.clientWidth / 2 + this.pc.panX;
      this.pc.originY = this.pc.canvas.clientHeight * 0.6 + this.pc.panY;
    } else {
      this.pc.originX = this.pc.canvas.clientWidth / 2 + this.pc.panX;
      this.pc.originY = this.pc.canvas.clientHeight / 2 + this.pc.panY;
    }

    if (this.config.showGrid) {
      this.pc.drawGrid(1);
    }

    const { surfaceType, inclineAngle, blockMass, mu, gravity, appliedForce, showComponents } = this.config;

    // Physics constants & values
    const m = blockMass;
    const g = gravity;
    const Fg = m * g; // Gravity

    // Calculate forces based on surface type
    if (surfaceType === 'horizontal') {
      // Draw flat ground line
      this.drawHorizontalGround();

      // Block position
      const bx = this.x;
      const by = 0.5; // block center height
      const bw = 1.4;
      const bh = 1.0;

      // Draw block
      this.pc.drawBlock(bx, by, bw, bh, 0, '#3b82f6', `${m} kg`);

      // Normal Force (Fn = mg - F_app * sin(theta))
      const appAngleRad = appliedForce.angle * (Math.PI / 180);
      const Fapp_y = appliedForce.magnitude * Math.sin(appAngleRad);
      const Fn = Math.max(0, Fg - Fapp_y);

      // Applied force components
      const Fapp_x = appliedForce.magnitude * Math.cos(appAngleRad);

      // Friction Force (Ff)
      const Ff_max = mu * Fn;
      let Ff = 0;
      if (Math.abs(this.v) < 0.001) {
        if (Math.abs(Fapp_x) <= Ff_max) {
          Ff = -Fapp_x; // static friction balances force
        } else {
          Ff = -Math.sign(Fapp_x) * Ff_max;
        }
      } else {
        Ff = -Math.sign(this.v) * Ff_max; // kinetic friction
      }

      // Render Force Vectors from center of mass (bx, by)
      const vecScale = 0.08; // scale Newtons to grid units

      // 1. Gravity (down)
      this.pc.drawArrow(bx, by, bx, by - Fg * vecScale, '#ef4444', `Fg = ${(Fg).toFixed(1)}N`);

      // 2. Normal Force (up)
      if (Fn > 0) {
        this.pc.drawArrow(bx, by, bx, by + Fn * vecScale, '#10b981', `Fn = ${(Fn).toFixed(1)}N`);
      }

      // 3. Applied Force (at angle)
      if (appliedForce.magnitude > 0) {
        const tx = bx + Fapp_x * vecScale;
        const ty = by + Fapp_y * vecScale;
        this.pc.drawArrow(bx, by, tx, ty, '#f59e0b', `Fa = ${appliedForce.magnitude}N`);
        
        // Show angle arc for applied force
        if (appliedForce.angle !== 0) {
          this.pc.drawAngleArc(bx, by, 35, 0, appliedForce.angle, '#f59e0b', `${appliedForce.angle}°`);
        }
      }

      // 4. Friction (opposite of motion)
      if (Math.abs(Ff) > 0.01) {
        this.pc.drawArrow(bx, by, bx + Ff * vecScale, by, '#a855f7', `Ff = ${Math.abs(Ff).toFixed(1)}N`);
      }

      // 5. Velocity arrow (green, drawn below block)
      if (Math.abs(this.v) > 0.05) {
        const vScale = 0.3;
        this.pc.drawArrow(bx, by - bh / 2 - 0.2, bx + this.v * vScale, by - bh / 2 - 0.2, '#22d3ee', `v = ${this.v.toFixed(1)} m/s`, { headSize: 7, lineWidth: 2.5 });
      }

    } else if (surfaceType === 'inclined') {
      const theta = inclineAngle;
      const thetaRad = theta * (Math.PI / 180);

      // Draw incline plane
      this.drawInclinedSurface(theta);

      // Block position on incline (in rotated coordinate system)
      const by = 0.5; // block height from slope

      const cosT = Math.cos(thetaRad);
      const sinT = Math.sin(thetaRad);

      const Fn = Fg * cosT;
      const Fg_parallel = Fg * sinT; // gravity component down the slope

      // Applied force relative to incline
      const appAngleRad = appliedForce.angle * (Math.PI / 180);
      const Fapp_parallel = appliedForce.magnitude * Math.cos(appAngleRad);
      const Fapp_perp = appliedForce.magnitude * Math.sin(appAngleRad);

      // Net perpendicular force Fn = mg cos(theta) - Fa_perp
      const Fn_net = Math.max(0, Fn - Fapp_perp);

      // Net parallel force (excluding friction)
      const F_net_parallel = Fapp_parallel - Fg_parallel;

      // Friction (opposite to net parallel force)
      const Ff_max = mu * Fn_net;
      let Ff = 0;
      if (Math.abs(this.v) < 0.001) {
        if (Math.abs(F_net_parallel) <= Ff_max) {
          Ff = -F_net_parallel;
        } else {
          Ff = -Math.sign(F_net_parallel) * Ff_max;
        }
      } else {
        Ff = -Math.sign(this.v) * Ff_max;
      }

      // Draw block (rotated by incline angle)
      // In global coords: center is shifted along slope by this.x
      const gbx = this.x * cosT - by * sinT;
      const gby = this.x * sinT + by * cosT;
      this.pc.drawBlock(gbx, gby, 1.4, 0.9, theta, '#3b82f6', `${m} kg`);

      const vecScale = 0.08;

      // Draw Force Vectors in Global Coordinates
      
      // 1. Gravity: points straight down
      this.pc.drawArrow(gbx, gby, gbx, gby - Fg * vecScale, '#ef4444', `Fg = ${(Fg).toFixed(1)}N`);

      if (showComponents) {
        // Draw dashed lines for gravity components
        const perp_gx = gbx + Fn * vecScale * sinT;
        const perp_gy = gby - Fn * vecScale * cosT;
        
        const par_gx = perp_gx - Fg_parallel * vecScale * cosT;
        const par_gy = perp_gy - Fg_parallel * vecScale * sinT;

        this.pc.ctx.save();
        this.pc.ctx.strokeStyle = '#f87171';
        this.pc.ctx.lineWidth = 1.5;
        this.pc.ctx.setLineDash([3, 3]);

        const sCOM = this.pc.toScreen(gbx, gby);
        const sPerp = this.pc.toScreen(perp_gx, perp_gy);
        const sPar = this.pc.toScreen(par_gx, par_gy);

        this.pc.ctx.beginPath();
        this.pc.ctx.moveTo(sCOM.x, sCOM.y);
        this.pc.ctx.lineTo(sPerp.x, sPerp.y);
        this.pc.ctx.lineTo(sPar.x, sPar.y);
        this.pc.ctx.stroke();
        this.pc.ctx.restore();

        this.pc.drawArrow(gbx, gby, perp_gx, perp_gy, '#f87171', `mg·cosθ = ${Fn.toFixed(1)}N`, { dashed: true, headSize: 8, labelOffset: -16 });
        this.pc.drawArrow(perp_gx, perp_gy, par_gx, par_gy, '#f87171', `mg·sinθ = ${Fg_parallel.toFixed(1)}N`, { dashed: true, headSize: 8, labelOffset: 16 });

        this.pc.drawAngleArc(gbx, gby, 40, -90, -90 + theta, '#ef4444', `θ = ${theta}°`);
      }

      // 2. Normal Force: points perpendicular to slope
      if (Fn_net > 0) {
        const ntx = gbx - Fn_net * vecScale * sinT;
        const nty = gby + Fn_net * vecScale * cosT;
        this.pc.drawArrow(gbx, gby, ntx, nty, '#10b981', `Fn = ${(Fn_net).toFixed(1)}N`);
      }

      // 3. Applied Force: Fa components relative to slope
      if (appliedForce.magnitude > 0) {
        const faGlobalRad = thetaRad + appAngleRad;
        const fax = gbx + appliedForce.magnitude * vecScale * Math.cos(faGlobalRad);
        const fay = gby + appliedForce.magnitude * vecScale * Math.sin(faGlobalRad);
        this.pc.drawArrow(gbx, gby, fax, fay, '#f59e0b', `Fa = ${appliedForce.magnitude}N`);

        if (appliedForce.angle !== 0) {
          this.pc.drawAngleArc(gbx, gby, 30, theta, theta + appliedForce.angle, '#f59e0b', `${appliedForce.angle}°`);
        }
      }

      // 4. Friction: parallel to incline
      if (Math.abs(Ff) > 0.01) {
        const ffx = gbx + Ff * vecScale * cosT;
        const ffy = gby + Ff * vecScale * sinT;
        this.pc.drawArrow(gbx, gby, ffx, ffy, '#a855f7', `Ff = ${Math.abs(Ff).toFixed(1)}N`);
      }

      // 5. Velocity arrow along slope (cyan)
      if (Math.abs(this.v) > 0.05) {
        const vScale = 0.3;
        const vbx = gbx - 0.55 * sinT; // below block center (perpendicular to slope)
        const vby = gby + 0.55 * cosT;
        this.pc.drawArrow(vbx, vby, vbx + this.v * vScale * cosT, vby + this.v * vScale * sinT, '#22d3ee', `v = ${this.v.toFixed(1)} m/s`, { headSize: 7, lineWidth: 2.5 });
      }

    } else if (surfaceType === 'suspended') {
      // Draw ceiling
      this.drawCeiling();

      // Block position
      const bx = 0;
      const by = this.x; // dynamic vertical position
      const bw = 1.2;
      const bh = 1.0;

      // Draw string
      this.pc.ctx.save();
      this.pc.ctx.strokeStyle = this.pc.theme === 'dark' ? '#aaa' : '#444';
      this.pc.ctx.lineWidth = 2;
      const sCeil = this.pc.toScreen(0, 1.5);
      const sBlock = this.pc.toScreen(bx, by + bh/2);
      this.pc.ctx.beginPath();
      this.pc.ctx.moveTo(sCeil.x, sCeil.y);
      this.pc.ctx.lineTo(sBlock.x, sBlock.y);
      this.pc.ctx.stroke();
      this.pc.ctx.restore();

      // Draw block
      this.pc.drawBlock(bx, by, bw, bh, 0, '#3b82f6', `${m} kg`);

      const vecScale = 0.08;

      // Tension calculated from spring displacement
      const Ft = Math.max(0, -150 * (this.x - (-1.5)));

      // 1. Gravity (down)
      this.pc.drawArrow(bx, by, bx, by - Fg * vecScale, '#ef4444', `Fg = ${(Fg).toFixed(1)}N`);

      // 2. Tension (up)
      this.pc.drawArrow(bx, by, bx, by + Ft * vecScale, '#10b981', `T = ${(Ft).toFixed(1)}N`);

      // 3. Applied Force downward (offset slightly to the left to avoid overlaps)
      if (appliedForce.magnitude > 0) {
        this.pc.drawArrow(bx - 0.25, by, bx - 0.25, by - appliedForce.magnitude * vecScale, '#f59e0b', `Fa = ${appliedForce.magnitude}N`);
      }

      // 4. Velocity arrow (vertical, cyan)
      if (Math.abs(this.v) > 0.05) {
        const vScale = 0.3;
        this.pc.drawArrow(bx + bw / 2 + 0.3, by, bx + bw / 2 + 0.3, by + this.v * vScale, '#22d3ee', `v = ${this.v.toFixed(1)} m/s`, { headSize: 7, lineWidth: 2.5 });
      }
    }
  }

  private drawHorizontalGround(): void {
    const y = 0; // ground at Y = 0
    const start = this.pc.toScreen(-5, y);
    const end = this.pc.toScreen(5, y);

    this.pc.ctx.save();
    this.pc.ctx.strokeStyle = this.pc.theme === 'dark' ? '#888' : '#444';
    this.pc.ctx.lineWidth = 4;
    this.pc.ctx.beginPath();
    this.pc.ctx.moveTo(start.x, start.y);
    this.pc.ctx.lineTo(end.x, end.y);
    this.pc.ctx.stroke();

    // Draw hashing lines
    this.pc.ctx.strokeStyle = this.pc.theme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)';
    this.pc.ctx.lineWidth = 1.5;
    for (let x = -5; x <= 5; x += 0.25) {
      const p = this.pc.toScreen(x, y);
      this.pc.ctx.beginPath();
      this.pc.ctx.moveTo(p.x, p.y);
      this.pc.ctx.lineTo(p.x - 5, p.y + 6);
      this.pc.ctx.stroke();
    }

    this.pc.ctx.restore();
  }

  private drawInclinedSurface(theta: number): void {
    const thetaRad = theta * (Math.PI / 180);
    const length = 10;
    
    // Draw wedge
    // We position the wedge so the incline surface passes through x = 0, y = 0
    // Surface equation: y = x * tan(theta)
    const startX = -length * 0.6;
    const endX = length * 0.6;
    
    const start = this.pc.toScreen(startX, startX * Math.tan(thetaRad));
    const end = this.pc.toScreen(endX, endX * Math.tan(thetaRad));
    const baseCorner = this.pc.toScreen(endX, startX * Math.tan(thetaRad));

    this.pc.ctx.save();
    this.pc.ctx.fillStyle = this.pc.theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)';
    this.pc.ctx.strokeStyle = this.pc.theme === 'dark' ? '#888' : '#444';
    this.pc.ctx.lineWidth = 3;

    this.pc.ctx.beginPath();
    this.pc.ctx.moveTo(start.x, start.y);
    this.pc.ctx.lineTo(end.x, end.y);
    this.pc.ctx.lineTo(baseCorner.x, baseCorner.y);
    this.pc.ctx.closePath();
    this.pc.ctx.fill();
    this.pc.ctx.stroke();

    // Hashing on the bottom of incline wedge base
    this.pc.ctx.strokeStyle = this.pc.theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)';
    this.pc.ctx.lineWidth = 1.5;
    for (let sx = start.x; sx <= end.x; sx += 10) {
      this.pc.ctx.beginPath();
      this.pc.ctx.moveTo(sx, baseCorner.y);
      this.pc.ctx.lineTo(sx - 4, baseCorner.y + 6);
      this.pc.ctx.stroke();
    }

    // Draw incline angle arc at the corner
    this.pc.drawAngleArc(startX, startX * Math.tan(thetaRad), 50, 0, theta, '#888', `${theta}°`);

    this.pc.ctx.restore();
  }

  private drawCeiling(): void {
    const y = 1.5;
    const start = this.pc.toScreen(-4, y);
    const end = this.pc.toScreen(4, y);

    this.pc.ctx.save();
    this.pc.ctx.strokeStyle = this.pc.theme === 'dark' ? '#888' : '#444';
    this.pc.ctx.lineWidth = 4;
    this.pc.ctx.beginPath();
    this.pc.ctx.moveTo(start.x, start.y);
    this.pc.ctx.lineTo(end.x, end.y);
    this.pc.ctx.stroke();

    // Hashing
    this.pc.ctx.strokeStyle = this.pc.theme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)';
    this.pc.ctx.lineWidth = 1.5;
    for (let x = -4; x <= 4; x += 0.25) {
      const p = this.pc.toScreen(x, y);
      this.pc.ctx.beginPath();
      this.pc.ctx.moveTo(p.x, p.y);
      this.pc.ctx.lineTo(p.x + 5, p.y - 6);
      this.pc.ctx.stroke();
    }

    this.pc.ctx.restore();
  }
}
