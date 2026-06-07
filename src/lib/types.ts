export type DiagramType = 'fbd' | 'vector' | 'shm' | 'wave' | 'mechanics';

export interface BaseConfig {
  type: DiagramType;
}

// ------------------ FREE BODY DIAGRAM (FBD) ------------------
export interface ForceVector {
  name: string;
  magnitude: number; // in Newtons
  angle: number; // in degrees (0 = right, 90 = up)
  color?: string;
  isComponent?: boolean;
}

export interface FbdConfig extends BaseConfig {
  type: 'fbd';
  surfaceType: 'horizontal' | 'inclined' | 'suspended';
  inclineAngle: number; // degrees
  blockMass: number; // kg
  mu: number; // coefficient of friction
  gravity: number; // m/s^2
  appliedForce: {
    magnitude: number;
    angle: number; // relative to incline/horizontal
  };
  showComponents: boolean;
  showGrid: boolean;
}

// ------------------ VECTORS ------------------
export interface VectorItem {
  id: string;
  x: number;
  y: number;
  z?: number; // for 3D cross product
  color: string;
  label: string;
}

export interface VectorConfig extends BaseConfig {
  type: 'vector';
  vectors: VectorItem[];
  operation: 'none' | 'add' | 'subtract' | 'dot' | 'cross';
  showComponents: boolean;
  showGrid: boolean;
  coordinateMode: 'cartesian' | 'polar';
}

// ------------------ SHM (SIMPLE HARMONIC MOTION) ------------------
export interface ShmConfig extends BaseConfig {
  type: 'shm';
  systemType: 'spring-mass-horizontal' | 'spring-mass-vertical' | 'simple-pendulum';
  mass: number; // kg
  springK: number; // N/m (for spring)
  length: number; // meters (for pendulum)
  gravity: number; // m/s^2
  damping: number; // damping factor b
  initialDisplacement: number; // m (spring) or degrees (pendulum)
  initialVelocity: number; // m/s
  drivingForce: number; // F_0 amplitude
  drivingFreq: number; // omega_d frequency
  showEnergyGraph: boolean;
  showPhaseSpace: boolean;
}

// ------------------ WAVES ------------------
export interface WaveConfig extends BaseConfig {
  type: 'wave';
  waveType: 'transverse' | 'longitudinal' | 'superposition' | 'standing';
  amplitude: number;
  frequency: number;
  wavelength: number;
  damping: number;
  superposition: {
    pulseA: { amplitude: number; width: number; speed: number; direction: 1 | -1 };
    pulseB: { amplitude: number; width: number; speed: number; direction: 1 | -1 };
  };
}

// ------------------ MECHANICS (PROJECTILES, PULLEYS, COLLISIONS) ------------------
export interface ProjectileParams {
  velocity: number; // m/s
  angle: number; // degrees
  mass: number; // kg
  gravity: number; // m/s^2
  dragCoeff: number; // quadratic drag coefficient b
}

export interface PulleyParams {
  type: 'atwood' | 'inclined';
  massA: number; // kg
  massB: number; // kg
  angle: number; // incline angle for Mass A
  mu: number; // friction coefficient for Mass A on incline
  gravity: number; // m/s^2
}

export interface CollisionParams {
  dimension: '1d' | '2d';
  massA: number;
  massB: number;
  velocityA: number;
  velocityB: number;
  angleA: number; // approach angle for 2D (degrees)
  angleB: number; // approach angle for 2D (degrees)
  restitution: number; // e (0 to 1)
}

export interface MechanicsConfig extends BaseConfig {
  type: 'mechanics';
  mode: 'projectile' | 'pulley' | 'collision';
  projectile: ProjectileParams;
  pulley: PulleyParams;
  collision: CollisionParams;
}

export type PhysicsConfig = FbdConfig | VectorConfig | ShmConfig | WaveConfig | MechanicsConfig;
