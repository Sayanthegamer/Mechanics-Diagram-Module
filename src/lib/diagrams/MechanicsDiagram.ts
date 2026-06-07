import type { MechanicsConfig, ProjectileParams, PulleyParams, CollisionParams } from '../types';
import { PhysicsCanvas } from '../PhysicsCanvas';

interface TrailPoint {
  x: number;
  y: number;
}

interface SparkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;  // remaining life 0..1
  size: number;
  color: string;
}

export class MechanicsDiagram {
  private pc: PhysicsCanvas;
  private config!: MechanicsConfig;

  // Simulation time
  public t: number = 0;

  // Projectile state
  public px: number = 0;
  public py: number = 0;
  public pvx: number = 0;
  public pvy: number = 0;
  public projectileTrail: TrailPoint[] = [];
  private projectileResetTimer: number = 0;

  // Pulley state
  public pulleyDisp: number = 0; // displacement of block B (hanging block) down
  public pulleyVel: number = 0;  // velocity of pulley system
  public pulleyRot: number = 0;  // rotation angle of pulley in radians

  // Collision state
  public cxA: number = -4.0;
  public cyA: number = 0;
  public cvxA: number = 3.0;
  public cvyA: number = 0;

  public cxB: number = 4.0;
  public cyB: number = 0;
  public cvxB: number = -1.5;
  public cvyB: number = 0;
  
  public collided: boolean = false;
  public radiusA: number = 0.5;
  public radiusB: number = 0.5;

  // Collision spark particles
  private sparks: SparkParticle[] = [];
  private sparkDuration: number = 0.6; // seconds

  // Circular motion state
  public circularAngle: number = 0; // angle of bob in radians

  constructor(pc: PhysicsCanvas) {
    this.pc = pc;
  }

  public setConfig(config: MechanicsConfig): void {
    this.config = config;
    this.resetState();
  }

  public resetState(): void {
    if (!this.config) return;
    this.t = 0;
    this.collided = false;
    this.projectileResetTimer = 0;
    this.sparks = [];

    const { mode, projectile, collision, circular } = this.config;

    if (mode === 'projectile') {
      this.px = -4.0; // start on the left
      this.py = 0;
      const angleRad = projectile.angle * (Math.PI / 180);
      this.pvx = projectile.velocity * Math.cos(angleRad);
      this.pvy = projectile.velocity * Math.sin(angleRad);
      this.projectileTrail = [{ x: this.px, y: this.py }];

    } else if (mode === 'pulley') {
      this.pulleyDisp = 0;
      this.pulleyVel = 0;
      this.pulleyRot = 0;

    } else if (mode === 'collision') {
      this.radiusA = 0.3 + collision.massA * 0.05;
      this.radiusB = 0.3 + collision.massB * 0.05;

      if (collision.dimension === '1d') {
        this.cxA = -3.5;
        this.cyA = 0;
        this.cvxA = collision.velocityA;
        this.cvyA = 0;

        this.cxB = 1.5;
        this.cyB = 0;
        this.cvxB = collision.velocityB;
        this.cvyB = 0;
      } else {
        // 2D collision starting setup
        this.cxA = -3.5;
        this.cyA = -1.0;
        const radA = collision.angleA * (Math.PI / 180);
        this.cvxA = collision.velocityA * Math.cos(radA);
        this.cvyA = collision.velocityA * Math.sin(radA);

        this.cxB = 1.0;
        this.cyB = 0.5;
        const radB = collision.angleB * (Math.PI / 180);
        this.cvxB = collision.velocityB * Math.cos(radB);
        this.cvyB = collision.velocityB * Math.sin(radB);
      }
    } else if (mode === 'circular' && circular) {
      // Start at the bottom for vertical (angle = -Math.PI / 2), and 0 for horizontal
      this.circularAngle = circular.isVertical ? -Math.PI / 2 : 0;
    }
  }

  // Step physics
  public step(dt: number): void {
    if (!this.config) return;

    const { mode, projectile, pulley, collision, circular } = this.config;

    if (mode === 'projectile') {
      this.stepProjectile(dt, projectile);
    } else if (mode === 'pulley') {
      this.stepPulley(dt, pulley);
    } else if (mode === 'collision') {
      this.stepCollision(dt, collision);
    } else if (mode === 'circular' && circular) {
      this.stepCircular(dt, circular);
    }

    this.t += dt;
  }

  // Projectile Euler Integration with quadratic air drag
  private stepProjectile(dt: number, params: ProjectileParams): void {
    // If it hit the ground, start reset countdown
    if (this.py <= 0 && this.pvy <= 0) {
      this.py = 0;
      this.pvx = 0;
      this.pvy = 0;
      this.projectileResetTimer += dt;
      if (this.projectileResetTimer > 1.5) {
        this.resetState();
      }
      return;
    }

    const m = params.mass;
    const g = params.gravity;
    const Cd = params.dragCoeff;

    // Velocity magnitude
    const v = Math.sqrt(this.pvx * this.pvx + this.pvy * this.pvy);

    // Forces
    const Fg_x = 0;
    const Fg_y = -m * g;

    // Drag force opposes velocity vector: Fd = -Cd * v * vec(v)
    const Fd_x = -Cd * v * this.pvx;
    const Fd_y = -Cd * v * this.pvy;

    const ax = (Fg_x + Fd_x) / m;
    const ay = (Fg_y + Fd_y) / m;

    // Update
    this.pvx += ax * dt;
    this.pvy += ay * dt;
    this.px += this.pvx * dt;
    this.py += this.pvy * dt;

    if (this.py < 0) {
      this.py = 0;
    }

    this.projectileTrail.push({ x: this.px, y: this.py });
    if (this.projectileTrail.length > 500) {
      this.projectileTrail.shift();
    }
  }

  // Pulley System Simulation Step
  private stepPulley(dt: number, params: PulleyParams): void {
    const { type, massA, massB, angle, mu, gravity } = params;
    const g = gravity;

    let a = 0;

    if (type === 'atwood') {
      // Atwood: Hanging blocks A and B
      // a = (mB - mA)/(mA + mB) * g
      a = ((massB - massA) / (massA + massB)) * g;
      
      this.pulleyVel += a * dt;
      this.pulleyDisp += this.pulleyVel * dt;
      
      // Pulley rotation proportional to displacement
      const pulleyRadius = 0.4; // in meters
      this.pulleyRot += (this.pulleyVel / pulleyRadius) * dt;

      // Restrict range of motion so blocks don't collide with pulley
      if (this.pulleyDisp > 1.15) {
        this.pulleyDisp = 1.15;
        this.pulleyVel = 0;
      } else if (this.pulleyDisp < -1.15) {
        this.pulleyDisp = -1.15;
        this.pulleyVel = 0;
      }

    } else if (type === 'inclined') {
      // Block A on slope, connected via pulley to Block B hanging
      // We define positive direction as Block B moving down, Block A moving up the incline
      const thetaRad = angle * (Math.PI / 180);
      const Fn_A = massA * g * Math.cos(thetaRad);
      const Fg_parallel_A = massA * g * Math.sin(thetaRad); // points down the slope
      
      // Drive force: B's weight pulling down minus A's weight component pulling down slope
      const Fdrive = massB * g - Fg_parallel_A;
      const Ff_max = mu * Fn_A;

      if (this.pulleyVel === 0) {
        // Static friction check
        if (Math.abs(Fdrive) <= Ff_max) {
          a = 0;
        } else {
          // Slide
          const Ff = -Math.sign(Fdrive) * Ff_max;
          a = (Fdrive + Ff) / (massA + massB);
        }
      } else {
        // Kinetic friction opposes motion direction
        const Ff = -Math.sign(this.pulleyVel) * Ff_max;
        a = (Fdrive + Ff) / (massA + massB);
      }

      this.pulleyVel += a * dt;
      this.pulleyDisp += this.pulleyVel * dt;

      const pulleyRadius = 0.4;
      this.pulleyRot += (this.pulleyVel / pulleyRadius) * dt;

      // Range limits to prevent block A from hitting peak or B from hitting pulley
      if (this.pulleyDisp > 1.3) {
        this.pulleyDisp = 1.3;
        this.pulleyVel = 0;
      } else if (this.pulleyDisp < -0.4) {
        this.pulleyDisp = -0.4;
        this.pulleyVel = 0;
      }
    }
  }

  // Collisions Solver Step
  private stepCollision(dt: number, params: CollisionParams): void {
    const { dimension, massA, massB, restitution } = params;

    // Update positions
    this.cxA += this.cvxA * dt;
    this.cyA += this.cvyA * dt;
    this.cxB += this.cvxB * dt;
    this.cyB += this.cvyB * dt;

    // Boundary bounce to keep on screen
    const limitX = 4.5;
    const limitY = 2.0;

    const bounceBorder = (obj: 'A' | 'B') => {
      const isA = obj === 'A';
      let x = isA ? this.cxA : this.cxB;
      let y = isA ? this.cyA : this.cyB;
      let vx = isA ? this.cvxA : this.cvxB;
      let vy = isA ? this.cvyA : this.cvyB;
      const r = isA ? this.radiusA : this.radiusB;

      if (x - r < -limitX) { x = -limitX + r; vx = -vx; }
      if (x + r > limitX) { x = limitX - r; vx = -vx; }
      
      if (dimension === '2d') {
        if (y - r < -limitY) { y = -limitY + r; vy = -vy; }
        if (y + r > limitY) { y = limitY - r; vy = -vy; }
      }

      if (isA) {
        this.cxA = x; this.cyA = y; this.cvxA = vx; this.cvyA = vy;
      } else {
        this.cxB = x; this.cyB = y; this.cvxB = vx; this.cvyB = vy;
      }
    };

    bounceBorder('A');
    bounceBorder('B');

    // Collision check: Distance between A and B
    const dx = this.cxB - this.cxA;
    const dy = this.cyB - this.cyA;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const minDist = this.radiusA + this.radiusB;

    if (dist <= minDist) {
      // Normal unit vector pointing from A to B
      const nx = dx / dist;
      const ny = dy / dist;

      // Tangent unit vector
      const tx = -ny;
      const ty = nx;

      // Project velocities onto normal and tangential axes
      const dpNormA = this.cvxA * nx + this.cvyA * ny;
      const dpTanA = this.cvxA * tx + this.cvyA * ty;

      const dpNormB = this.cvxB * nx + this.cvyB * ny;
      const dpTanB = this.cvxB * tx + this.cvyB * ty;

      // If they are moving away from each other, don't collide
      if (dpNormA - dpNormB > 0) {
        // 1D Inelastic collision equations along normal vector
        const ma = massA;
        const mb = massB;
        const e = restitution;

        const normA_final = (ma * dpNormA + mb * dpNormB - e * mb * (dpNormA - dpNormB)) / (ma + mb);
        const normB_final = (ma * dpNormA + mb * dpNormB + e * ma * (dpNormA - dpNormB)) / (ma + mb);

        // Convert scalar components back to vector coordinates
        this.cvxA = normA_final * nx + dpTanA * tx;
        this.cvyA = normA_final * ny + dpTanA * ty;

        this.cvxB = normB_final * nx + dpTanB * tx;
        this.cvyB = normB_final * ny + dpTanB * ty;

        // Separate spheres so they don't overlap
        const overlap = minDist - dist;
        this.cxA -= overlap * 0.5 * nx;
        this.cyA -= overlap * 0.5 * ny;
        this.cxB += overlap * 0.5 * nx;
        this.cyB += overlap * 0.5 * ny;

        // Spawn spark particles at collision point
        const cx = (this.cxA + this.cxB) / 2;
        const cy = (this.cyA + this.cyB) / 2;
        const sparkColors = ['#fbbf24', '#f59e0b', '#ef4444', '#fb923c', '#fde68a'];
        for (let i = 0; i < 12; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 2 + Math.random() * 4;
          this.sparks.push({
            x: cx,
            y: cy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1.0,
            size: 2 + Math.random() * 3,
            color: sparkColors[Math.floor(Math.random() * sparkColors.length)]
          });
        }
      }
    }

    // Update spark particles
    this.sparks = this.sparks.filter(s => s.life > 0);
    for (const s of this.sparks) {
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vx *= 0.96; // friction
      s.vy *= 0.96;
      s.life -= dt / this.sparkDuration;
    }
  }

  // Draw simulation state
  public draw(): void {
    if (!this.config) return;

    this.pc.clear();
    this.pc.resetOrigin();

    const { mode } = this.config;

    if (mode === 'projectile') {
      this.pc.originX = this.pc.canvas.clientWidth * 0.15;
      this.pc.originY = this.pc.canvas.clientHeight * 0.8;
      this.drawProjectile();
    } else if (mode === 'pulley') {
      this.pc.originX = this.pc.canvas.clientWidth / 2;
      // Inclined wedge is taller — push origin lower so the peak fits
      if (this.config.pulley.type === 'inclined') {
        this.pc.originY = this.pc.canvas.clientHeight * 0.55;
      } else {
        this.pc.originY = this.pc.canvas.clientHeight * 0.25;
      }
      this.drawPulleySystem();
    } else if (mode === 'collision') {
      this.pc.originX = this.pc.canvas.clientWidth / 2;
      this.pc.originY = this.pc.canvas.clientHeight / 2;
      this.drawCollisions();
    } else if (mode === 'circular') {
      this.pc.originX = this.pc.canvas.clientWidth / 2;
      this.pc.originY = this.pc.canvas.clientHeight / 2;
      this.drawCircular();
    }
  }

  private drawProjectile(): void {
    const params = this.config.projectile;
    const Cd = params.dragCoeff;

    // Draw Ground
    this.pc.ctx.save();
    this.pc.ctx.strokeStyle = this.pc.theme === 'dark' ? '#888' : '#444';
    this.pc.ctx.lineWidth = 4;
    const sStart = this.pc.toScreen(-2, 0);
    const sEnd = this.pc.toScreen(12, 0);
    this.pc.ctx.beginPath();
    this.pc.ctx.moveTo(sStart.x, sStart.y);
    this.pc.ctx.lineTo(sEnd.x, sEnd.y);
    this.pc.ctx.stroke();
    this.pc.ctx.restore();

    // Draw Trajectory Trail
    if (this.projectileTrail.length > 1) {
      this.pc.ctx.save();
      this.pc.ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
      this.pc.ctx.lineWidth = 2;
      this.pc.ctx.setLineDash([2, 2]);
      this.pc.ctx.beginPath();
      this.projectileTrail.forEach((pt, idx) => {
        const sPt = this.pc.toScreen(pt.x, pt.y);
        if (idx === 0) this.pc.ctx.moveTo(sPt.x, sPt.y);
        else this.pc.ctx.lineTo(sPt.x, sPt.y);
      });
      this.pc.ctx.stroke();
      this.pc.ctx.restore();
    }

    // Projectile ball
    const sProj = this.pc.toScreen(this.px, this.py);
    this.pc.ctx.save();
    this.pc.ctx.fillStyle = '#3b82f6';
    this.pc.ctx.strokeStyle = this.pc.theme === 'dark' ? '#fff' : '#000';
    this.pc.ctx.lineWidth = 2;
    this.pc.ctx.beginPath();
    this.pc.ctx.arc(sProj.x, sProj.y, 8, 0, 2 * Math.PI);
    this.pc.ctx.fill();
    this.pc.ctx.stroke();
    this.pc.ctx.restore();

    // Render physical vectors from ball center
    const vecScale = 0.15;
    const dragScale = 0.35;

    // 1. Velocity vector (green)
    const v = Math.sqrt(this.pvx * this.pvx + this.pvy * this.pvy);
    if (v > 0.1) {
      this.pc.drawArrow(this.px, this.py, this.px + this.pvx * vecScale, this.py + this.pvy * vecScale, '#10b981', `v = ${v.toFixed(1)}m/s`);
    }

    // 2. Drag force vector (purple) opposite to velocity
    if (Cd > 0 && v > 0.1) {
      const Fdx = -Cd * v * this.pvx;
      const Fdy = -Cd * v * this.pvy;
      const Fd = Math.sqrt(Fdx*Fdx + Fdy*Fdy);
      this.pc.drawArrow(this.px, this.py, this.px + Fdx * dragScale, this.py + Fdy * dragScale, '#a855f7', `Fd = ${Fd.toFixed(1)}N`, { labelOffset: -12 });
    }
  }

  private drawPulleySystem(): void {
    const params = this.config.pulley;
    const { type, massA, massB, angle, mu } = params;
    const g = params.gravity || 9.8;

    const pulleyRadius = 0.4;

    if (type === 'atwood') {
      // Pulley centered at 0, 0
      this.pc.drawPulley(0, 0, pulleyRadius, this.pulleyRot, '#bbb');

      // Left block A hanging (x = -pulleyRadius)
      // Height yA: base is at -2.0, shifts up with pulleyDisp
      const yA = -2.0 + this.pulleyDisp;
      const xA = -pulleyRadius;

      // Right block B hanging (x = pulleyRadius)
      // Height yB: base is at -2.0, shifts down with pulleyDisp
      const yB = -2.0 - this.pulleyDisp;
      const xB = pulleyRadius;

      // Draw strings from top of blocks to tangent points of pulley
      this.pc.ctx.save();
      this.pc.ctx.strokeStyle = this.pc.theme === 'dark' ? '#ccc' : '#555';
      this.pc.ctx.lineWidth = 1.5;

      const sA_top = this.pc.toScreen(xA, yA + 0.4);
      const sA_pulley = this.pc.toScreen(xA, 0);
      const sB_top = this.pc.toScreen(xB, yB + 0.4);
      const sB_pulley = this.pc.toScreen(xB, 0);

      this.pc.ctx.beginPath();
      this.pc.ctx.moveTo(sA_top.x, sA_top.y); this.pc.ctx.lineTo(sA_pulley.x, sA_pulley.y);
      this.pc.ctx.moveTo(sB_top.x, sB_top.y); this.pc.ctx.lineTo(sB_pulley.x, sB_pulley.y);
      this.pc.ctx.stroke();
      this.pc.ctx.restore();

      // Draw Blocks
      this.pc.drawBlock(xA, yA, 0.8, 0.8, 0, '#3b82f6', `${massA}kg`);
      this.pc.drawBlock(xB, yB, 0.8, 0.8, 0, '#ef4444', `${massB}kg`);

      // Tension and acceleration calculations
      const a = ((massB - massA) / (massA + massB)) * g;
      const T = massA * (g + a);

      // Draw force vectors on Block A and B
      const vecScale = 0.08;
      // Block A: gravity (down) and tension (up)
      this.pc.drawArrow(xA, yA, xA, yA - massA * g * vecScale, '#ef4444', `Fg = ${(massA * g).toFixed(1)}N`, { headSize: 6, labelOffset: -18 });
      this.pc.drawArrow(xA, yA, xA, yA + T * vecScale, '#10b981', `T = ${T.toFixed(1)}N`, { headSize: 6, labelOffset: 18 });

      // Block B: gravity (down) and tension (up)
      this.pc.drawArrow(xB, yB, xB, yB - massB * g * vecScale, '#ef4444', `Fg = ${(massB * g).toFixed(1)}N`, { headSize: 6, labelOffset: 18 });
      this.pc.drawArrow(xB, yB, xB, yB + T * vecScale, '#10b981', `T = ${T.toFixed(1)}N`, { headSize: 6, labelOffset: -18 });

    } else if (type === 'inclined') {
      const theta = angle;
      const thetaRad = theta * (Math.PI / 180);
      const cosT = Math.cos(thetaRad);
      const sinT = Math.sin(thetaRad);

      // Compute wedge geometry from angle so visual matches physics
      const baseY = -1.8;           // ground level
      const baseWidth = 5.0;        // horizontal span of wedge
      const wedgeRightX = 1.5;      // right edge of wedge (vertical side)
      const wedgeLeftX = wedgeRightX - baseWidth;
      const wedgeHeight = baseWidth * Math.tan(thetaRad);
      const peakY = baseY + wedgeHeight;

      // Pulley sits at the peak of the wedge
      const px = wedgeRightX;
      const py = peakY;
      this.pc.drawPulley(px, py, pulleyRadius, this.pulleyRot, '#bbb');

      // Draw wedge triangle: bottom-left → peak → bottom-right
      const sWedgeLeft = this.pc.toScreen(wedgeLeftX, baseY);
      const sWedgePeak = this.pc.toScreen(px, py);
      const sWedgeRight = this.pc.toScreen(px, baseY);

      this.pc.ctx.save();
      this.pc.ctx.fillStyle = this.pc.theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';
      this.pc.ctx.strokeStyle = this.pc.theme === 'dark' ? '#888' : '#444';
      this.pc.ctx.lineWidth = 2.5;

      this.pc.ctx.beginPath();
      this.pc.ctx.moveTo(sWedgeLeft.x, sWedgeLeft.y);
      this.pc.ctx.lineTo(sWedgePeak.x, sWedgePeak.y);
      this.pc.ctx.lineTo(sWedgeRight.x, sWedgeRight.y);
      this.pc.ctx.closePath();
      this.pc.ctx.fill();
      this.pc.ctx.stroke();
      this.pc.ctx.restore();

      // Angle indicator at bottom-left of wedge
      this.pc.drawAngleArc(wedgeLeftX, baseY, 45, 0, theta, '#888', `${theta}°`);

      // Block A on incline
      // Position: start from peak and go DOWN the slope by baseDistance
      // Then offset PERPENDICULAR to the slope to sit on top
      const baseDistance = 2.2 - this.pulleyDisp;
      const blockHalfH = 0.3; // block is 0.6 tall, half = 0.3

      // Point on slope surface, going down from peak
      const surfX = px - baseDistance * cosT;
      const surfY = py - baseDistance * sinT;

      // Offset perpendicular to slope (normal direction: -sinT, cosT)
      const ax = surfX - blockHalfH * sinT;
      const ay = surfY + blockHalfH * cosT;

      this.pc.drawBlock(ax, ay, 0.8, 0.6, theta, '#3b82f6', `${massA}kg`);

      // Hanging Block B (hangs below the pulley)
      const bx = px + pulleyRadius;
      const by = py - 1.2 - this.pulleyDisp;

      this.pc.drawBlock(bx, by, 0.7, 0.7, 0, '#ef4444', `${massB}kg`);

      // Strings
      this.pc.ctx.save();
      this.pc.ctx.strokeStyle = this.pc.theme === 'dark' ? '#ccc' : '#555';
      this.pc.ctx.lineWidth = 1.5;

      // Rope from block A (top edge along slope) to pulley tangent
      const sA_rope = this.pc.toScreen(ax + 0.4 * cosT, ay + 0.4 * sinT);
      const sPulley_slope = this.pc.toScreen(px - pulleyRadius * sinT, py + pulleyRadius * cosT);
      // Rope from block B (top edge) to pulley bottom
      const sB_rope = this.pc.toScreen(bx, by + 0.35);
      const sPulley_hang = this.pc.toScreen(bx, py);

      this.pc.ctx.beginPath();
      this.pc.ctx.moveTo(sA_rope.x, sA_rope.y); this.pc.ctx.lineTo(sPulley_slope.x, sPulley_slope.y);
      this.pc.ctx.moveTo(sB_rope.x, sB_rope.y); this.pc.ctx.lineTo(sPulley_hang.x, sPulley_hang.y);
      this.pc.ctx.stroke();

      this.pc.ctx.restore();

      // Incline system force analysis
      const Fn_A = massA * g * Math.cos(thetaRad);
      const Fg_parallel_A = massA * g * Math.sin(thetaRad);
      const Fdrive = massB * g - Fg_parallel_A;
      const Ff_max = mu * Fn_A;

      let a = 0;
      let Ff = 0;
      if (this.pulleyVel === 0) {
        if (Math.abs(Fdrive) > Ff_max) {
          Ff = -Math.sign(Fdrive) * Ff_max;
          a = (Fdrive + Ff) / (massA + massB);
        } else {
          a = 0;
          Ff = -Fdrive;
        }
      } else {
        Ff = -Math.sign(this.pulleyVel) * Ff_max;
        a = (Fdrive + Ff) / (massA + massB);
      }

      const T = massB * (g - a);
      const vecScale = 0.08;

      // Draw force vectors on Block B
      this.pc.drawArrow(bx, by, bx, by - massB * g * vecScale, '#ef4444', `Fg = ${(massB * g).toFixed(1)}N`, { headSize: 6, labelOffset: 18 });
      this.pc.drawArrow(bx, by, bx, by + T * vecScale, '#10b981', `T = ${T.toFixed(1)}N`, { headSize: 6, labelOffset: -18 });

      // Draw force vectors on Block A
      // 1. Gravity straight down
      this.pc.drawArrow(ax, ay, ax, ay - massA * g * vecScale, '#ef4444', `Fg = ${(massA * g).toFixed(1)}N`, { headSize: 6, labelOffset: -18 });

      // 2. Normal force perpendicular to incline (up-left direction: -sinT, cosT)
      this.pc.drawArrow(ax, ay, ax - Fn_A * vecScale * sinT, ay + Fn_A * vecScale * cosT, '#10b981', `Fn = ${Fn_A.toFixed(1)}N`, { headSize: 6, labelOffset: 15 });

      // 3. Tension parallel to incline (up-right direction: cosT, sinT)
      this.pc.drawArrow(ax, ay, ax + T * vecScale * cosT, ay + T * vecScale * sinT, '#f59e0b', `T = ${T.toFixed(1)}N`, { headSize: 6, labelOffset: 15 });

      // 4. Friction parallel to incline (opposing motion or potential motion)
      if (Math.abs(Ff) > 0.01) {
        this.pc.drawArrow(ax, ay, ax + Ff * vecScale * cosT, ay + Ff * vecScale * sinT, '#a855f7', `Ff = ${Math.abs(Ff).toFixed(1)}N`, { headSize: 6, labelOffset: -15 });
      }
    }
  }

  private drawCollisions(): void {
    const params = this.config.collision;

    // Draw boundary floor for 1D
    if (params.dimension === '1d') {
      this.pc.ctx.save();
      this.pc.ctx.strokeStyle = this.pc.theme === 'dark' ? '#666' : '#bbb';
      this.pc.ctx.lineWidth = 2.5;
      const sFloorStart = this.pc.toScreen(-4.5, -this.radiusA);
      const sFloorEnd = this.pc.toScreen(4.5, -this.radiusA);
      this.pc.ctx.beginPath();
      this.pc.ctx.moveTo(sFloorStart.x, sFloorStart.y);
      this.pc.ctx.lineTo(sFloorEnd.x, sFloorEnd.y);
      this.pc.ctx.stroke();
      this.pc.ctx.restore();
    }

    const drawSphere = (x: number, y: number, r: number, color: string, label: string) => {
      const sPos = this.pc.toScreen(x, y);
      const sr = r * this.pc.scale;

      this.pc.ctx.save();
      this.pc.ctx.fillStyle = color;
      this.pc.ctx.strokeStyle = this.pc.theme === 'dark' ? '#fff' : '#000';
      this.pc.ctx.lineWidth = 2.0;

      this.pc.ctx.beginPath();
      this.pc.ctx.arc(sPos.x, sPos.y, sr, 0, 2 * Math.PI);
      this.pc.ctx.fill();
      this.pc.ctx.stroke();

      // Label
      this.pc.ctx.fillStyle = '#fff';
      this.pc.ctx.font = 'bold 11px Outfit, sans-serif';
      this.pc.ctx.textAlign = 'center';
      this.pc.ctx.textBaseline = 'middle';
      this.pc.ctx.fillText(label, sPos.x, sPos.y);

      this.pc.ctx.restore();
    };

    // Draw Spheres
    drawSphere(this.cxA, this.cyA, this.radiusA, '#3b82f6', `${params.massA}kg`);
    drawSphere(this.cxB, this.cyB, this.radiusB, '#ef4444', `${params.massB}kg`);

    // Draw velocity vector arrows
    const vecScale = 0.4;
    // Ball A Velocity
    if (Math.abs(this.cvxA) > 0.05 || Math.abs(this.cvyA) > 0.05) {
      this.pc.drawArrow(
        this.cxA, this.cyA,
        this.cxA + this.cvxA * vecScale, this.cyA + this.cvyA * vecScale,
        '#3b82f6', `vA = ${Math.sqrt(this.cvxA*this.cvxA + this.cvyA*this.cvyA).toFixed(1)}m/s`
      );
    }
    // Ball B Velocity
    if (Math.abs(this.cvxB) > 0.05 || Math.abs(this.cvyB) > 0.05) {
      this.pc.drawArrow(
        this.cxB, this.cyB,
        this.cxB + this.cvxB * vecScale, this.cyB + this.cvyB * vecScale,
        '#ef4444', `vB = ${Math.sqrt(this.cvxB*this.cvxB + this.cvyB*this.cvyB).toFixed(1)}m/s`
      );
    }

    // Draw spark particles
    if (this.sparks.length > 0) {
      this.pc.ctx.save();
      for (const s of this.sparks) {
        const sPos = this.pc.toScreen(s.x, s.y);
        const alpha = Math.max(0, s.life);
        const r = s.size * alpha;

        // Glow
        this.pc.ctx.globalAlpha = alpha * 0.4;
        this.pc.ctx.fillStyle = s.color;
        this.pc.ctx.beginPath();
        this.pc.ctx.arc(sPos.x, sPos.y, r * 2.5, 0, 2 * Math.PI);
        this.pc.ctx.fill();

        // Core
        this.pc.ctx.globalAlpha = alpha;
        this.pc.ctx.beginPath();
        this.pc.ctx.arc(sPos.x, sPos.y, r, 0, 2 * Math.PI);
        this.pc.ctx.fill();
      }
      this.pc.ctx.restore();
    }
  }

  // Circular motion step update
  private stepCircular(dt: number, params: any): void {
    const { radius, speed, gravity, isVertical } = params;
    const r = radius;

    if (isVertical) {
      // Speed at bottom v0
      const v0 = speed;
      // Current angle relative to bottom (circularAngle measures standard angle)
      // Since bottom is -Math.PI / 2, the angle relative to bottom is theta = circularAngle - (-Math.PI / 2) = circularAngle + Math.PI / 2
      const theta = this.circularAngle + Math.PI / 2;
      const h = r * (1 - Math.cos(theta));
      
      const vSq = v0 * v0 - 2 * gravity * h;
      if (vSq > 0) {
        const v = Math.sqrt(vSq);
        const omega = v / r;
        this.circularAngle += omega * dt;
      } else {
        // Not enough energy to continue full loop: reverse direction (act like pendulum)
        // We will just step circularAngle as a pendulum approximation or let it stop
        this.circularAngle += (v0 / r) * dt; // Fallback to avoid complete freeze
      }
    } else {
      // Horizontal uniform circular motion
      const omega = speed / r;
      this.circularAngle += omega * dt;
    }

    // Keep angle within 0..2*PI
    this.circularAngle = this.circularAngle % (Math.PI * 2);
  }

  // Circular motion draw renderer
  private drawCircular(): void {
    const params = this.config.circular;
    if (!params) return;
    const { radius, speed, gravity, mass, isVertical } = params;

    const r = radius;
    const g = gravity;
    const m = mass;

    // Draw central pivot
    const sPivot = this.pc.toScreen(0, 0);
    this.pc.ctx.save();
    this.pc.ctx.fillStyle = this.pc.theme === 'dark' ? '#fff' : '#000';
    this.pc.ctx.beginPath();
    this.pc.ctx.arc(sPivot.x, sPivot.y, 6, 0, 2 * Math.PI);
    this.pc.ctx.fill();
    this.pc.ctx.restore();

    // Bob position
    const bx = r * Math.cos(this.circularAngle);
    const by = r * Math.sin(this.circularAngle);
    const sBob = this.pc.toScreen(bx, by);

    // Draw circular path (dashed grey line)
    this.pc.ctx.save();
    this.pc.ctx.strokeStyle = this.pc.theme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)';
    this.pc.ctx.lineWidth = 1.5;
    this.pc.ctx.setLineDash([4, 4]);
    this.pc.ctx.beginPath();
    this.pc.ctx.arc(sPivot.x, sPivot.y, r * this.pc.scale, 0, 2 * Math.PI);
    this.pc.ctx.stroke();
    this.pc.ctx.restore();

    // Draw string/rod from pivot to bob
    this.pc.ctx.save();
    this.pc.ctx.strokeStyle = this.pc.theme === 'dark' ? '#aaa' : '#555';
    this.pc.ctx.lineWidth = 2.0;
    this.pc.ctx.beginPath();
    this.pc.ctx.moveTo(sPivot.x, sPivot.y);
    this.pc.ctx.lineTo(sBob.x, sBob.y);
    this.pc.ctx.stroke();
    this.pc.ctx.restore();

    // Draw bob circle
    this.pc.ctx.save();
    this.pc.ctx.fillStyle = '#f59e0b';
    this.pc.ctx.strokeStyle = this.pc.theme === 'dark' ? '#fff' : '#000';
    this.pc.ctx.lineWidth = 2;
    this.pc.ctx.beginPath();
    this.pc.ctx.arc(sBob.x, sBob.y, 14, 0, 2 * Math.PI);
    this.pc.ctx.fill();
    this.pc.ctx.stroke();

    // Label bob mass
    this.pc.ctx.fillStyle = '#000';
    this.pc.ctx.font = 'bold 9px Outfit, sans-serif';
    this.pc.ctx.textAlign = 'center';
    this.pc.ctx.textBaseline = 'middle';
    this.pc.ctx.fillText(`${m}kg`, sBob.x, sBob.y);
    this.pc.ctx.restore();

    // Calculate forces
    const Fg = m * g;
    // Current angle relative to bottom
    const theta = this.circularAngle + Math.PI / 2;
    let v = speed;
    let T = 0;

    if (isVertical) {
      const h = r * (1 - Math.cos(theta));
      const vSq = speed * speed - 2 * g * h;
      v = vSq > 0 ? Math.sqrt(vSq) : 0;
      T = (m * v * v) / r + m * g * Math.cos(theta);
    } else {
      T = (m * speed * speed) / r;
    }

    const vecScale = 0.08;

    // Draw Force Vectors from Bob COM
    // 1. Gravity straight down
    this.pc.drawArrow(bx, by, bx, by - Fg * vecScale, '#ef4444', `Fg = ${Fg.toFixed(1)}N`, { headSize: 6, labelOffset: -12 });

    // 2. Tension: points inward along string to origin (0, 0)
    if (Math.abs(T) > 0.1) {
      const tensionDirectionX = -Math.cos(this.circularAngle);
      const tensionDirectionY = -Math.sin(this.circularAngle);
      this.pc.drawArrow(
        bx, by,
        bx + tensionDirectionX * T * vecScale, by + tensionDirectionY * T * vecScale,
        '#a855f7', `T = ${T.toFixed(1)}N`, { headSize: 6, labelOffset: 15 }
      );
    }

    // 3. Velocity: tangent to circular path (points counter-clockwise: -sin(angle), cos(angle))
    if (v > 0.1) {
      const tangentX = -Math.sin(this.circularAngle);
      const tangentY = Math.cos(this.circularAngle);
      const velScale = 0.3;
      this.pc.drawArrow(
        bx, by,
        bx + tangentX * v * velScale, by + tangentY * v * velScale,
        '#22d3ee', `v = ${v.toFixed(1)}m/s`, { headSize: 6, labelOffset: 12 }
      );
    }
  }
}
