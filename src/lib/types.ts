export type DiagramType = 'fbd' | 'vector' | 'shm' | 'wave' | 'mechanics' | 'fluids' | 'gravity';

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
  integrator?: 'euler' | 'rk4';
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

export interface CircularParams {
  radius: number; // m
  speed: number;  // m/s (initial velocity at bottom for vertical, constant speed for horizontal)
  mass: number;   // kg
  gravity: number; // m/s^2
  isVertical: boolean; // toggle vertical vs horizontal circular motion
}

export interface MechanicsConfig extends BaseConfig {
  type: 'mechanics';
  mode: 'projectile' | 'pulley' | 'collision' | 'circular';
  projectile: ProjectileParams;
  pulley: PulleyParams;
  collision: CollisionParams;
  circular?: CircularParams;
}

// ------------------ FLUIDS (HYDROSTATICS, PASCAL, DYNAMICS) ------------------
export interface BuoyancyParams {
  fluidDensity: number; // kg/m^3 (e.g. 1000 for water, 800 for oil)
  blockMass: number; // kg
  blockVolume: number; // m^3
  gravity: number; // m/s^2
  showVectors: boolean;
}

export interface PascalParams {
  area1: number; // m^2
  area2: number; // m^2
  force1: number; // N
  displacement1: number; // m
  gravity: number; // m/s^2
}

export interface FluidsConfig extends BaseConfig {
  type: 'fluids';
  mode: 'buoyancy' | 'pascal' | 'bernoulli' | 'viscosity';
  buoyancy: BuoyancyParams;
  pascal: PascalParams;
  bernoulli: {
    fluidDensity: number;
    flowRate: number; // m^3/s
    diameter1: number; // m
    diameter2: number; // m
  };
  viscosity: {
    fluidDensity: number;
    viscosity: number; // Pa s
    sphereRadius: number; // m
    sphereDensity: number; // kg/m^3
    gravity: number; // m/s^2
  };
}

// ------------------ GRAVITY & ORBITAL MECHANICS ------------------
export interface KeplerianParams {
  eccentricity: number; // e (0 to 0.8)
  semiMajorAxis: number; // a (arbitrary canvas scale units, e.g. 1.0 to 4.0)
  showSectors: boolean; // toggle Kepler's 2nd Law sector sweeping
  simulationSpeed: number;
}

export interface TwoBodyParams {
  massRatio: number; // m2 / m1
  initialDistance: number;
  initialVelocity: number;
}

export interface EscapeVelocityParams {
  launchVelocity: number;
  planetMass: number;
  planetRadius: number;
}

export interface GravityConfig extends BaseConfig {
  type: 'gravity';
  mode: 'kepler' | 'twobody' | 'escape';
  kepler: KeplerianParams;
  twobody: TwoBodyParams;
  escape: EscapeVelocityParams;
}

export type PhysicsConfig = FbdConfig | VectorConfig | ShmConfig | WaveConfig | MechanicsConfig | FluidsConfig | GravityConfig;


