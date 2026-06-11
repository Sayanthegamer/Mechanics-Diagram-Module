import './style.css';
import type { PhysicsConfig, EmConfig } from './lib/types';
import { PhysicsCanvas } from './lib/PhysicsCanvas';
import { FbdDiagram } from './lib/diagrams/FbdDiagram';
import { VectorDiagram } from './lib/diagrams/VectorDiagram';
import { ShmDiagram } from './lib/diagrams/ShmDiagram';
import { WaveDiagram } from './lib/diagrams/WaveDiagram';
import { MechanicsDiagram } from './lib/diagrams/MechanicsDiagram';
import { FluidsDiagram } from './lib/diagrams/FluidsDiagram';
import { GravityDiagram } from './lib/diagrams/GravityDiagram';
import { ThermoDiagram } from './lib/diagrams/ThermoDiagram';
import { EmDiagram } from './lib/diagrams/EmDiagram';
import { GraphModule } from './lib/diagrams/GraphModule';
import type { GraphMode } from './lib/diagrams/GraphModule';
import { Circuit } from './lib/diagrams/circuit/circuit';
import { deserializeCircuit } from './lib/diagrams/circuit/serialization';
import { CircuitDiagram } from './lib/diagrams/CircuitDiagram';


// --- Preset Configurations ---
const PRESETS: Record<string, PhysicsConfig> = {
  'fbd-horizontal': {
    type: 'fbd',
    surfaceType: 'horizontal',
    inclineAngle: 0,
    blockMass: 6.0,
    mu: 0.35,
    gravity: 9.8,
    appliedForce: { magnitude: 32.0, angle: 20.0 },
    showComponents: false,
    showGrid: true
  },
  'fbd-inclined': {
    type: 'fbd',
    surfaceType: 'inclined',
    inclineAngle: 30,
    blockMass: 5.0,
    mu: 0.2,
    gravity: 9.8,
    appliedForce: { magnitude: 12.0, angle: 10.0 },
    showComponents: true,
    showGrid: true
  },
  'fbd-suspended': {
    type: 'fbd',
    surfaceType: 'suspended',
    inclineAngle: 0,
    blockMass: 8.0,
    mu: 0,
    gravity: 9.8,
    appliedForce: { magnitude: 20.0, angle: 0 },
    showComponents: false,
    showGrid: false
  },
  'vector-none': {
    type: 'vector',
    vectors: [
      { id: 'A', x: 4.0, y: 3.0, color: '#6366f1', label: 'Vector A' },
      { id: 'B', x: -2.0, y: 3.5, color: '#f59e0b', label: 'Vector B' }
    ],
    operation: 'none',
    showComponents: true,
    showGrid: true,
    coordinateMode: 'cartesian'
  },
  'vector-add': {
    type: 'vector',
    vectors: [
      { id: 'A', x: 3.5, y: 1.5, color: '#6366f1', label: 'A' },
      { id: 'B', x: 1.0, y: 2.5, color: '#f59e0b', label: 'B' }
    ],
    operation: 'add',
    showComponents: false,
    showGrid: true,
    coordinateMode: 'cartesian'
  },
  'vector-subtract': {
    type: 'vector',
    vectors: [
      { id: 'A', x: 3.0, y: 3.5, color: '#6366f1', label: 'A' },
      { id: 'B', x: 4.5, y: 1.0, color: '#f59e0b', label: 'B' }
    ],
    operation: 'subtract',
    showComponents: false,
    showGrid: true,
    coordinateMode: 'cartesian'
  },
  'vector-dot': {
    type: 'vector',
    vectors: [
      { id: 'A', x: 3.5, y: 3.0, color: '#6366f1', label: 'A' },
      { id: 'B', x: 5.0, y: 0.0, color: '#10b981', label: 'B' }
    ],
    operation: 'dot',
    showComponents: false,
    showGrid: true,
    coordinateMode: 'cartesian'
  },
  'vector-cross': {
    type: 'vector',
    vectors: [
      { id: 'A', x: 3.5, y: 1.0, z: 0, color: '#6366f1', label: 'A' },
      { id: 'B', x: 1.0, y: 3.5, z: 0, color: '#f59e0b', label: 'B' }
    ],
    operation: 'cross',
    showComponents: false,
    showGrid: false,
    coordinateMode: 'cartesian'
  },
  'shm-horizontal': {
    type: 'shm',
    systemType: 'spring-mass-horizontal',
    mass: 2.5,
    springK: 15.0,
    length: 2.0,
    gravity: 9.8,
    damping: 0.1,
    initialDisplacement: 1.5,
    initialVelocity: 0.0,
    drivingForce: 0.0,
    drivingFreq: 0.0,
    showEnergyGraph: true,
    showPhaseSpace: false,
    integrator: 'euler'
  },
  'shm-vertical': {
    type: 'shm',
    systemType: 'spring-mass-vertical',
    mass: 3.0,
    springK: 20.0,
    length: 2.0,
    gravity: 9.8,
    damping: 0.15,
    initialDisplacement: -1.0,
    initialVelocity: 0.0,
    drivingForce: 0.0,
    drivingFreq: 0.0,
    showEnergyGraph: true,
    showPhaseSpace: false,
    integrator: 'euler'
  },
  'shm-pendulum': {
    type: 'shm',
    systemType: 'simple-pendulum',
    mass: 2.0,
    springK: 15.0,
    length: 3.0,
    gravity: 9.8,
    damping: 0.05,
    initialDisplacement: 45.0, // degrees
    initialVelocity: 0.0,
    drivingForce: 0.0,
    drivingFreq: 0.0,
    showEnergyGraph: true,
    showPhaseSpace: false,
    integrator: 'euler'
  },
  'shm-damped': {
    type: 'shm',
    systemType: 'spring-mass-horizontal',
    mass: 1.5,
    springK: 12.0,
    length: 2.0,
    gravity: 9.8,
    damping: 0.4,
    initialDisplacement: 2.0,
    initialVelocity: 0.0,
    drivingForce: 4.5,
    drivingFreq: 2.2, // driven resonance
    showEnergyGraph: false,
    showPhaseSpace: true,
    integrator: 'euler'
  },
  'wave-transverse': {
    type: 'wave',
    waveType: 'transverse',
    amplitude: 1.5,
    frequency: 0.8,
    wavelength: 3.0,
    damping: 0.05,
    superposition: {
      pulseA: { amplitude: 1, width: 0.5, speed: 1, direction: 1 },
      pulseB: { amplitude: 1, width: 0.5, speed: 1, direction: -1 }
    }
  },
  'wave-longitudinal': {
    type: 'wave',
    waveType: 'longitudinal',
    amplitude: 1.2,
    frequency: 0.6,
    wavelength: 3.5,
    damping: 0.02,
    superposition: {
      pulseA: { amplitude: 1, width: 0.5, speed: 1, direction: 1 },
      pulseB: { amplitude: 1, width: 0.5, speed: 1, direction: -1 }
    }
  },
  'wave-superposition': {
    type: 'wave',
    waveType: 'superposition',
    amplitude: 1.5,
    frequency: 0.5,
    wavelength: 3.0,
    damping: 0,
    superposition: {
      pulseA: { amplitude: 2.0, width: 0.4, speed: 1.2, direction: 1 },
      pulseB: { amplitude: -2.0, width: 0.4, speed: 1.2, direction: -1 } // destructive packet
    }
  },
  'wave-standing': {
    type: 'wave',
    waveType: 'standing',
    amplitude: 2.0,
    frequency: 0.8,
    wavelength: 3.0,
    damping: 0,
    superposition: {
      pulseA: { amplitude: 1, width: 0.5, speed: 1, direction: 1 },
      pulseB: { amplitude: 1, width: 0.5, speed: 1, direction: -1 }
    }
  },
  'mech-projectile-drag': {
    type: 'mechanics',
    mode: 'projectile',
    projectile: {
      velocity: 18.0,
      angle: 45.0,
      mass: 1.2,
      gravity: 9.8,
      dragCoeff: 0.04 // air resistance
    },
    pulley: { type: 'atwood', massA: 2.0, massB: 3.0, angle: 30, mu: 0.1, gravity: 9.8 },
    collision: { dimension: '1d', massA: 2.0, massB: 3.0, velocityA: 2.0, velocityB: -1.0, angleA: 0, angleB: 0, restitution: 0.8 }
  },
  'mech-pulley-atwood': {
    type: 'mechanics',
    mode: 'pulley',
    projectile: { velocity: 15, angle: 45, mass: 1, gravity: 9.8, dragCoeff: 0 },
    pulley: {
      type: 'atwood',
      massA: 2.5,
      massB: 4.5,
      angle: 30,
      mu: 0.15,
      gravity: 9.8
    },
    collision: { dimension: '1d', massA: 2.0, massB: 3.0, velocityA: 2.0, velocityB: -1.0, angleA: 0, angleB: 0, restitution: 0.8 }
  },
  'mech-pulley-inclined': {
    type: 'mechanics',
    mode: 'pulley',
    projectile: { velocity: 15, angle: 45, mass: 1, gravity: 9.8, dragCoeff: 0 },
    pulley: {
      type: 'inclined',
      massA: 3.5,
      massB: 5.0,
      angle: 30, // 30 deg slope
      mu: 0.2, // incline friction
      gravity: 9.8
    },
    collision: { dimension: '1d', massA: 2.0, massB: 3.0, velocityA: 2.0, velocityB: -1.0, angleA: 0, angleB: 0, restitution: 0.8 }
  },
  'mech-collision-1d': {
    type: 'mechanics',
    mode: 'collision',
    projectile: { velocity: 15, angle: 45, mass: 1, gravity: 9.8, dragCoeff: 0 },
    pulley: { type: 'atwood', massA: 2, massB: 3, angle: 30, mu: 0.1, gravity: 9.8 },
    collision: {
      dimension: '1d',
      massA: 2.0,
      massB: 4.0,
      velocityA: 4.0,
      velocityB: -2.0,
      angleA: 0,
      angleB: 0,
      restitution: 0.9 // elastic bounce
    }
  },
  'mech-collision-2d': {
    type: 'mechanics',
    mode: 'collision',
    projectile: { velocity: 15, angle: 45, mass: 1, gravity: 9.8, dragCoeff: 0 },
    pulley: { type: 'atwood', massA: 2, massB: 3, angle: 30, mu: 0.1, gravity: 9.8 },
    collision: {
      dimension: '2d',
      massA: 2.5,
      massB: 3.5,
      velocityA: 3.5,
      velocityB: 2.0,
      angleA: 30,  // angle of approach A
      angleB: 150, // angle of approach B
      restitution: 0.6 // inelastic bounce
    }
  },
  'mech-circular-horizontal': {
    type: 'mechanics',
    mode: 'circular',
    projectile: { velocity: 15, angle: 45, mass: 1, gravity: 9.8, dragCoeff: 0 },
    pulley: { type: 'atwood', massA: 2, massB: 3, angle: 30, mu: 0.1, gravity: 9.8 },
    collision: { dimension: '1d', massA: 2, massB: 3, velocityA: 2, velocityB: -1, angleA: 0, angleB: 0, restitution: 0.8 },
    circular: {
      radius: 2.2,
      speed: 4.5,
      mass: 1.5,
      gravity: 9.8,
      isVertical: false
    }
  },
  'mech-circular-vertical': {
    type: 'mechanics',
    mode: 'circular',
    projectile: { velocity: 15, angle: 45, mass: 1, gravity: 9.8, dragCoeff: 0 },
    pulley: { type: 'atwood', massA: 2, massB: 3, angle: 30, mu: 0.1, gravity: 9.8 },
    collision: { dimension: '1d', massA: 2, massB: 3, velocityA: 2, velocityB: -1, angleA: 0, angleB: 0, restitution: 0.8 },
    circular: {
      radius: 2.0,
      speed: 7.0,
      mass: 2.0,
      gravity: 9.8,
      isVertical: true
    }
  },
  'fluids-buoyancy': {
    type: 'fluids',
    mode: 'buoyancy',
    buoyancy: {
      fluidDensity: 1000,
      blockMass: 2.0,
      blockVolume: 0.005,
      gravity: 9.8,
      showVectors: true
    },
    pascal: {
      area1: 1.0,
      area2: 3.0,
      force1: 10.0,
      displacement1: 0,
      gravity: 9.8
    },
    bernoulli: {
      fluidDensity: 1000,
      flowRate: 0.015,
      diameter1: 0.2,
      diameter2: 0.1
    },
    viscosity: {
      fluidDensity: 1000,
      viscosity: 0.001,
      sphereRadius: 0.05,
      sphereDensity: 2500,
      gravity: 9.8
    }
  },
  'fluids-pascal': {
    type: 'fluids',
    mode: 'pascal',
    buoyancy: {
      fluidDensity: 1000,
      blockMass: 2.0,
      blockVolume: 0.005,
      gravity: 9.8,
      showVectors: true
    },
    pascal: {
      area1: 1.0,
      area2: 3.0,
      force1: 15.0,
      displacement1: 0,
      gravity: 9.8
    },
    bernoulli: {
      fluidDensity: 1000,
      flowRate: 0.015,
      diameter1: 0.2,
      diameter2: 0.1
    },
    viscosity: {
      fluidDensity: 1000,
      viscosity: 0.001,
      sphereRadius: 0.05,
      sphereDensity: 2500,
      gravity: 9.8
    }
  },
  'fluids-bernoulli': {
    type: 'fluids',
    mode: 'bernoulli',
    buoyancy: {
      fluidDensity: 1000,
      blockMass: 2.0,
      blockVolume: 0.005,
      gravity: 9.8,
      showVectors: true
    },
    pascal: {
      area1: 1.0,
      area2: 3.0,
      force1: 15.0,
      displacement1: 0,
      gravity: 9.8
    },
    bernoulli: {
      fluidDensity: 1000,
      flowRate: 0.015,
      diameter1: 1.2,
      diameter2: 0.5
    },
    viscosity: {
      fluidDensity: 1000,
      viscosity: 0.1,
      sphereRadius: 0.08,
      sphereDensity: 2500,
      gravity: 9.8
    }
  },
  'fluids-viscosity': {
    type: 'fluids',
    mode: 'viscosity',
    buoyancy: {
      fluidDensity: 1000,
      blockMass: 2.0,
      blockVolume: 0.005,
      gravity: 9.8,
      showVectors: true
    },
    pascal: {
      area1: 1.0,
      area2: 3.0,
      force1: 15.0,
      displacement1: 0,
      gravity: 9.8
    },
    bernoulli: {
      fluidDensity: 1000,
      flowRate: 0.015,
      diameter1: 1.2,
      diameter2: 0.5
    },
    viscosity: {
      fluidDensity: 900,
      viscosity: 0.2,
      sphereRadius: 0.1,
      sphereDensity: 2200,
      gravity: 9.8
    }
  },
  'gravity-kepler': {
    type: 'gravity',
    mode: 'kepler',
    kepler: {
      eccentricity: 0.5,
      semiMajorAxis: 3.0,
      showSectors: true,
      simulationSpeed: 1.0
    },
    twobody: {
      massRatio: 1.0,
      initialDistance: 3.0,
      initialVelocity: 1.5
    },
    escape: {
      launchVelocity: 3.5,
      planetMass: 15.0,
      planetRadius: 0.8,
      launchAltitude: 1.2,
      launchAngle: 90.0
    }
  },
  'gravity-twobody': {
    type: 'gravity',
    mode: 'twobody',
    kepler: {
      eccentricity: 0.5,
      semiMajorAxis: 3.0,
      showSectors: true,
      simulationSpeed: 1.0
    },
    twobody: {
      massRatio: 1.0,
      initialDistance: 3.0,
      initialVelocity: 1.5
    },
    escape: {
      launchVelocity: 3.5,
      planetMass: 15.0,
      planetRadius: 0.8,
      launchAltitude: 1.2,
      launchAngle: 90.0
    }
  },
  'gravity-escape': {
    type: 'gravity',
    mode: 'escape',
    kepler: {
      eccentricity: 0.5,
      semiMajorAxis: 3.0,
      showSectors: true,
      simulationSpeed: 1.0
    },
    twobody: {
      massRatio: 1.0,
      initialDistance: 3.0,
      initialVelocity: 1.5
    },
    escape: {
      launchVelocity: 3.5,
      planetMass: 15.0,
      planetRadius: 0.8,
      launchAltitude: 1.2,
      launchAngle: 90.0
    }
  },
  'thermo-kinetic-theory': {
    type: 'thermo',
    mode: 'kinetic-theory',
    temperature: 3.0,
    particleCount: 100,
    volume: 3.0,
    heatInput: 0,
    showDistribution: true,
    showEntropy: false,
    autoCycle: false
  },
  'thermo-piston-engine': {
    type: 'thermo',
    mode: 'piston-engine',
    temperature: 3.0,
    particleCount: 60,
    volume: 3.0,
    heatInput: 0,
    showDistribution: false,
    showEntropy: false,
    autoCycle: false
  },
  'thermo-diffusion': {
    type: 'thermo',
    mode: 'diffusion',
    temperature: 3.0,
    particleCount: 120,
    volume: 3.0,
    heatInput: 0,
    showDistribution: false,
    showEntropy: true,
    autoCycle: false
  },
  'em-single': {
    type: 'em',
    charges: [
      { id: 'q1', x: 0.0, y: 0.0, q: 2.0 }
    ],
    bField: 2.0,
    bFieldMode: 'symbols',
    gunX: -6.0,
    gunY: 0.0,
    gunAngle: 0.0,
    gunSpeed: 15.0,
    particleCharge: 2.0,
    particleMass: 1.0
  },
  'em-dipole': {
    type: 'em',
    charges: [
      { id: 'q1', x: -1.5, y: 0.0, q: 2.0 },
      { id: 'q2', x: 1.5, y: 0.0, q: -2.0 }
    ],
    bField: 2.0,
    bFieldMode: 'symbols',
    gunX: -6.0,
    gunY: 0.0,
    gunAngle: 0.0,
    gunSpeed: 15.0,
    particleCharge: 2.0,
    particleMass: 1.0
  },
  'em-quadrupole': {
    type: 'em',
    charges: [
      { id: 'q1', x: -1.5, y: 1.5, q: 2.0 },
      { id: 'q2', x: 1.5, y: 1.5, q: -2.0 },
      { id: 'q3', x: -1.5, y: -1.5, q: -2.0 },
      { id: 'q4', x: 1.5, y: -1.5, q: 2.0 }
    ],
    bField: 2.0,
    bFieldMode: 'symbols',
    gunX: -6.0,
    gunY: 0.0,
    gunAngle: 0.0,
    gunSpeed: 15.0,
    particleCharge: 2.0,
    particleMass: 1.0
  },
  'circuit-rc': {
    type: 'circuit',
    elements: [
      { id: 'gnd', type: 'ground', x: 0, y: 100, x2: 0, y2: 100 },
      { id: 'vsrc', type: 'voltage', x: 0, y: 100, x2: 0, y2: 0, maxVoltage: 5.0, waveform: 'SQUARE', frequency: 100 },
      { id: 'r1', type: 'resistor', x: 0, y: 0, x2: 100, y2: 0, resistance: 1000 },
      { id: 'c1', type: 'capacitor', x: 100, y: 0, x2: 100, y2: 100, capacitance: 1e-6, esr: 0.1 },
      { id: 'w1', type: 'wire', x: 100, y: 100, x2: 0, y2: 100 }
    ]
  },
  'circuit-rlc': {
    type: 'circuit',
    elements: [
      { id: 'gnd', type: 'ground', x: 0, y: 100, x2: 0, y2: 100 },
      { id: 'vsrc', type: 'voltage', x: 0, y: 100, x2: 0, y2: 0, maxVoltage: 5.0, waveform: 'SQUARE', frequency: 50 },
      { id: 'r1', type: 'resistor', x: 0, y: 0, x2: 100, y2: 0, resistance: 50 },
      { id: 'l1', type: 'inductor', x: 100, y: 0, x2: 200, y2: 0, inductance: 0.1, seriesResistance: 0.1 },
      { id: 'c1', type: 'capacitor', x: 200, y: 0, x2: 200, y2: 100, capacitance: 1e-5, esr: 0.1 },
      { id: 'w1', type: 'wire', x: 200, y: 100, x2: 0, y2: 100 }
    ]
  },
  'circuit-switch': {
    type: 'circuit',
    elements: [
      { id: 'gnd', type: 'ground', x: 0, y: 100, x2: 0, y2: 100 },
      { id: 'vsrc', type: 'voltage', x: 0, y: 100, x2: 0, y2: 0, maxVoltage: 5.0, waveform: 'DC' },
      { id: 'sw1', type: 'switch', x: 0, y: 0, x2: 100, y2: 0, closed: true },
      { id: 'r1', type: 'resistor', x: 100, y: 0, x2: 200, y2: 0, resistance: 1000 },
      { id: 'c1', type: 'capacitor', x: 200, y: 0, x2: 200, y2: 100, capacitance: 1e-6, esr: 0.1 },
      { id: 'w1', type: 'wire', x: 200, y: 100, x2: 0, y2: 100 }
    ]
  }
};

// --- Orchestrator App State ---
let activeConfig: PhysicsConfig = { ...PRESETS['shm-horizontal'] };
let isPlaying: boolean = true;
let simSpeed: number = 1.0;
let lastTime: number = 0;
let isDragging: boolean = false;
let dragTarget: string | null = null;
let lastPanX = 0;
let lastPanY = 0;

// Render Canvas classes
let pc: PhysicsCanvas;
let graphModule: GraphModule;

// Individual Diagram Modifiers
let fbdDiagram: FbdDiagram;
let vectorDiagram: VectorDiagram;
let shmDiagram: ShmDiagram;
let waveDiagram: WaveDiagram;
let mechanicsDiagram: MechanicsDiagram;
let fluidsDiagram: FluidsDiagram;
let gravityDiagram: GravityDiagram;
let thermoDiagram: ThermoDiagram;
let emDiagram: EmDiagram;
let selectedChargeId: string | null = null;
let circuitEngine: Circuit;
let circuitDiagram: CircuitDiagram;
let lastCircuitSwitchToggleTime = 0;
let circuitHistory: { t: number; voltages: number[] }[] = [];


// DOM Elements
const selectPreset = document.getElementById('select-preset') as HTMLSelectElement;
const btnPlayPause = document.getElementById('btn-play-pause') as HTMLButtonElement;
const btnStep = document.getElementById('btn-step') as HTMLButtonElement;
const btnReset = document.getElementById('btn-reset') as HTMLButtonElement;
const sliderSpeed = document.getElementById('slider-speed') as HTMLInputElement;
const labelSpeed = document.getElementById('label-speed') as HTMLSpanElement;
const selectGraphMode = document.getElementById('select-graph-mode') as HTMLSelectElement;
const btnThemeToggle = document.getElementById('btn-theme-toggle') as HTMLButtonElement;
const btnApplyCode = document.getElementById('btn-apply-code') as HTMLButtonElement;
const codeEditor = document.getElementById('code-editor') as HTMLTextAreaElement;
const dynamicSliders = document.getElementById('dynamic-sliders') as HTMLDivElement;

const canvasTitle = document.getElementById('canvas-title') as HTMLDivElement;
const graphTitle = document.getElementById('graph-title') as HTMLDivElement;
const graphCard = document.getElementById('graph-card') as HTMLDivElement;

const statusTime = document.getElementById('status-time') as HTMLSpanElement;
const statusExtra1 = document.getElementById('status-extra-1') as HTMLDivElement;
const statusExtra2 = document.getElementById('status-extra-2') as HTMLDivElement;
const statusExtra3 = document.getElementById('status-extra-3') as HTMLDivElement;

// --- Initialize App ---
function init() {
  const pCanvas = document.getElementById('physics-canvas') as HTMLCanvasElement;
  const gCanvas = document.getElementById('graph-canvas') as HTMLCanvasElement;

  pc = new PhysicsCanvas(pCanvas);
  graphModule = new GraphModule(gCanvas);

  fbdDiagram = new FbdDiagram(pc);
  vectorDiagram = new VectorDiagram(pc);
  shmDiagram = new ShmDiagram(pc);
  waveDiagram = new WaveDiagram(pc);
  mechanicsDiagram = new MechanicsDiagram(pc);
  fluidsDiagram = new FluidsDiagram(pc);
  gravityDiagram = new GravityDiagram(pc);
  thermoDiagram = new ThermoDiagram(pc);
  emDiagram = new EmDiagram(pc);
  circuitEngine = new Circuit();
  circuitDiagram = new CircuitDiagram(pc);
  circuitDiagram.setCircuit(circuitEngine);


  // Load initial preset
  loadPreset('shm-horizontal');

  // Register event listeners
  selectPreset.addEventListener('change', () => loadPreset(selectPreset.value));
  btnPlayPause.addEventListener('click', togglePlayPause);
  btnStep.addEventListener('click', stepSingleFrame);
  btnReset.addEventListener('click', resetSimulation);
  sliderSpeed.addEventListener('input', handleSpeedChange);
  btnThemeToggle.addEventListener('click', toggleTheme);
  btnApplyCode.addEventListener('click', handleCodeApply);
  selectGraphMode.addEventListener('change', handleGraphModeChange);

  window.addEventListener('resize', () => {
    pc.resize();
    graphModule.resize();
  });

  // Canvas Drag/Interaction handlers
  pCanvas.addEventListener('mousedown', (e) => handleInteractionStart(e.clientX, e.clientY));
  pCanvas.addEventListener('mousemove', (e) => handleInteractionMove(e.clientX, e.clientY));
  pCanvas.addEventListener('mouseup', handleInteractionEnd);
  pCanvas.addEventListener('mouseleave', handleInteractionEnd);

  pCanvas.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0) {
      handleInteractionStart(e.touches[0].clientX, e.touches[0].clientY);
    }
  });
  pCanvas.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
      handleInteractionMove(e.touches[0].clientX, e.touches[0].clientY);
      e.preventDefault(); // prevent scroll
    }
  }, { passive: false });
  pCanvas.addEventListener('touchend', handleInteractionEnd);
  pCanvas.addEventListener('touchcancel', handleInteractionEnd);

  // Keyboard accessibility
  window.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) {
      return;
    }
    if (e.code === 'Space') {
      e.preventDefault();
      togglePlayPause();
    } else if (e.code === 'KeyR') {
      resetSimulation();
    } else if (e.code === 'KeyT') {
      toggleTheme();
    } else if (e.code === 'BracketRight') {
      cyclePreset(1);
    } else if (e.code === 'BracketLeft') {
      cyclePreset(-1);
    }
  });

  // Start animation loop
  lastTime = performance.now();
  requestAnimationFrame(simulationLoop);
}

// --- Keyboard preset cycler ---
function cyclePreset(dir: number) {
  const keys = Object.keys(PRESETS);
  const currentKey = selectPreset.value;
  let index = keys.indexOf(currentKey);
  if (index !== -1) {
    index = (index + dir + keys.length) % keys.length;
    loadPreset(keys[index]);
  }
}

// --- Direct Canvas Interaction & Drag Helpers ---
function getDistanceToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) {
    return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
  }
  let t = ((px - x1) * dx + (py - y1) * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  return Math.sqrt((px - projX) * (px - projX) + (py - projY) * (py - projY));
}

function handleInteractionStart(clientX: number, clientY: number) {

  if (isDragging) return;

  const rect = pc.canvas.getBoundingClientRect();
  const sx = clientX - rect.left;
  const sy = clientY - rect.top;
  const p = pc.toPhysics(sx, sy);

  if (activeConfig.type === 'vector') {
    const { vectors, operation } = activeConfig;
    if (operation === 'cross') {
      const project = (x3d: number, y3d: number, z3d: number) => {
        const scale3d = 40;
        const isoAngle = 30 * (Math.PI / 180);
        return {
          x: pc.originX + (y3d - x3d) * Math.cos(isoAngle) * scale3d,
          y: pc.originY - (z3d - (x3d + y3d) * Math.sin(isoAngle)) * scale3d
        };
      };

      for (const v of vectors) {
        const tip = project(v.x, v.y, v.z || 0);
        const dist = Math.sqrt((sx - tip.x) * (sx - tip.x) + (sy - tip.y) * (sy - tip.y));
        if (dist < 20) {
          isDragging = true;
          dragTarget = v.id;
          isPlaying = false;
          break;
        }
      }
    } else {
      if (vectors.length >= 1) {
        const v1 = vectors[0];
        const distA = Math.sqrt((p.x - v1.x) * (p.x - v1.x) + (p.y - v1.y) * (p.y - v1.y));
        if (distA < 0.4) {
          isDragging = true;
          dragTarget = v1.id;
          isPlaying = false;
          return;
        }
      }
      if (vectors.length >= 2) {
        const v1 = vectors[0];
        const v2 = vectors[1];
        const tx = operation === 'add' ? v1.x + v2.x : v2.x;
        const ty = operation === 'add' ? v1.y + v2.y : v2.y;
        const distB = Math.sqrt((p.x - tx) * (p.x - tx) + (p.y - ty) * (p.y - ty));
        if (distB < 0.4) {
          isDragging = true;
          dragTarget = v2.id;
          isPlaying = false;
          return;
        }
      }
    }
  } else if (activeConfig.type === 'fbd') {
    const { surfaceType, inclineAngle, appliedForce } = activeConfig;
    const vecScale = 0.08;

    let bx = fbdDiagram.x;
    let by = 0.5;
    let angRad = appliedForce.angle * (Math.PI / 180);

    if (surfaceType === 'suspended') {
      bx = 0;
      by = fbdDiagram.x;
      angRad = -Math.PI / 2;
    } else if (surfaceType === 'inclined') {
      const thetaRad = inclineAngle * (Math.PI / 180);
      bx = fbdDiagram.x * Math.cos(thetaRad) - 0.45 * Math.sin(thetaRad);
      by = fbdDiagram.x * Math.sin(thetaRad) + 0.45 * Math.cos(thetaRad);
      angRad = (inclineAngle + appliedForce.angle) * (Math.PI / 180);
    }

    if (appliedForce.magnitude > 0) {
      const tx = bx + appliedForce.magnitude * Math.cos(angRad) * vecScale;
      const ty = by + appliedForce.magnitude * Math.sin(angRad) * vecScale;
      const dist = Math.sqrt((p.x - tx) * (p.x - tx) + (p.y - ty) * (p.y - ty));
      if (dist < 0.4) {
        isDragging = true;
        dragTarget = 'applied-force';
        isPlaying = false;
        return;
      }
    }

    if (surfaceType === 'inclined') {
      const peakX = 6.0;
      const peakY = 6.0 * Math.tan(inclineAngle * Math.PI / 180);
      const dist = Math.sqrt((p.x - peakX) * (p.x - peakX) + (p.y - peakY) * (p.y - peakY));
      if (dist < 0.5) {
        isDragging = true;
        dragTarget = 'incline-angle';
        isPlaying = false;
        return;
      }
    }
  } else if (activeConfig.type === 'shm') {
    const { systemType, length } = activeConfig;
    if (systemType === 'simple-pendulum') {
      const theta = shmDiagram.x;
      const bobX = length * Math.sin(theta);
      const bobY = -length * Math.cos(theta);
      const dist = Math.sqrt((p.x - bobX) * (p.x - bobX) + (p.y - bobY) * (p.y - bobY));
      if (dist < 0.5) {
        isDragging = true;
        dragTarget = 'shm-displacement';
        isPlaying = false;
        return;
      }
    } else if (systemType === 'spring-mass-horizontal') {
      const bx = 2.0 + shmDiagram.x;
      const by = 0.5;
      const dist = Math.sqrt((p.x - bx) * (p.x - bx) + (p.y - by) * (p.y - by));
      if (dist < 0.6) {
        isDragging = true;
        dragTarget = 'shm-displacement';
        isPlaying = false;
        return;
      }
    } else if (systemType === 'spring-mass-vertical') {
      const unstretchedLength = 2.0;
      const stretchEq = (activeConfig.mass * activeConfig.gravity) / activeConfig.springK;
      const eqY = -unstretchedLength - stretchEq;
      const bx = 0;
      const by = eqY + shmDiagram.x;
      const dist = Math.sqrt((p.x - bx) * (p.x - bx) + (p.y - by) * (p.y - by));
      if (dist < 0.6) {
        isDragging = true;
        dragTarget = 'shm-displacement';
        isPlaying = false;
        return;
      }
    }
  } else if (activeConfig.type === 'mechanics') {
    const { mode, projectile } = activeConfig;
    if (mode === 'projectile') {
      const vecScale = 0.15;
      const angleRad = projectile.angle * (Math.PI / 180);
      const tx = -4.0 + projectile.velocity * Math.cos(angleRad) * vecScale;
      const ty = projectile.velocity * Math.sin(angleRad) * vecScale;
      const dist = Math.sqrt((p.x - tx) * (p.x - tx) + (p.y - ty) * (p.y - ty));
      if (dist < 0.4) {
        isDragging = true;
        dragTarget = 'projectile-launcher';
        isPlaying = false;
        return;
      }
    }
  } else if (activeConfig.type === 'fluids') {
    const target = fluidsDiagram.getDragTarget(p);
    if (target) {
      isDragging = true;
      dragTarget = target;
      isPlaying = false;
      return;
    }
  } else if (activeConfig.type === 'em') {
    const { charges } = activeConfig;
    let clickedChargeId: string | null = null;
    for (const c of charges) {
      const dist = Math.sqrt((p.x - c.x) * (p.x - c.x) + (p.y - c.y) * (p.y - c.y));
      if (dist < 0.4) {
        clickedChargeId = c.id;
        break;
      }
    }
    if (clickedChargeId) {
      isDragging = true;
      dragTarget = clickedChargeId;
      selectedChargeId = clickedChargeId;
      isPlaying = false;
      applyConfig(activeConfig);
      return;
    }
    const gunTarget = emDiagram.getGunDragTarget(p);
    if (gunTarget) {
      isDragging = true;
      dragTarget = gunTarget;
      selectedChargeId = null;
      isPlaying = false;
      applyConfig(activeConfig);
      return;
    }
    selectedChargeId = null;
    applyConfig(activeConfig);
  } else if (activeConfig.type === 'circuit') {
    // Perform hit testing on schematic components
    let closestElm: any = null;
    let minDistance = 15; // pixels threshold on screen

    for (const elm of circuitEngine.elements) {
      const p1 = circuitDiagram.toScreen(elm.x, elm.y);
      const p2 = circuitDiagram.toScreen(elm.x2, elm.y2);
      const dist = getDistanceToSegment(sx, sy, p1.x, p1.y, p2.x, p2.y);
      if (dist < minDistance) {
        minDistance = dist;
        closestElm = elm;
      }
    }

    if (closestElm) {
      if (closestElm.type === 'switch') {
        closestElm.toggle();
        const configElm = activeConfig.elements.find(e => e.id === closestElm.id);
        if (configElm) {
          (configElm as any).closed = closestElm.closed;
        }
        circuitEngine.analyzeCircuit();
        codeEditor.value = JSON.stringify(activeConfig, null, 2);
      } else if (['resistor', 'capacitor', 'inductor', 'voltage'].includes(closestElm.type)) {
        circuitDiagram.selectedElementId = closestElm.id;
        renderSliders(activeConfig);
      } else {
        circuitDiagram.selectedElementId = null;
        renderSliders(activeConfig);
      }
      drawActiveSimulation();
      return; // Stop here, don't initiate panning!
    } else {
      circuitDiagram.selectedElementId = null;
      renderSliders(activeConfig);
      drawActiveSimulation();
    }
  }

  // Viewport panning fallback if no interactive element is grabbed
  if (!isDragging) {
    isDragging = true;
    dragTarget = 'pan';
    lastPanX = clientX;
    lastPanY = clientY;
  }
}


function handleInteractionMove(clientX: number, clientY: number) {
  const rect = pc.canvas.getBoundingClientRect();
  const sx = clientX - rect.left;
  const sy = clientY - rect.top;
  const p = pc.toPhysics(sx, sy);

  if (isDragging && dragTarget) {
    pc.canvas.style.cursor = 'grabbing';
    
    if (dragTarget === 'pan') {
      const dx = clientX - lastPanX;
      const dy = clientY - lastPanY;
      pc.panX += dx;
      pc.panY += dy;
      pc.resetOrigin();
      lastPanX = clientX;
      lastPanY = clientY;
    } else if (activeConfig.type === 'vector') {
      const { vectors, operation } = activeConfig;
      if (operation === 'cross') {
        const scale3d = 40;
        const isoAngle = 30 * (Math.PI / 180);
        const dx = (sx - pc.originX) / (scale3d * Math.cos(isoAngle));
        const dy = (pc.originY - sy) / (scale3d * Math.sin(isoAngle));
        const y3d = (dx + dy) / 2;
        const x3d = (dy - dx) / 2;
        
        const target = vectors.find(v => v.id === dragTarget);
        if (target) {
          target.x = Math.max(-5, Math.min(5, x3d));
          target.y = Math.max(-5, Math.min(5, y3d));
        }
      } else {
        if (dragTarget === 'A' && vectors[0]) {
          vectors[0].x = Math.max(-5, Math.min(5, p.x));
          vectors[0].y = Math.max(-5, Math.min(5, p.y));
        } else if (dragTarget === 'B' && vectors[1]) {
          if (operation === 'add' && vectors[0]) {
            vectors[1].x = Math.max(-5, Math.min(5, p.x - vectors[0].x));
            vectors[1].y = Math.max(-5, Math.min(5, p.y - vectors[0].y));
          } else {
            vectors[1].x = Math.max(-5, Math.min(5, p.x));
            vectors[1].y = Math.max(-5, Math.min(5, p.y));
          }
        }
      }
      applyConfig(activeConfig);
    } else if (activeConfig.type === 'fbd') {
      const { surfaceType, inclineAngle, appliedForce } = activeConfig;
      
      let bx = fbdDiagram.x;
      let by = 0.5;
      if (surfaceType === 'suspended') {
        bx = 0;
        by = fbdDiagram.x;
      } else if (surfaceType === 'inclined') {
        const thetaRad = inclineAngle * (Math.PI / 180);
        bx = fbdDiagram.x * Math.cos(thetaRad) - 0.45 * Math.sin(thetaRad);
        by = fbdDiagram.x * Math.sin(thetaRad) + 0.45 * Math.cos(thetaRad);
      }

      if (dragTarget === 'applied-force') {
        const vecScale = 0.08;
        let dx = p.x - bx;
        let dy = p.y - by;
        
        let forceVal = Math.sqrt(dx * dx + dy * dy) / vecScale;
        let angleVal = Math.atan2(dy, dx) * (180 / Math.PI);
        
        if (surfaceType === 'inclined') {
          angleVal -= inclineAngle;
        }
        
        angleVal = (angleVal + 360) % 360;
        if (angleVal > 180) angleVal -= 360;

        appliedForce.magnitude = Math.max(0, Math.min(80, forceVal));
        appliedForce.angle = Math.max(-90, Math.min(90, angleVal));
        applyConfig(activeConfig);
      } else if (dragTarget === 'incline-angle') {
        let angleVal = Math.atan2(p.y, 6.0) * (180 / Math.PI);
        activeConfig.inclineAngle = Math.max(5, Math.min(75, angleVal));
        applyConfig(activeConfig);
      }
    } else if (activeConfig.type === 'shm') {
      const { systemType } = activeConfig;
      if (dragTarget === 'shm-displacement') {
        if (systemType === 'simple-pendulum') {
          let angleVal = Math.atan2(p.x, -p.y) * (180 / Math.PI);
          activeConfig.initialDisplacement = Math.max(-80, Math.min(80, angleVal));
        } else if (systemType === 'spring-mass-horizontal') {
          activeConfig.initialDisplacement = Math.max(-2, Math.min(3, p.x - 2.0));
        } else if (systemType === 'spring-mass-vertical') {
          const unstretchedLength = 2.0;
          const stretchEq = (activeConfig.mass * activeConfig.gravity) / activeConfig.springK;
          const eqY = -unstretchedLength - stretchEq;
          activeConfig.initialDisplacement = Math.max(-2, Math.min(2, p.y - eqY));
        }
        applyConfig(activeConfig);
      }
    } else if (activeConfig.type === 'mechanics' && activeConfig.mode === 'projectile') {
      if (dragTarget === 'projectile-launcher') {
        const vecScale = 0.15;
        const dx = p.x - (-4.0);
        const dy = p.y - 0;
        
        let speedVal = Math.sqrt(dx * dx + dy * dy) / vecScale;
        let angleVal = Math.atan2(dy, dx) * (180 / Math.PI);
        
        activeConfig.projectile.velocity = Math.max(5, Math.min(30, speedVal));
        activeConfig.projectile.angle = Math.max(15, Math.min(85, angleVal));
        applyConfig(activeConfig);
      }
    } else if (activeConfig.type === 'fluids' && dragTarget) {
    const target = dragTarget as 'block' | 'probe' | 'piston1' | 'piston2' | 'sphere';
    fluidsDiagram.updateDrag(target, p);
    if (activeConfig.mode === 'pascal') {
      activeConfig.pascal.displacement1 = fluidsDiagram.pistonOffset;
    }
    applyConfig(activeConfig);
  } else if (activeConfig.type === 'em') {
    const { charges } = activeConfig;
    const target = charges.find(c => c.id === dragTarget);
    if (target) {
      target.x = Math.max(-8, Math.min(8, p.x));
      target.y = Math.max(-6, Math.min(6, p.y));
      applyConfig(activeConfig);
    } else if (dragTarget === 'gun-base') {
      activeConfig.gunX = Math.max(-8, Math.min(8, p.x));
      activeConfig.gunY = Math.max(-6, Math.min(6, p.y));
      applyConfig(activeConfig);
    } else if (dragTarget === 'gun-barrel') {
      const dx = p.x - activeConfig.gunX;
      const dy = p.y - activeConfig.gunY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      let angleVal = Math.atan2(dy, dx) * (180 / Math.PI);
      angleVal = (angleVal + 360) % 360;
      
      let speedVal = dist / 0.10;
      activeConfig.gunSpeed = Math.max(5, Math.min(30, speedVal));
      activeConfig.gunAngle = angleVal;
      applyConfig(activeConfig);
    }
  }
} else {
    let hover = false;
    if (activeConfig.type === 'vector') {
      const { vectors, operation } = activeConfig;
      if (operation === 'cross') {
        const project = (x3d: number, y3d: number, z3d: number) => {
          const scale3d = 40;
          const isoAngle = 30 * (Math.PI / 180);
          return {
            x: pc.originX + (y3d - x3d) * Math.cos(isoAngle) * scale3d,
            y: pc.originY - (z3d - (x3d + y3d) * Math.sin(isoAngle)) * scale3d
          };
        };
        for (const v of vectors) {
          const tip = project(v.x, v.y, v.z || 0);
          const dist = Math.sqrt((sx - tip.x) * (sx - tip.x) + (sy - tip.y) * (sy - tip.y));
          if (dist < 20) hover = true;
        }
      } else {
        if (vectors[0]) {
          const distA = Math.sqrt((p.x - vectors[0].x) * (p.x - vectors[0].x) + (p.y - vectors[0].y) * (p.y - vectors[0].y));
          if (distA < 0.4) hover = true;
        }
        if (vectors[1]) {
          const tx = operation === 'add' ? vectors[0].x + vectors[1].x : vectors[1].x;
          const ty = operation === 'add' ? vectors[0].y + vectors[1].y : vectors[1].y;
          const distB = Math.sqrt((p.x - tx) * (p.x - tx) + (p.y - ty) * (p.y - ty));
          if (distB < 0.4) hover = true;
        }
      }
    } else if (activeConfig.type === 'fbd') {
      const { surfaceType, inclineAngle, appliedForce } = activeConfig;
      let bx = fbdDiagram.x;
      let by = 0.5;
      let angRad = appliedForce.angle * (Math.PI / 180);
      if (surfaceType === 'suspended') {
        bx = 0;
        by = fbdDiagram.x;
        angRad = -Math.PI / 2;
      } else if (surfaceType === 'inclined') {
        const thetaRad = inclineAngle * (Math.PI / 180);
        bx = fbdDiagram.x * Math.cos(thetaRad) - 0.45 * Math.sin(thetaRad);
        by = fbdDiagram.x * Math.sin(thetaRad) + 0.45 * Math.cos(thetaRad);
        angRad = (inclineAngle + appliedForce.angle) * (Math.PI / 180);
      }
      if (appliedForce.magnitude > 0) {
        const tx = bx + appliedForce.magnitude * Math.cos(angRad) * 0.08;
        const ty = by + appliedForce.magnitude * Math.sin(angRad) * 0.08;
        const dist = Math.sqrt((p.x - tx) * (p.x - tx) + (p.y - ty) * (p.y - ty));
        if (dist < 0.4) hover = true;
      }
      if (surfaceType === 'inclined') {
        const peakX = 6.0;
        const peakY = 6.0 * Math.tan(inclineAngle * Math.PI / 180);
        const dist = Math.sqrt((p.x - peakX) * (p.x - peakX) + (p.y - peakY) * (p.y - peakY));
        if (dist < 0.5) hover = true;
      }
    } else if (activeConfig.type === 'shm') {
      const { systemType, length } = activeConfig;
      if (systemType === 'simple-pendulum') {
        const bobX = length * Math.sin(shmDiagram.x);
        const bobY = -length * Math.cos(shmDiagram.x);
        const dist = Math.sqrt((p.x - bobX) * (p.x - bobX) + (p.y - bobY) * (p.y - bobY));
        if (dist < 0.5) hover = true;
      } else if (systemType === 'spring-mass-horizontal') {
        const bx = 2.0 + shmDiagram.x;
        const by = 0.5;
        const dist = Math.sqrt((p.x - bx) * (p.x - bx) + (p.y - by) * (p.y - by));
        if (dist < 0.6) hover = true;
      } else if (systemType === 'spring-mass-vertical') {
        const unstretchedLength = 2.0;
        const stretchEq = (activeConfig.mass * activeConfig.gravity) / activeConfig.springK;
        const eqY = -unstretchedLength - stretchEq;
        const by = eqY + shmDiagram.x;
        const dist = Math.sqrt((p.x - 0) * (p.x - 0) + (p.y - by) * (p.y - by));
        if (dist < 0.6) hover = true;
      }
    } else if (activeConfig.type === 'mechanics' && activeConfig.mode === 'projectile') {
      const angleRad = activeConfig.projectile.angle * (Math.PI / 180);
      const tx = -4.0 + activeConfig.projectile.velocity * Math.cos(angleRad) * 0.15;
      const ty = activeConfig.projectile.velocity * Math.sin(angleRad) * 0.15;
      const dist = Math.sqrt((p.x - tx) * (p.x - tx) + (p.y - ty) * (p.y - ty));
      if (dist < 0.4) hover = true;
    } else if (activeConfig.type === 'fluids') {
      if (fluidsDiagram.getDragTarget(p)) hover = true;
    } else if (activeConfig.type === 'em') {
      const { charges } = activeConfig;
      for (const c of charges) {
        const dist = Math.sqrt((p.x - c.x) * (p.x - c.x) + (p.y - c.y) * (p.y - c.y));
        if (dist < 0.4) {
          hover = true;
          break;
        }
      }
      if (emDiagram.getGunDragTarget(p)) {
        hover = true;
      }
    }
    pc.canvas.style.cursor = hover ? 'grab' : 'default';
  }
}

function handleInteractionEnd() {
  if (isDragging) {
    isDragging = false;
    dragTarget = null;
    pc.canvas.style.cursor = 'grab';
  }
}

// --- Load Preset Config ---
function loadPreset(name: string) {
  const baseConfig = PRESETS[name];
  if (!baseConfig) return;

  // Clone config
  activeConfig = JSON.parse(JSON.stringify(baseConfig));

  // Sync Select inputs
  selectPreset.value = name;

  if (circuitDiagram) {
    circuitDiagram.selectedElementId = null;
  }

  // Reset viewport panning
  if (pc) {
    pc.panX = 0;
    pc.panY = 0;
    pc.resetOrigin();
  }

  applyConfig(activeConfig);
}


// --- Apply Config to Active Diagrams ---
function applyConfig(config: PhysicsConfig) {
  // Sync text editor
  codeEditor.value = JSON.stringify(config, null, 2);
  codeEditor.classList.remove('error-highlight');

  // Title displays
  updateTitles(config);

  // Setup active diagram module
  if (config.type === 'fbd') {
    fbdDiagram.setConfig(config);
    graphCard.classList.remove('hidden');
    selectGraphMode.classList.add('hidden');
    graphTitle.innerText = 'Real-Time Graph: POSITION / VELOCITY / ACCELERATION';
  } else if (config.type === 'vector') {
    vectorDiagram.setConfig(config);
    graphCard.classList.add('hidden');
    selectGraphMode.classList.add('hidden');
  } else if (config.type === 'shm') {
    shmDiagram.setConfig(config);
    graphCard.classList.remove('hidden');
    selectGraphMode.classList.remove('hidden');
    
    // Choose correct default graph mode
    if (config.showPhaseSpace) {
      graphModule.mode = 'phase-space';
      selectGraphMode.value = 'phase-space';
    } else if (config.showEnergyGraph) {
      graphModule.mode = 'energy';
      selectGraphMode.value = 'energy';
    } else {
      graphModule.mode = 'kinematics';
      selectGraphMode.value = 'kinematics';
    }
  } else if (config.type === 'wave') {
    waveDiagram.setConfig(config);
    graphCard.classList.add('hidden');
    selectGraphMode.classList.add('hidden');
  } else if (config.type === 'mechanics') {
    mechanicsDiagram.setConfig(config);
    graphCard.classList.add('hidden');
    selectGraphMode.classList.add('hidden');
  } else if (config.type === 'fluids') {
    fluidsDiagram.setConfig(config);
    graphCard.classList.remove('hidden');
    selectGraphMode.classList.add('hidden');
    if (config.mode === 'buoyancy') {
      graphTitle.innerText = 'Real-Time Graph: DEPTH PRESSURE / BLOCK DISPLACEMENT';
    } else if (config.mode === 'pascal') {
      graphTitle.innerText = 'Real-Time Graph: PISTON DISPLACEMENTS / PRESSURE';
    } else if (config.mode === 'bernoulli') {
      graphTitle.innerText = 'Real-Time Graph: VELOCITY & PRESSURE DROP';
    } else if (config.mode === 'viscosity') {
      graphTitle.innerText = 'Real-Time Graph: POSITION & VELOCITY CONVERGENCE';
    }
  } else if (config.type === 'gravity') {
    gravityDiagram.setConfig(config);
    graphCard.classList.remove('hidden');
    selectGraphMode.classList.add('hidden');
    graphModule.mode = 'energy';
    graphTitle.innerText = 'Real-Time Graph: ENERGY CONSERVATION';
  } else if (config.type === 'thermo') {
    thermoDiagram.setConfig(config);
    graphCard.classList.remove('hidden');
    if (config.mode === 'kinetic-theory') {
      selectGraphMode.classList.add('hidden');
      graphTitle.innerText = 'Real-Time Graph: PARTICLE SPEED DISTRIBUTION (RAYLEIGH)';
    } else if (config.mode === 'piston-engine') {
      selectGraphMode.classList.remove('hidden');
      graphModule.mode = 'pv-diagram';
      selectGraphMode.value = 'pv-diagram';
      graphTitle.innerText = 'Real-Time Graph: PRESSURE-VOLUME (P-V) DIAGRAM';
    } else if (config.mode === 'diffusion') {
      selectGraphMode.classList.add('hidden');
      graphTitle.innerText = 'Real-Time Graph: SHANNON MIXING ENTROPY';
    }
  } else if (config.type === 'em') {
    emDiagram.setConfig(config);
    graphCard.classList.remove('hidden');
    selectGraphMode.classList.remove('hidden');
    graphModule.mode = 'kinematics';
    selectGraphMode.value = 'kinematics';
  } else if (config.type === 'circuit') {
    deserializeCircuit(circuitEngine, JSON.stringify({ elements: config.elements }));
    circuitEngine.reset();
    circuitHistory = [];
    lastCircuitSwitchToggleTime = 0;
    
    graphCard.classList.remove('hidden');
    selectGraphMode.classList.add('hidden');
    graphTitle.innerText = 'Real-Time Graph: CIRCUIT NODE VOLTAGES';
  }

  // Generate controls UI
  renderSliders(config);
}

// --- Update UI Titles ---
function updateTitles(config: PhysicsConfig) {
  if (config.type === 'fbd') {
    canvasTitle.innerText = `Free Body Diagram: ${config.surfaceType.toUpperCase()}`;
  } else if (config.type === 'vector') {
    canvasTitle.innerText = `Vector Math Visualizer: ${config.operation.toUpperCase()}`;
  } else if (config.type === 'shm') {
    canvasTitle.innerText = `Simple Harmonic Motion: ${config.systemType.replace(/-/g, ' ').toUpperCase()}`;
    graphTitle.innerText = `Real-Time Graph: ${graphModule.mode.replace(/-/g, ' ').toUpperCase()}`;
  } else if (config.type === 'wave') {
    canvasTitle.innerText = `Wave Dynamics Simulator: ${config.waveType.toUpperCase()}`;
  } else if (config.type === 'mechanics') {
    canvasTitle.innerText = `Classical Mechanics: ${config.mode.toUpperCase()}`;
  } else if (config.type === 'fluids') {
    canvasTitle.innerText = `Fluid Mechanics: ${config.mode.toUpperCase()}`;
  } else if (config.type === 'gravity') {
    canvasTitle.innerText = `Gravitation & Orbital Mechanics: ${config.mode.toUpperCase()}`;
  } else if (config.type === 'thermo') {
    canvasTitle.innerText = `Thermodynamics & Kinetic Theory: ${config.mode.replace(/-/g, ' ').toUpperCase()}`;
    if (config.mode === 'piston-engine') {
      graphTitle.innerText = `Real-Time Graph: ${graphModule.mode === 'pv-diagram' ? 'PRESSURE-VOLUME (P-V) DIAGRAM' : 'TEMPERATURE-ENTROPY (T-S) DIAGRAM'}`;
    }
  } else if (config.type === 'em') {
    canvasTitle.innerText = 'Lorentz Force & Magnetic Deflections';
    graphTitle.innerText = `Real-Time Graph: ${graphModule.mode.replace(/-/g, ' ').toUpperCase()}`;
  } else if (config.type === 'circuit') {
    canvasTitle.innerText = 'Circuits Engine: Transient Solver';
    graphTitle.innerText = 'Real-Time Graph: CIRCUIT NODE VOLTAGES';
  }
}

// --- Build Dynamic Slider Parameters UI ---
function renderSliders(config: PhysicsConfig) {
  dynamicSliders.innerHTML = '';

  const addSlider = (
    labelName: string,
    min: number,
    max: number,
    step: number,
    value: number,
    onInput: (val: number) => void
  ) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'slider-wrapper';

    const info = document.createElement('div');
    info.className = 'slider-info';
    info.innerHTML = `<span>${labelName}</span><span class="value">${value.toFixed(2).replace('.00', '')}</span>`;

    const input = document.createElement('input');
    input.type = 'range';
    input.min = min.toString();
    input.max = max.toString();
    input.step = step.toString();
    input.value = value.toString();

    input.addEventListener('input', () => {
      const val = parseFloat(input.value);
      info.querySelector('.value')!.textContent = val.toFixed(2).replace('.00', '');
      onInput(val);

      // update code editor content
      codeEditor.value = JSON.stringify(activeConfig, null, 2);
    });

    wrapper.appendChild(info);
    wrapper.appendChild(input);
    dynamicSliders.appendChild(wrapper);
  };

  // Build controls custom to each type
  if (config.type === 'fbd') {
    if (config.surfaceType === 'inclined') {
      addSlider('Incline Angle (°)', 5, 75, 1, config.inclineAngle, (v) => {
        config.inclineAngle = v;
        fbdDiagram.setConfig(config);
      });
    }
    addSlider('Block Mass (kg)', 1, 25, 0.5, config.blockMass, (v) => {
      config.blockMass = v;
      fbdDiagram.setConfig(config);
    });
    if (config.surfaceType !== 'suspended') {
      addSlider('Friction Coefficient (μ)', 0, 1, 0.05, config.mu, (v) => {
        config.mu = v;
        fbdDiagram.setConfig(config);
      });
    }
    addSlider('Applied Force (N)', 0, 80, 1, config.appliedForce.magnitude, (v) => {
      config.appliedForce.magnitude = v;
      fbdDiagram.setConfig(config);
    });
    if (config.surfaceType !== 'suspended') {
      addSlider('Force Angle (°)', -60, 60, 5, config.appliedForce.angle, (v) => {
        config.appliedForce.angle = v;
        fbdDiagram.setConfig(config);
      });
    }

  } else if (config.type === 'vector') {
    if (config.vectors.length > 0) {
      addSlider('Vector A length X', -6, 6, 0.5, config.vectors[0].x, (v) => {
        config.vectors[0].x = v;
        vectorDiagram.setConfig(config);
      });
      addSlider('Vector A length Y', -6, 6, 0.5, config.vectors[0].y, (v) => {
        config.vectors[0].y = v;
        vectorDiagram.setConfig(config);
      });
    }
    if (config.vectors.length > 1) {
      addSlider('Vector B length X', -6, 6, 0.5, config.vectors[1].x, (v) => {
        config.vectors[1].x = v;
        vectorDiagram.setConfig(config);
      });
      addSlider('Vector B length Y', -6, 6, 0.5, config.vectors[1].y, (v) => {
        config.vectors[1].y = v;
        vectorDiagram.setConfig(config);
      });
    }

  } else if (config.type === 'shm') {
    addSlider('Mass (kg)', 0.5, 10, 0.5, config.mass, (v) => {
      config.mass = v;
      shmDiagram.setConfig(config);
    });
    if (config.systemType !== 'simple-pendulum') {
      addSlider('Spring Constant k (N/m)', 5, 50, 1, config.springK, (v) => {
        config.springK = v;
        shmDiagram.setConfig(config);
      });
    } else {
      addSlider('Pendulum Length L (m)', 1, 5, 0.2, config.length, (v) => {
        config.length = v;
        shmDiagram.setConfig(config);
      });
    }
    addSlider('Damping Factor b', 0, 1.5, 0.05, config.damping, (v) => {
      config.damping = v;
      shmDiagram.setConfig(config);
    });
    addSlider('Driving Amplitude (N)', 0, 10, 0.5, config.drivingForce, (v) => {
      config.drivingForce = v;
      shmDiagram.setConfig(config);
    });
    addSlider('Integrator (0=Euler, 1=RK4)', 0, 1, 1, config.integrator === 'rk4' ? 1 : 0, (v) => {
      config.integrator = (v === 1) ? 'rk4' : 'euler';
      shmDiagram.setConfig(config);
    });

  } else if (config.type === 'wave') {
    if (config.waveType !== 'superposition') {
      addSlider('Amplitude', 0.5, 2.5, 0.1, config.amplitude, (v) => {
        config.amplitude = v;
        waveDiagram.setConfig(config);
      });
      addSlider('Frequency (Hz)', 0.2, 2.0, 0.1, config.frequency, (v) => {
        config.frequency = v;
        waveDiagram.setConfig(config);
      });
      addSlider('Wavelength (m)', 1.5, 5.0, 0.1, config.wavelength, (v) => {
        config.wavelength = v;
        waveDiagram.setConfig(config);
      });
    } else {
      addSlider('Pulse A Amplitude', -2.5, 2.5, 0.2, config.superposition.pulseA.amplitude, (v) => {
        config.superposition.pulseA.amplitude = v;
        waveDiagram.setConfig(config);
      });
      addSlider('Pulse B Amplitude', -2.5, 2.5, 0.2, config.superposition.pulseB.amplitude, (v) => {
        config.superposition.pulseB.amplitude = v;
        waveDiagram.setConfig(config);
      });
      addSlider('Pulses Width', 0.2, 1.0, 0.05, config.superposition.pulseA.width, (v) => {
        config.superposition.pulseA.width = v;
        config.superposition.pulseB.width = v;
        waveDiagram.setConfig(config);
      });
    }

  } else if (config.type === 'mechanics') {
    if (config.mode === 'projectile') {
      addSlider('Launch Velocity (m/s)', 5, 30, 1, config.projectile.velocity, (v) => {
        config.projectile.velocity = v;
        mechanicsDiagram.setConfig(config);
      });
      addSlider('Launch Angle (°)', 15, 85, 5, config.projectile.angle, (v) => {
        config.projectile.angle = v;
        mechanicsDiagram.setConfig(config);
      });
      addSlider('Air Drag Coefficient', 0, 0.2, 0.01, config.projectile.dragCoeff, (v) => {
        config.projectile.dragCoeff = v;
        mechanicsDiagram.setConfig(config);
      });
    } else if (config.mode === 'pulley') {
      addSlider('Mass A (left/incline)', 1, 10, 0.5, config.pulley.massA, (v) => {
        config.pulley.massA = v;
        mechanicsDiagram.setConfig(config);
      });
      addSlider('Mass B (right hanging)', 1, 10, 0.5, config.pulley.massB, (v) => {
        config.pulley.massB = v;
        mechanicsDiagram.setConfig(config);
      });
      if (config.pulley.type === 'inclined') {
        addSlider('Friction Coefficient (μ)', 0, 0.8, 0.05, config.pulley.mu, (v) => {
          config.pulley.mu = v;
          mechanicsDiagram.setConfig(config);
        });
      }
    } else if (config.mode === 'circular' && config.circular) {
      const circ = config.circular;
      addSlider('Circle Radius (m)', 1.0, 3.5, 0.1, circ.radius, (v) => {
        circ.radius = v;
        mechanicsDiagram.setConfig(config);
      });
      addSlider('Bob Speed (m/s)', 1.0, 12.0, 0.2, circ.speed, (v) => {
        circ.speed = v;
        mechanicsDiagram.setConfig(config);
      });
      addSlider('Bob Mass (kg)', 0.5, 10.0, 0.1, circ.mass, (v) => {
        circ.mass = v;
        mechanicsDiagram.setConfig(config);
      });
      addSlider('Vertical Loop (0=No, 1=Yes)', 0, 1, 1, circ.isVertical ? 1 : 0, (v) => {
        circ.isVertical = (v === 1);
        mechanicsDiagram.setConfig(config);
      });
    }
  } else if (config.type === 'fluids') {
    if (config.mode === 'buoyancy') {
      addSlider('Fluid Density (kg/m³)', 500, 1500, 50, config.buoyancy.fluidDensity, (v) => {
        config.buoyancy.fluidDensity = v;
        fluidsDiagram.setConfig(config);
      });
      addSlider('Block Mass (kg)', 0.5, 15.0, 0.1, config.buoyancy.blockMass, (v) => {
        config.buoyancy.blockMass = v;
        fluidsDiagram.setConfig(config);
      });
      addSlider('Block Volume (m³)', 0.001, 0.015, 0.0005, config.buoyancy.blockVolume, (v) => {
        config.buoyancy.blockVolume = v;
        fluidsDiagram.setConfig(config);
      });
    } else if (config.mode === 'pascal') {
      addSlider('Piston 1 Area (m²)', 0.5, 2.0, 0.1, config.pascal.area1, (v) => {
        config.pascal.area1 = v;
        fluidsDiagram.setConfig(config);
      });
      addSlider('Piston 2 Area (m²)', 2.0, 6.0, 0.2, config.pascal.area2, (v) => {
        config.pascal.area2 = v;
        fluidsDiagram.setConfig(config);
      });
      addSlider('Input Force F1 (N)', 0, 50, 1, config.pascal.force1, (v) => {
        config.pascal.force1 = v;
        fluidsDiagram.setConfig(config);
      });
    } else if (config.mode === 'bernoulli') {
      addSlider('Fluid Density (kg/m³)', 500, 1500, 50, config.bernoulli.fluidDensity, (v) => {
        config.bernoulli.fluidDensity = v;
        fluidsDiagram.setConfig(config);
      });
      addSlider('Volume Flow Rate (m³/s)', 0.005, 0.030, 0.001, config.bernoulli.flowRate, (v) => {
        config.bernoulli.flowRate = v;
        fluidsDiagram.setConfig(config);
      });
      addSlider('Inlet Diameter D1 (m)', 0.8, 1.8, 0.1, config.bernoulli.diameter1, (v) => {
        config.bernoulli.diameter1 = v;
        fluidsDiagram.setConfig(config);
      });
      addSlider('Throat Diameter D2 (m)', 0.3, 0.7, 0.05, config.bernoulli.diameter2, (v) => {
        config.bernoulli.diameter2 = v;
        fluidsDiagram.setConfig(config);
      });
    } else if (config.mode === 'viscosity') {
      addSlider('Fluid Density (kg/m³)', 500, 1500, 50, config.viscosity.fluidDensity, (v) => {
        config.viscosity.fluidDensity = v;
        fluidsDiagram.setConfig(config);
      });
      addSlider('Viscosity (Pa·s)', 0.05, 1.0, 0.05, config.viscosity.viscosity, (v) => {
        config.viscosity.viscosity = v;
        fluidsDiagram.setConfig(config);
      });
      addSlider('Sphere Radius (m)', 0.03, 0.15, 0.01, config.viscosity.sphereRadius, (v) => {
        config.viscosity.sphereRadius = v;
        fluidsDiagram.setConfig(config);
      });
      addSlider('Sphere Density (kg/m³)', 1200, 4000, 100, config.viscosity.sphereDensity, (v) => {
        config.viscosity.sphereDensity = v;
        fluidsDiagram.setConfig(config);
      });
    }
  } else if (config.type === 'gravity') {
    if (config.mode === 'kepler' && config.kepler) {
      const kep = config.kepler;
      addSlider('Orbit Eccentricity (e)', 0.0, 0.8, 0.05, kep.eccentricity, (v) => {
        kep.eccentricity = v;
        gravityDiagram.setConfig(config);
      });
      addSlider('Semi-Major Axis a (m)', 1.0, 4.0, 0.1, kep.semiMajorAxis, (v) => {
        kep.semiMajorAxis = v;
        gravityDiagram.setConfig(config);
      });
      addSlider('Simulation Speed', 0.2, 5.0, 0.1, kep.simulationSpeed, (v) => {
        kep.simulationSpeed = v;
        gravityDiagram.setConfig(config);
      });
      addSlider('Show Sector Sweeps (0=No, 1=Yes)', 0, 1, 1, kep.showSectors ? 1 : 0, (v) => {
        kep.showSectors = (v === 1);
        gravityDiagram.setConfig(config);
      });
    } else if (config.mode === 'twobody' && config.twobody) {
      const tb = config.twobody;
      addSlider('Mass Ratio (m2/m1)', 0.05, 5.0, 0.05, tb.massRatio, (v) => {
        tb.massRatio = v;
        gravityDiagram.setConfig(config);
      });
      addSlider('Initial Distance', 1.0, 5.0, 0.1, tb.initialDistance, (v) => {
        tb.initialDistance = v;
        gravityDiagram.setConfig(config);
      });
      addSlider('Initial Velocity', 0.2, 4.0, 0.1, tb.initialVelocity, (v) => {
        tb.initialVelocity = v;
        gravityDiagram.setConfig(config);
      });
    } else if (config.mode === 'escape' && config.escape) {
      const esc = config.escape;
      addSlider('Launch Speed (v₀)', 0.5, 8.0, 0.1, esc.launchVelocity, (v) => {
        esc.launchVelocity = v;
        gravityDiagram.setConfig(config);
      });
      addSlider('Launch Altitude (r₀)', 0.8, 4.0, 0.1, esc.launchAltitude, (v) => {
        esc.launchAltitude = v;
        gravityDiagram.setConfig(config);
      });
      addSlider('Launch Angle (θ°)', 0, 180, 5, esc.launchAngle, (v) => {
        esc.launchAngle = v;
        gravityDiagram.setConfig(config);
      });
      addSlider('Planet Mass (Mₚ)', 1.0, 50.0, 1.0, esc.planetMass, (v) => {
        esc.planetMass = v;
        gravityDiagram.setConfig(config);
      });
      addSlider('Planet Radius (Rₚ)', 0.3, 2.0, 0.1, esc.planetRadius, (v) => {
        esc.planetRadius = v;
        gravityDiagram.setConfig(config);
      });
    }
  } else if (config.type === 'thermo') {
    if (config.mode === 'kinetic-theory') {
      addSlider('Temperature T', 0.5, 10.0, 0.1, config.temperature, (v) => {
        config.temperature = v;
      });
      addSlider('Particle Count N', 10, 150, 5, config.particleCount, (v) => {
        config.particleCount = v;
        thermoDiagram.setConfig(config);
      });
      addSlider('Volume V', 1.0, 5.0, 0.1, config.volume, (v) => {
        config.volume = v;
      });
    } else if (config.mode === 'piston-engine') {
      addSlider('Volume V', 1.0, 5.0, 0.1, config.volume, (v) => {
        config.volume = v;
      });
      const modes: ('none' | 'isothermal' | 'isobaric' | 'isochoric' | 'adiabatic')[] = ['none', 'isothermal', 'isobaric', 'isochoric', 'adiabatic'];
      const currentModeIdx = modes.indexOf(thermoDiagram.activeProcess);
      addSlider('Process (0=None,1=Isotherm,2=Isobar,3=Isochor,4=Adiabat)', 0, 4, 1, currentModeIdx >= 0 ? currentModeIdx : 0, (v) => {
        const mode = modes[Math.round(v)];
        thermoDiagram.activeProcess = mode;
        thermoDiagram.captureReferenceState();
      });
      const heatModes: ('none' | 'heating' | 'cooling')[] = ['none', 'heating', 'cooling'];
      const currentHeatIdx = heatModes.indexOf(thermoDiagram.heatTransfer);
      addSlider('Heat (0=None, 1=Heating, 2=Cooling)', 0, 2, 1, currentHeatIdx >= 0 ? currentHeatIdx : 0, (v) => {
        const hMode = heatModes[Math.round(v)];
        thermoDiagram.heatTransfer = hMode;
      });
      addSlider('Carnot Cycle (0=Off, 1=On)', 0, 1, 1, config.autoCycle ? 1 : 0, (v) => {
        const auto = (v === 1);
        config.autoCycle = auto;
        thermoDiagram.autoCycle = auto;
        if (auto) {
          thermoDiagram.cycleStage = 0;
          thermoDiagram.stageTimer = 0;
          thermoDiagram.captureReferenceState();
        }
        renderSliders(config);
      });
      if (config.autoCycle) {
        addSlider('Cycle Step Duration (s)', 1.0, 6.0, 0.5, thermoDiagram.stageDuration, (v) => {
          thermoDiagram.stageDuration = v;
        });
      }
      addSlider('Temperature T', 0.5, 10.0, 0.1, config.temperature, (v) => {
        config.temperature = v;
      });
      addSlider('Particle Count N', 10, 150, 5, config.particleCount, (v) => {
        config.particleCount = v;
        thermoDiagram.setConfig(config);
      });
    } else if (config.mode === 'diffusion') {
      addSlider('Barrier (0=Closed, 1=Open)', 0, 1, 1, thermoDiagram.barrierClosed ? 0 : 1, (v) => {
        if (v === 1) {
          thermoDiagram.openBarrier();
        } else {
          thermoDiagram.closeBarrier();
        }
      });
      addSlider('Temperature T', 0.5, 10.0, 0.1, config.temperature, (v) => {
        config.temperature = v;
      });
      addSlider('Particle Count N', 10, 150, 5, config.particleCount, (v) => {
        config.particleCount = v;
        thermoDiagram.setConfig(config);
      });
    }
  } else if (config.type === 'em') {
    // 1. Add Positive / Negative Buttons
    const btnContainer = document.createElement('div');
    btnContainer.style.display = 'flex';
    btnContainer.style.gap = '8px';
    btnContainer.style.marginBottom = '16px';

    const addPosBtn = document.createElement('button');
    addPosBtn.className = 'btn btn-primary';
    addPosBtn.style.flex = '1';
    addPosBtn.innerText = 'Add Positive (+q)';
    addPosBtn.addEventListener('click', () => {
      const newId = 'q_' + Date.now();
      config.charges.push({ id: newId, x: 0, y: 0, q: 2.0 });
      selectedChargeId = newId;
      applyConfig(config);
    });

    const addNegBtn = document.createElement('button');
    addNegBtn.className = 'btn';
    addNegBtn.style.flex = '1';
    addNegBtn.innerText = 'Add Negative (-q)';
    addNegBtn.addEventListener('click', () => {
      const newId = 'q_' + Date.now();
      config.charges.push({ id: newId, x: 0, y: 0, q: -2.0 });
      selectedChargeId = newId;
      applyConfig(config);
    });

    btnContainer.appendChild(addPosBtn);
    btnContainer.appendChild(addNegBtn);
    dynamicSliders.appendChild(btnContainer);

    // 2. Empty state if no charges
    if (config.charges.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.style.textAlign = 'center';
      emptyState.style.padding = '16px';
      emptyState.style.border = '1px dashed #3f3f46';
      emptyState.style.borderRadius = '6px';
      emptyState.style.marginTop = '16px';

      const heading = document.createElement('h4');
      heading.innerText = 'Sandbox is Empty';
      heading.style.margin = '0 0 8px 0';
      heading.style.color = '#fff';

      const body = document.createElement('p');
      body.innerText = 'Add a point charge from the sidebar to begin rendering electric fields and potentials.';
      body.style.margin = '0';
      body.style.fontSize = '12px';
      body.style.color = '#a1a1aa';

      emptyState.appendChild(heading);
      emptyState.appendChild(body);
      dynamicSliders.appendChild(emptyState);
    }

    // 3. Selection details and controls
    if (selectedChargeId) {
      const charge = config.charges.find(c => c.id === selectedChargeId);
      if (charge) {
        const posInfo = document.createElement('div');
        posInfo.style.fontSize = '13px';
        posInfo.style.marginBottom = '12px';
        posInfo.style.color = '#a1a1aa';
        posInfo.innerHTML = `<span>Selected Charge: </span><strong>${charge.id}</strong><br/><span>Position: </span><strong>(${charge.x.toFixed(2)}m, ${charge.y.toFixed(2)}m)</strong>`;
        dynamicSliders.appendChild(posInfo);

        addSlider('Charge Magnitude (nC)', -10, 10, 1, charge.q, (v) => {
          charge.q = v;
          applyConfig(config);
        });

        addSlider('Position X (m)', -8, 8, 0.1, charge.x, (v) => {
          charge.x = v;
          applyConfig(config);
        });

        addSlider('Position Y (m)', -6, 6, 0.1, charge.y, (v) => {
          charge.y = v;
          applyConfig(config);
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn';
        deleteBtn.style.backgroundColor = '#ef4444';
        deleteBtn.style.color = '#ffffff';
        deleteBtn.style.width = '100%';
        deleteBtn.style.marginTop = '16px';
        deleteBtn.innerText = 'Delete Charge';
        deleteBtn.setAttribute('aria-label', 'Delete Charge: Remove the selected charge from the canvas');
        deleteBtn.addEventListener('click', () => {
          config.charges = config.charges.filter(c => c.id !== selectedChargeId);
          selectedChargeId = null;
          applyConfig(config);
        });
        dynamicSliders.appendChild(deleteBtn);
      }
    }

    const emConfig = config as EmConfig;

    const hr = document.createElement('hr');
    hr.style.borderColor = '#27272a';
    hr.style.margin = '16px 0';
    dynamicSliders.appendChild(hr);

    const subheader = document.createElement('h3');
    subheader.innerText = 'Lorentz Deflection Controls';
    subheader.style.fontSize = '13px';
    subheader.style.color = '#ffffff';
    subheader.style.marginBottom = '12px';
    dynamicSliders.appendChild(subheader);

    addSlider('Magnetic Field (T)', -5, 5, 0.1, emConfig.bField, (v) => {
      emConfig.bField = v;
    });

    const selectWrapper = document.createElement('div');
    selectWrapper.className = 'slider-wrapper';
    selectWrapper.style.marginBottom = '12px';
    
    const selectLabel = document.createElement('label');
    selectLabel.style.display = 'block';
    selectLabel.style.fontSize = '12px';
    selectLabel.style.fontWeight = 'bold';
    selectLabel.style.marginBottom = '4px';
    selectLabel.innerText = 'B-Field Visual Mode';
    
    const selectEl = document.createElement('select');
    selectEl.className = 'select-preset';
    selectEl.style.width = '100%';
    selectEl.style.padding = '6px';
    selectEl.style.borderRadius = '4px';
    selectEl.style.backgroundColor = '#16161a';
    selectEl.style.color = '#fff';
    selectEl.style.border = '1px solid #3f3f46';
    
    const optSymbols = document.createElement('option');
    optSymbols.value = 'symbols';
    optSymbols.innerText = 'Symbols (Grid)';
    const optLines = document.createElement('option');
    optLines.value = 'lines';
    optLines.innerText = 'Field Lines';
    
    selectEl.appendChild(optSymbols);
    selectEl.appendChild(optLines);
    selectEl.value = emConfig.bFieldMode;
    
    selectEl.addEventListener('change', () => {
      emConfig.bFieldMode = selectEl.value as 'symbols' | 'lines';
      applyConfig(emConfig);
    });
    
    selectWrapper.appendChild(selectLabel);
    selectWrapper.appendChild(selectEl);
    dynamicSliders.appendChild(selectWrapper);

    addSlider('Particle Charge (nC)', -10, 10, 0.5, emConfig.particleCharge, (v) => {
      emConfig.particleCharge = v;
    });

    addSlider('Particle Mass', 0.1, 5.0, 0.1, emConfig.particleMass, (v) => {
      emConfig.particleMass = v;
    });

    addSlider('Launch Speed (m/s)', 5, 30, 1, emConfig.gunSpeed, (v) => {
      emConfig.gunSpeed = v;
    });

    addSlider('Launch Angle (°)', 0, 360, 5, emConfig.gunAngle, (v) => {
      emConfig.gunAngle = v;
    });

    const actionBtnContainer = document.createElement('div');
    actionBtnContainer.style.display = 'flex';
    actionBtnContainer.style.gap = '8px';
    actionBtnContainer.style.marginTop = '16px';
    actionBtnContainer.style.marginBottom = '16px';

    const fireBtn = document.createElement('button');
    fireBtn.className = 'btn btn-primary';
    fireBtn.style.flex = '1';
    fireBtn.style.backgroundColor = '#a855f7';
    fireBtn.style.color = '#ffffff';
    fireBtn.innerText = 'Fire Particle';
    fireBtn.setAttribute('aria-label', 'Fire Particle: Launch a test particle from the gun turret');
    fireBtn.addEventListener('click', () => {
      emDiagram.fireParticle();
    });

    const resetBtn = document.createElement('button');
    resetBtn.className = 'btn';
    resetBtn.style.flex = '1';
    resetBtn.style.backgroundColor = '#ef4444';
    resetBtn.style.color = '#ffffff';
    resetBtn.innerText = 'Reset Simulation';
    resetBtn.setAttribute('aria-label', 'Reset Simulation: Clear all launched particles and trajectory trails');
    resetBtn.addEventListener('click', () => {
      resetSimulation();
    });

    actionBtnContainer.appendChild(fireBtn);
    actionBtnContainer.appendChild(resetBtn);
    dynamicSliders.appendChild(actionBtnContainer);
  } else if (config.type === 'circuit') {
    if (circuitDiagram && circuitDiagram.selectedElementId) {
      const selectedId = circuitDiagram.selectedElementId;
      const elm = circuitEngine.elements.find(e => e.id === selectedId);
      const configElm = config.elements.find(e => e.id === selectedId);
      if (elm && configElm) {
        const header = document.createElement('div');
        header.style.fontWeight = 'bold';
        header.style.fontSize = '12px';
        header.style.color = '#a5b4fc';
        header.style.marginBottom = '8px';
        header.innerText = `Selected: ${elm.id.toUpperCase()} (${elm.type.toUpperCase()})`;
        dynamicSliders.appendChild(header);

        if (elm.type === 'resistor') {
          addSlider('Resistance (Ω)', 10, 5000, 10, (configElm as any).resistance, (v) => {
            (configElm as any).resistance = v;
            deserializeCircuit(circuitEngine, JSON.stringify({ elements: config.elements }));
            circuitEngine.analyzeCircuit();
          });
        } else if (elm.type === 'capacitor') {
          addSlider('Capacitance (μF)', 0.1, 100, 0.1, (configElm as any).capacitance * 1e6, (v) => {
            (configElm as any).capacitance = v * 1e-6;
            deserializeCircuit(circuitEngine, JSON.stringify({ elements: config.elements }));
            circuitEngine.analyzeCircuit();
          });
        } else if (elm.type === 'inductor') {
          addSlider('Inductance (mH)', 1, 1000, 1, (configElm as any).inductance * 1e3, (v) => {
            (configElm as any).inductance = v * 1e-3;
            deserializeCircuit(circuitEngine, JSON.stringify({ elements: config.elements }));
            circuitEngine.analyzeCircuit();
          });
        } else if (elm.type === 'voltage') {
          addSlider('Voltage Amplitude (V)', 0.5, 15, 0.5, (configElm as any).maxVoltage, (v) => {
            (configElm as any).maxVoltage = v;
            deserializeCircuit(circuitEngine, JSON.stringify({ elements: config.elements }));
            circuitEngine.analyzeCircuit();
          });
          if ((configElm as any).waveform === 'SQUARE' || (configElm as any).waveform === 'AC') {
            addSlider('Frequency (Hz)', 10, 200, 5, (configElm as any).frequency, (v) => {
              (configElm as any).frequency = v;
              deserializeCircuit(circuitEngine, JSON.stringify({ elements: config.elements }));
              circuitEngine.analyzeCircuit();
            });
          }
        }
      }
    } else {
      const promptDiv = document.createElement('div');
      promptDiv.style.padding = '12px';
      promptDiv.style.border = '1px dashed #374151';
      promptDiv.style.borderRadius = '6px';
      promptDiv.style.fontSize = '12px';
      promptDiv.style.color = '#9ca3af';
      promptDiv.style.textAlign = 'center';
      promptDiv.innerText = 'Click a component (resistor, capacitor, inductor, voltage source) on the canvas to configure its parameters.';
      dynamicSliders.appendChild(promptDiv);
    }
  }
}

// --- Simulation controls ---
function togglePlayPause() {
  isPlaying = !isPlaying;
  const playIcon = btnPlayPause.querySelector('.icon-play')!;
  const pauseIcon = btnPlayPause.querySelector('.icon-pause')!;
  const btnLabel = btnPlayPause.querySelector('span')!;

  if (isPlaying) {
    playIcon.classList.add('hidden');
    pauseIcon.classList.remove('hidden');
    btnLabel.innerText = 'Pause';
  } else {
    playIcon.classList.remove('hidden');
    pauseIcon.classList.add('hidden');
    btnLabel.innerText = 'Play';
  }
}

function stepSingleFrame() {
  isPlaying = false;
  const playIcon = btnPlayPause.querySelector('.icon-play')!;
  const pauseIcon = btnPlayPause.querySelector('.icon-pause')!;
  btnPlayPause.querySelector('span')!.innerText = 'Play';
  playIcon.classList.remove('hidden');
  pauseIcon.classList.add('hidden');

  // advance a single frame step of 0.016s (60 FPS)
  stepSimulation(0.0166);
  drawActiveSimulation();
}

function resetSimulation() {
  if (activeConfig.type === 'fbd') {
    fbdDiagram.resetState();
  } else if (activeConfig.type === 'shm') {
    shmDiagram.resetState();
  } else if (activeConfig.type === 'wave') {
    waveDiagram.resetState();
  } else if (activeConfig.type === 'mechanics') {
    mechanicsDiagram.resetState();
  } else if (activeConfig.type === 'fluids') {
    fluidsDiagram.resetState();
  } else if (activeConfig.type === 'gravity') {
    gravityDiagram.resetState();
  } else if (activeConfig.type === 'thermo') {
    thermoDiagram.resetState();
  } else if (activeConfig.type === 'em') {
    emDiagram.resetState();
  }
  drawActiveSimulation();
}

function handleSpeedChange() {
  simSpeed = parseFloat(sliderSpeed.value);
  labelSpeed.innerText = `${simSpeed.toFixed(1)}x`;
}

function handleGraphModeChange() {
  graphModule.mode = selectGraphMode.value as GraphMode;
  updateTitles(activeConfig);
  if (activeConfig.type === 'shm') {
    graphModule.draw(shmDiagram.history);
  } else if (activeConfig.type === 'thermo') {
    graphModule.drawThermo(thermoDiagram);
  } else if (activeConfig.type === 'em') {
    if (emDiagram.particles.length > 0) {
      graphModule.draw(emDiagram.history);
    } else {
      graphModule.drawEmptyState(
        'No Particles Launched',
        "Adjust launch parameters and click 'Fire Particle' to observe Lorentz force deflections."
      );
    }
  }
}

// --- Toggle Theme Light/Dark ---
function toggleTheme() {
  const body = document.body;
  const isDark = body.classList.contains('dark-theme');
  const sunIcon = btnThemeToggle.querySelector('.icon-sun')!;
  const moonIcon = btnThemeToggle.querySelector('.icon-moon')!;

  if (isDark) {
    body.classList.remove('dark-theme');
    body.classList.add('light-theme');
    sunIcon.classList.remove('hidden');
    moonIcon.classList.add('hidden');
    pc.theme = 'light';
    graphModule.theme = 'light';
  } else {
    body.classList.remove('light-theme');
    body.classList.add('dark-theme');
    sunIcon.classList.add('hidden');
    moonIcon.classList.remove('hidden');
    pc.theme = 'dark';
    graphModule.theme = 'dark';
  }
  
  // Force redraw immediately
  drawActiveSimulation();
}

// --- Live Code Editor Apply ---
function handleCodeApply() {
  const text = codeEditor.value;
  try {
    const parsed = JSON.parse(text);
    // Validate simple type
    if (!parsed.type) {
      throw new Error('Missing configuration parameter: "type"');
    }
    codeEditor.classList.remove('error-highlight');
    activeConfig = parsed;
    applyConfig(activeConfig);
  } catch (err: any) {
    console.error('Invalid JSON configuration applied: ', err);
    codeEditor.classList.add('error-highlight');
    alert(`Configuration Code Error: ${err.message}`);
  }
}

// --- Simulation Runner ---
function simulationLoop(timestamp: number) {
  let dt = (timestamp - lastTime) / 1000.0; // delta time in seconds
  lastTime = timestamp;

  // Cap delta time to avoid large jumps if window loses focus
  if (dt > 0.1) dt = 0.1;

  if (isPlaying) {
    stepSimulation(dt * simSpeed);
  }

  drawActiveSimulation();
  updateStatusBar();

  requestAnimationFrame(simulationLoop);
}

function stepSimulation(dt: number) {
  if (activeConfig.type === 'fbd') {
    fbdDiagram.step(dt);
  } else if (activeConfig.type === 'shm') {
    shmDiagram.step(dt);
  } else if (activeConfig.type === 'wave') {
    waveDiagram.step(dt);
  } else if (activeConfig.type === 'mechanics') {
    mechanicsDiagram.step(dt);
  } else if (activeConfig.type === 'fluids') {
    fluidsDiagram.step(dt);
  } else if (activeConfig.type === 'gravity') {
    gravityDiagram.step(dt);
  } else if (activeConfig.type === 'thermo') {
    thermoDiagram.step(dt);
  } else if (activeConfig.type === 'em') {
    emDiagram.step(dt);
  } else if (activeConfig.type === 'circuit') {
    const steps = Math.min(100, Math.ceil(dt / circuitEngine.maxTimeStep));
    for (let i = 0; i < steps; i++) {
      const success = circuitEngine.runStep(true);
      if (!success) break;
    }
    circuitHistory.push({
      t: circuitEngine.t,
      voltages: Array.from(circuitEngine.nodeVoltages)
    });
    if (circuitHistory.length > 500) {
      circuitHistory.shift();
    }
    if (selectPreset.value === 'circuit-switch') {
      const elapsed = circuitEngine.t;
      if (elapsed - lastCircuitSwitchToggleTime >= 1.0) {
        const sw = circuitEngine.elements.find(e => e.type === 'switch');
        if (sw) {
          (sw as any).toggle();
          circuitEngine.analyzeCircuit();
          console.log(`[Switch Toggled] Switch is now ${ (sw as any).closed ? 'CLOSED' : 'OPEN' } at t = ${elapsed.toFixed(3)}s`);
        }
        lastCircuitSwitchToggleTime = elapsed;
      }
    }
  }
}

function drawActiveSimulation() {
  if (activeConfig.type === 'fbd') {
    fbdDiagram.draw();
    graphModule.drawFbd(fbdDiagram.history);
  } else if (activeConfig.type === 'vector') {
    vectorDiagram.draw();
  } else if (activeConfig.type === 'shm') {
    shmDiagram.draw();
    graphModule.draw(shmDiagram.history);
  } else if (activeConfig.type === 'wave') {
    waveDiagram.draw();
  } else if (activeConfig.type === 'mechanics') {
    mechanicsDiagram.draw();
  } else if (activeConfig.type === 'fluids') {
    fluidsDiagram.draw(pc);
    graphModule.drawFluids(fluidsDiagram.history, activeConfig.mode);
  } else if (activeConfig.type === 'gravity') {
    gravityDiagram.draw();
    graphModule.draw(gravityDiagram.history);
  } else if (activeConfig.type === 'thermo') {
    thermoDiagram.draw();
    graphModule.drawThermo(thermoDiagram);
  } else if (activeConfig.type === 'em') {
    emDiagram.draw(pc, selectedChargeId);
    if (emDiagram.particles.length > 0) {
      graphModule.draw(emDiagram.history);
    } else {
      graphModule.drawEmptyState(
        'No Particles Launched',
        "Adjust launch parameters and click 'Fire Particle' to observe Lorentz force deflections."
      );
    }
  } else if (activeConfig.type === 'circuit') {
    drawCircuitTelemetry();
    circuitDiagram.draw(circuitEngine, circuitDiagram.selectedElementId, circuitDiagram.hoveredElementId, circuitDiagram.hoveredNode);
    graphModule.drawCircuit(circuitHistory);
  }
}

function drawCircuitTelemetry() {
  const ctx = pc.ctx;
  const w = pc.canvas.clientWidth;
  const h = pc.canvas.clientHeight;

  const isDark = pc.theme === 'dark';
  const bgColor1 = isDark ? '#0b0f19' : '#f8fafc';
  const bgColor2 = isDark ? '#111827' : '#f1f5f9';
  const cardColor = isDark ? 'rgba(31, 41, 55, 0.7)' : 'rgba(255, 255, 255, 0.9)';
  const textColor = isDark ? '#f3f4f6' : '#1e293b';
  const subTextColor = isDark ? '#9ca3af' : '#64748b';
  const borderColor = isDark ? '#374151' : '#cbd5e1';
  const accentColor = '#3b82f6';

  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, bgColor1);
  grad.addColorStop(1, bgColor2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)';
  ctx.lineWidth = 1;
  const gridSize = 40;
  for (let x = 0; x < w; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  ctx.save();
  ctx.fillStyle = textColor;
  ctx.font = 'bold 16px Outfit, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Circuits Engine Transient Solver', 25, 35);
  ctx.font = '11px Outfit, sans-serif';
  ctx.fillStyle = subTextColor;
  ctx.fillText(`Transient Step: ${circuitEngine.timeStep.toExponential(2)}s | Sim Time: ${circuitEngine.t.toFixed(4)}s`, 25, 55);

  const badgeX = w - 160;
  const badgeY = 20;
  const badgeW = 135;
  const badgeH = 26;
  ctx.fillStyle = circuitEngine.stopMessage ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)';
  ctx.strokeStyle = circuitEngine.stopMessage ? '#ef4444' : '#10b981';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = circuitEngine.stopMessage ? '#ef4444' : '#10b981';
  ctx.font = 'bold 11px Outfit, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    circuitEngine.stopMessage ? 'SIM OVERLOAD' : 'SIMULATION RUNNING',
    badgeX + badgeW / 2,
    badgeY + badgeH / 2
  );
  ctx.restore();

  const leftX = 25;
  const leftY = 80;
  const leftW = w / 2 - 40;
  const leftH = h - leftY - 30;

  ctx.save();
  ctx.fillStyle = cardColor;
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(leftX, leftY, leftW, leftH, 10);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = accentColor;
  ctx.font = 'bold 12px Outfit, sans-serif';
  ctx.fillText('MONITORED SCHEMATIC ELEMENTS', leftX + 15, leftY + 25);

  ctx.fillStyle = textColor;
  ctx.font = '10px Courier New, monospace';
  ctx.textAlign = 'left';

  let rowY = leftY + 50;
  const lineSpacing = 18;

  ctx.fillText(
    'ID      TYPE        V(diff)    CURRENT     POWER/ENERGY',
    leftX + 15,
    rowY
  );
  ctx.strokeStyle = borderColor;
  ctx.beginPath();
  ctx.moveTo(leftX + 15, rowY + 6);
  ctx.lineTo(leftX + leftW - 15, rowY + 6);
  ctx.stroke();
  rowY += lineSpacing + 4;

  for (const elm of circuitEngine.elements) {
    if (rowY > leftY + leftH - 30) break;

    const idStr = elm.id.padEnd(7);
    const typeStr = elm.type.toUpperCase().padEnd(11);
    
    const vdiff = elm.getVoltageDiff();
    const current = elm.getCurrent();
    
    let suffix = '';
    if (elm.type === 'resistor') {
      const p = Math.abs(vdiff * current);
      suffix = `${p.toFixed(3)}W`;
    } else if (elm.type === 'capacitor') {
      const c = (elm as any).capacitance;
      const energy = 0.5 * c * vdiff * vdiff;
      suffix = `${(energy * 1e6).toFixed(2)}μJ`;
    } else if (elm.type === 'inductor') {
      const l = (elm as any).inductance;
      const energy = 0.5 * l * current * current;
      suffix = `${(energy * 1e3).toFixed(2)}mJ`;
    } else if (elm.type === 'switch') {
      suffix = (elm as any).closed ? 'CLOSED' : 'OPEN';
    } else if (elm.type === 'voltage') {
      const p = vdiff * current;
      suffix = `${p.toFixed(3)}W`;
    }

    const vStr = `${vdiff.toFixed(2)}V`.padStart(7);
    const iStr = `${(current * 1e3).toFixed(2)}mA`.padStart(9);
    const suffixStr = suffix.padStart(12);

    ctx.fillStyle = textColor;
    ctx.fillText(
      `${idStr} ${typeStr} ${vStr}  ${iStr}  ${suffixStr}`,
      leftX + 15,
      rowY
    );
    rowY += lineSpacing;
  }
  ctx.restore();

  const rightX = w / 2 + 10;
  const rightY = 80;
  const rightW = w / 2 - 35;
  const rightH = h - rightY - 30;

  ctx.save();
  ctx.fillStyle = cardColor;
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(rightX, rightY, rightW, rightH, 10);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = accentColor;
  ctx.font = 'bold 12px Outfit, sans-serif';
  ctx.fillText('MNA SOLVER MATRIX INSPECTOR [A · x = b]', rightX + 15, rightY + 25);

  const N = circuitEngine.circuitMatrixSize;
  const mSize = circuitEngine.circuitMatrixSize;

  if (mSize === 0) {
    ctx.fillStyle = subTextColor;
    ctx.font = 'italic 11px Outfit, sans-serif';
    ctx.fillText('No active matrix equations solved.', rightX + 15, rightY + 60);
    ctx.restore();
    return;
  }

  ctx.fillStyle = textColor;
  ctx.font = '10px Outfit, sans-serif';
  ctx.fillText(`Matrix Dimensions: ${N}x${N} | Sub-iterations: ${circuitEngine.subIterations}`, rightX + 15, rightY + 45);

  const cellW = Math.min(50, (rightW - 140) / N);
  const cellH = Math.min(22, (rightH - 120) / N);

  ctx.font = '9px Courier New, monospace';
  ctx.textAlign = 'center';

  let startMatrixY = rightY + 75;

  for (let r = 0; r < N; r++) {
    const ry = startMatrixY + r * cellH;
    for (let c = 0; c < N; c++) {
      const val = circuitEngine.circuitMatrix[r * mSize + c];
      const cx = rightX + 25 + c * cellW;
      
      if (Math.abs(val) > 1e-9) {
        ctx.fillStyle = isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)';
        ctx.fillRect(cx - cellW / 2, ry - cellH / 2 + 2, cellW, cellH);
      }

      ctx.fillStyle = Math.abs(val) > 1e-9 ? textColor : subTextColor;
      ctx.fillText(
        Math.abs(val) > 1e-9 ? val.toFixed(3) : '0',
        cx,
        ry + cellH / 2
      );
    }

    const vx = rightX + 25 + N * cellW + 18;
    ctx.fillStyle = '#f59e0b';
    let varName = `v_${r + 1}`;
    if (r >= circuitEngine.nodeList.length - 1) {
      const vsIdx = r - (circuitEngine.nodeList.length - 1);
      const vsElm = circuitEngine.voltageSources[vsIdx];
      varName = `i_${vsElm ? vsElm.id : vsIdx}`;
    }
    ctx.fillText(varName, vx, ry + cellH / 2);

    const eqx = vx + 15;
    ctx.fillStyle = textColor;
    ctx.fillText('=', eqx, ry + cellH / 2);

    const bx = eqx + 18;
    ctx.fillStyle = '#10b981';
    const rhsVal = circuitEngine.circuitRightSide[r];
    ctx.fillText(rhsVal.toFixed(3), bx, ry + cellH / 2);
  }

  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1.5;
  const matLeft = rightX + 15;
  const matRight = rightX + 15 + N * cellW;
  const matTop = startMatrixY - cellH / 2 + 5;
  const matBottom = startMatrixY + (N - 1) * cellH + cellH / 2 + 2;

  ctx.beginPath();
  ctx.moveTo(matLeft + 6, matTop);
  ctx.lineTo(matLeft, matTop);
  ctx.lineTo(matLeft, matBottom);
  ctx.lineTo(matLeft + 6, matBottom);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(matRight - 6, matTop);
  ctx.lineTo(matRight, matTop);
  ctx.lineTo(matRight, matBottom);
  ctx.lineTo(matRight - 6, matBottom);
  ctx.stroke();

  const xLeft = rightX + 25 + N * cellW + 10;
  const xRight = xLeft + 16;
  ctx.beginPath();
  ctx.moveTo(xLeft + 4, matTop);
  ctx.lineTo(xLeft, matTop);
  ctx.lineTo(xLeft, matBottom);
  ctx.lineTo(xLeft + 4, matBottom);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(xRight - 4, matTop);
  ctx.lineTo(xRight, matTop);
  ctx.lineTo(xRight, matBottom);
  ctx.lineTo(xRight - 4, matBottom);
  ctx.stroke();

  const bLeft = xRight + 20;
  const bRight = bLeft + 32;
  ctx.beginPath();
  ctx.moveTo(bLeft + 4, matTop);
  ctx.lineTo(bLeft, matTop);
  ctx.lineTo(bLeft, matBottom);
  ctx.lineTo(bLeft + 4, matBottom);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(bRight - 4, matTop);
  ctx.lineTo(bRight, matTop);
  ctx.lineTo(bRight, matBottom);
  ctx.lineTo(bRight - 4, matBottom);
  ctx.stroke();

  ctx.restore();
}

// --- Update Status Bar Info ---
function updateStatusBar() {
  if (activeConfig.type === 'fbd') {
    statusTime.innerText = `${fbdDiagram.t.toFixed(2)}s`;
    
    statusExtra1.classList.remove('hidden');
    statusExtra1.querySelector('.status-label')!.innerHTML = 'Position:';
    statusExtra1.querySelector('.status-value')!.innerHTML = `${fbdDiagram.x.toFixed(2)} m`;

    statusExtra2.classList.remove('hidden');
    statusExtra2.querySelector('.status-label')!.innerHTML = 'Velocity:';
    statusExtra2.querySelector('.status-value')!.innerHTML = `${fbdDiagram.v.toFixed(2)} m/s`;

    statusExtra3.classList.remove('hidden');
    statusExtra3.querySelector('.status-label')!.innerHTML = 'Acceleration:';
    statusExtra3.querySelector('.status-value')!.innerHTML = `${fbdDiagram.a.toFixed(2)} m/s²`;

  } else if (activeConfig.type === 'vector') {
    statusTime.innerText = '--';
    
    statusExtra1.classList.remove('hidden');
    statusExtra1.querySelector('.status-label')!.innerHTML = 'Operation:';
    statusExtra1.querySelector('.status-value')!.innerHTML = activeConfig.operation.toUpperCase();

    statusExtra2.classList.add('hidden');
    statusExtra3.classList.add('hidden');

  } else if (activeConfig.type === 'shm') {
    statusTime.innerText = `${shmDiagram.t.toFixed(2)}s`;

    statusExtra1.classList.remove('hidden');
    statusExtra1.querySelector('.status-label')!.innerHTML = activeConfig.systemType === 'simple-pendulum' ? 'Angle:' : 'Position (x):';
    const unit = activeConfig.systemType === 'simple-pendulum' ? '°' : 'm';
    const val = activeConfig.systemType === 'simple-pendulum' ? shmDiagram.x * (180 / Math.PI) : shmDiagram.x;
    statusExtra1.querySelector('.status-value')!.innerHTML = `${val.toFixed(2)}${unit}`;

    statusExtra2.classList.remove('hidden');
    statusExtra2.querySelector('.status-label')!.innerHTML = activeConfig.systemType === 'simple-pendulum' ? 'Ang. Velocity:' : 'Velocity:';
    const vUnit = activeConfig.systemType === 'simple-pendulum' ? 'rad/s' : 'm/s';
    statusExtra2.querySelector('.status-value')!.innerHTML = `${shmDiagram.v.toFixed(2)} ${vUnit}`;

    statusExtra3.classList.remove('hidden');
    statusExtra3.querySelector('.status-label')!.innerHTML = 'Total Energy:';
    const lastData = shmDiagram.history[shmDiagram.history.length - 1];
    const energy = lastData ? lastData.totalEnergy : 0;
    statusExtra3.querySelector('.status-value')!.innerHTML = `${energy.toFixed(2)} J`;

  } else if (activeConfig.type === 'wave') {
    statusTime.innerText = `${waveDiagram.t.toFixed(2)}s`;

    statusExtra1.classList.remove('hidden');
    statusExtra1.querySelector('.status-label')!.innerHTML = 'Wave Mode:';
    statusExtra1.querySelector('.status-value')!.innerHTML = activeConfig.waveType.toUpperCase();

    statusExtra2.classList.add('hidden');
    statusExtra3.classList.add('hidden');

  } else if (activeConfig.type === 'mechanics') {
    statusTime.innerText = `${mechanicsDiagram.t.toFixed(2)}s`;

    if (activeConfig.mode === 'projectile') {
      statusExtra1.classList.remove('hidden');
      statusExtra1.querySelector('.status-label')!.innerHTML = 'Position (X, Y):';
      statusExtra1.querySelector('.status-value')!.innerHTML = `(${mechanicsDiagram.px.toFixed(1)}m, ${mechanicsDiagram.py.toFixed(1)}m)`;

      statusExtra2.classList.remove('hidden');
      statusExtra2.querySelector('.status-label')!.innerHTML = 'Velocity (v):';
      const v = Math.sqrt(mechanicsDiagram.pvx*mechanicsDiagram.pvx + mechanicsDiagram.pvy*mechanicsDiagram.pvy);
      statusExtra2.querySelector('.status-value')!.innerHTML = `${v.toFixed(1)} m/s`;

      statusExtra3.classList.add('hidden');
    } else if (activeConfig.mode === 'pulley') {
      statusExtra1.classList.remove('hidden');
      statusExtra1.querySelector('.status-label')!.innerHTML = 'Displacement:';
      statusExtra1.querySelector('.status-value')!.innerHTML = `${mechanicsDiagram.pulleyDisp.toFixed(2)} m`;

      statusExtra2.classList.remove('hidden');
      statusExtra2.querySelector('.status-label')!.innerHTML = 'Velocity:';
      statusExtra2.querySelector('.status-value')!.innerHTML = `${mechanicsDiagram.pulleyVel.toFixed(2)} m/s`;

      statusExtra3.classList.add('hidden');
    } else if (activeConfig.mode === 'collision') {
      statusExtra1.classList.remove('hidden');
      statusExtra1.querySelector('.status-label')!.innerHTML = 'Velocity A:';
      const va = Math.sqrt(mechanicsDiagram.cvxA*mechanicsDiagram.cvxA + mechanicsDiagram.cvyA*mechanicsDiagram.cvyA);
      statusExtra1.querySelector('.status-value')!.innerHTML = `${va.toFixed(1)} m/s`;

      statusExtra2.classList.remove('hidden');
      statusExtra2.querySelector('.status-label')!.innerHTML = 'Velocity B:';
      const vb = Math.sqrt(mechanicsDiagram.cvxB*mechanicsDiagram.cvxB + mechanicsDiagram.cvyB*mechanicsDiagram.cvyB);
      statusExtra2.querySelector('.status-value')!.innerHTML = `${vb.toFixed(1)} m/s`;

      statusExtra3.classList.add('hidden');
    } else if (activeConfig.mode === 'circular' && activeConfig.circular) {
      statusExtra1.classList.remove('hidden');
      statusExtra1.querySelector('.status-label')!.innerHTML = 'Angle:';
      statusExtra1.querySelector('.status-value')!.innerHTML = `${(mechanicsDiagram.circularAngle * 180 / Math.PI).toFixed(0)}°`;

      statusExtra2.classList.remove('hidden');
      statusExtra2.querySelector('.status-label')!.innerHTML = 'Inst. Speed:';
      const r = activeConfig.circular.radius;
      const g = activeConfig.circular.gravity;
      const speed = activeConfig.circular.speed;
      const theta = mechanicsDiagram.circularAngle + Math.PI / 2;
      let instV = speed;
      if (activeConfig.circular.isVertical) {
        const h = r * (1 - Math.cos(theta));
        const vSq = speed * speed - 2 * g * h;
        instV = vSq > 0 ? Math.sqrt(vSq) : 0;
      }
      statusExtra2.querySelector('.status-value')!.innerHTML = `${instV.toFixed(2)} m/s`;

      statusExtra3.classList.remove('hidden');
      statusExtra3.querySelector('.status-label')!.innerHTML = 'Tension:';
      let T = 0;
      if (activeConfig.circular.isVertical) {
        T = (activeConfig.circular.mass * instV * instV) / r + activeConfig.circular.mass * g * Math.cos(theta);
      } else {
        T = (activeConfig.circular.mass * speed * speed) / r;
      }
      statusExtra3.querySelector('.status-value')!.innerHTML = `${T.toFixed(1)} N`;
    }
  } else if (activeConfig.type === 'fluids') {
    statusTime.innerText = `${fluidsDiagram.t.toFixed(2)}s`;

    if (activeConfig.mode === 'buoyancy') {
      statusExtra1.classList.remove('hidden');
      statusExtra1.querySelector('.status-label')!.innerHTML = 'Fluid Density:';
      statusExtra1.querySelector('.status-value')!.innerHTML = `${activeConfig.buoyancy.fluidDensity} kg/m³`;

      statusExtra2.classList.remove('hidden');
      statusExtra2.querySelector('.status-label')!.innerHTML = 'Block Pos Y:';
      statusExtra2.querySelector('.status-value')!.innerHTML = `${fluidsDiagram.blockY.toFixed(2)} m`;

      statusExtra3.classList.remove('hidden');
      statusExtra3.querySelector('.status-label')!.innerHTML = 'Buoyancy Fb:';
      // Calculate buoyant force magnitude
      const rFluid = activeConfig.buoyancy.fluidDensity;
      const bVol = activeConfig.buoyancy.blockVolume;
      const g = activeConfig.buoyancy.gravity;
      const hBlock = Math.pow(bVol, 1/3);
      const fluidLevel = 2.0;
      const blockBottom = fluidsDiagram.blockY - hBlock / 2;
      const blockTop = fluidsDiagram.blockY + hBlock / 2;
      let hSub = 0;
      if (blockTop <= fluidLevel) hSub = hBlock;
      else if (blockBottom >= fluidLevel) hSub = 0;
      else hSub = fluidLevel - blockBottom;
      const vSub = bVol * (hSub / hBlock);
      const Fb = rFluid * vSub * g;
      statusExtra3.querySelector('.status-value')!.innerHTML = `${Fb.toFixed(1)} N`;
    } else if (activeConfig.mode === 'pascal') {
      statusExtra1.classList.remove('hidden');
      statusExtra1.querySelector('.status-label')!.innerHTML = 'Piston P1:';
      const P1 = activeConfig.pascal.force1 / activeConfig.pascal.area1;
      statusExtra1.querySelector('.status-value')!.innerHTML = `${P1.toFixed(1)} Pa`;

      statusExtra2.classList.remove('hidden');
      statusExtra2.querySelector('.status-label')!.innerHTML = 'Piston P2:';
      const F2 = activeConfig.pascal.force1 * (activeConfig.pascal.area2 / activeConfig.pascal.area1);
      const P2 = F2 / activeConfig.pascal.area2;
      statusExtra2.querySelector('.status-value')!.innerHTML = `${P2.toFixed(1)} Pa`;

      statusExtra3.classList.remove('hidden');
      statusExtra3.querySelector('.status-label')!.innerHTML = 'Output F2:';
      statusExtra3.querySelector('.status-value')!.innerHTML = `${F2.toFixed(1)} N`;
    } else if (activeConfig.mode === 'bernoulli') {
      statusExtra1.classList.remove('hidden');
      statusExtra1.querySelector('.status-label')!.innerHTML = 'Inlet Speed v1:';
      const d1 = activeConfig.bernoulli.diameter1;
      const a1 = Math.PI * (d1 / 2) * (d1 / 2);
      const v1 = activeConfig.bernoulli.flowRate / a1;
      statusExtra1.querySelector('.status-value')!.innerHTML = `${v1.toFixed(2)} m/s`;

      statusExtra2.classList.remove('hidden');
      statusExtra2.querySelector('.status-label')!.innerHTML = 'Throat Speed v2:';
      const d2 = activeConfig.bernoulli.diameter2;
      const a2 = Math.PI * (d2 / 2) * (d2 / 2);
      const v2 = activeConfig.bernoulli.flowRate / a2;
      statusExtra2.querySelector('.status-value')!.innerHTML = `${v2.toFixed(2)} m/s`;

      statusExtra3.classList.remove('hidden');
      statusExtra3.querySelector('.status-label')!.innerHTML = 'Pressure Drop ΔP:';
      const rho = activeConfig.bernoulli.fluidDensity;
      const deltaP = 0.5 * rho * (v2 * v2 - v1 * v1);
      statusExtra3.querySelector('.status-value')!.innerHTML = `${(deltaP / 1000).toFixed(1)} kPa`;
    } else if (activeConfig.mode === 'viscosity') {
      statusExtra1.classList.remove('hidden');
      statusExtra1.querySelector('.status-label')!.innerHTML = 'Sphere Speed:';
      statusExtra1.querySelector('.status-value')!.innerHTML = `${Math.abs(fluidsDiagram.sphereVy).toFixed(2)} m/s`;

      statusExtra2.classList.remove('hidden');
      statusExtra2.querySelector('.status-label')!.innerHTML = 'Terminal Speed vt:';
      const { fluidDensity, viscosity, sphereRadius, sphereDensity, gravity } = activeConfig.viscosity;
      const vt = (2 * sphereRadius * sphereRadius * gravity * (sphereDensity - fluidDensity)) / (9 * viscosity);
      statusExtra2.querySelector('.status-value')!.innerHTML = `${vt.toFixed(2)} m/s`;

      statusExtra3.classList.remove('hidden');
      statusExtra3.querySelector('.status-label')!.innerHTML = 'Viscosity η:';
      statusExtra3.querySelector('.status-value')!.innerHTML = `${viscosity.toFixed(2)} Pa·s`;
    }
  } else if (activeConfig.type === 'gravity') {
    statusTime.innerText = `${gravityDiagram.t.toFixed(2)}s`;
    if (activeConfig.mode === 'kepler' && activeConfig.kepler) {
      statusExtra1.classList.remove('hidden');
      statusExtra1.querySelector('.status-label')!.innerHTML = 'Position (X, Y):';
      statusExtra1.querySelector('.status-value')!.innerHTML = `(${gravityDiagram.planetX.toFixed(2)}, ${gravityDiagram.planetY.toFixed(2)})`;

      statusExtra2.classList.remove('hidden');
      statusExtra2.querySelector('.status-label')!.innerHTML = 'Speed (v):';
      const v = Math.sqrt(gravityDiagram.planetVx * gravityDiagram.planetVx + gravityDiagram.planetVy * gravityDiagram.planetVy);
      statusExtra2.querySelector('.status-value')!.innerHTML = `${v.toFixed(2)} m/s`;

      statusExtra3.classList.remove('hidden');
      statusExtra3.querySelector('.status-label')!.innerHTML = 'Eccentricity (e):';
      statusExtra3.querySelector('.status-value')!.innerHTML = `${activeConfig.kepler.eccentricity.toFixed(2)}`;
    } else if (activeConfig.mode === 'twobody') {
      statusExtra1.classList.remove('hidden');
      statusExtra1.querySelector('.status-label')!.innerHTML = 'Positions (r₁, r₂):';
      statusExtra1.querySelector('.status-value')!.innerHTML = `(${gravityDiagram.x1.toFixed(1)}, ${gravityDiagram.y1.toFixed(1)}) / (${gravityDiagram.x2.toFixed(1)}, ${gravityDiagram.y2.toFixed(1)})`;

      statusExtra2.classList.remove('hidden');
      statusExtra2.querySelector('.status-label')!.innerHTML = 'Speeds (v₁, v₂):';
      const v1 = Math.sqrt(gravityDiagram.vx1 * gravityDiagram.vx1 + gravityDiagram.vy1 * gravityDiagram.vy1);
      const v2 = Math.sqrt(gravityDiagram.vx2 * gravityDiagram.vx2 + gravityDiagram.vy2 * gravityDiagram.vy2);
      statusExtra2.querySelector('.status-value')!.innerHTML = `${v1.toFixed(2)} / ${v2.toFixed(2)} m/s`;

      statusExtra3.classList.remove('hidden');
      statusExtra3.querySelector('.status-label')!.innerHTML = 'Barycenter:';
      statusExtra3.querySelector('.status-value')!.innerHTML = '(0.0, 0.0)';
    } else if (activeConfig.mode === 'escape' && activeConfig.escape) {
      statusExtra1.classList.remove('hidden');
      statusExtra1.querySelector('.status-label')!.innerHTML = 'Probe Pos (X, Y):';
      statusExtra1.querySelector('.status-value')!.innerHTML = `(${gravityDiagram.px.toFixed(2)}, ${gravityDiagram.py.toFixed(2)})`;

      statusExtra2.classList.remove('hidden');
      statusExtra2.querySelector('.status-label')!.innerHTML = 'Speed (v):';
      const v = Math.sqrt(gravityDiagram.pvx * gravityDiagram.pvx + gravityDiagram.pvy * gravityDiagram.pvy);
      statusExtra2.querySelector('.status-value')!.innerHTML = `${v.toFixed(2)}`;

      statusExtra3.classList.remove('hidden');
      statusExtra3.querySelector('.status-label')!.innerHTML = 'Escape Speed (v_esc):';
      const r = Math.sqrt(gravityDiagram.px * gravityDiagram.px + gravityDiagram.py * gravityDiagram.py);
      const Mp = activeConfig.escape.planetMass;
      const G = 1.0;
      let vEsc = 0;
      if (r > 1e-6) {
        vEsc = Math.sqrt((2 * G * Mp) / r);
      }
      statusExtra3.querySelector('.status-value')!.innerHTML = `${vEsc.toFixed(2)}`;
    }
  } else if (activeConfig.type === 'thermo') {
    statusTime.innerText = `${thermoDiagram.t.toFixed(2)}s`;
    
    statusExtra1.classList.remove('hidden');
    statusExtra1.querySelector('.status-label')!.innerHTML = 'Temperature (T):';
    statusExtra1.querySelector('.status-value')!.innerHTML = `${thermoDiagram.temperature.toFixed(2)}`;

    statusExtra2.classList.remove('hidden');
    statusExtra2.querySelector('.status-label')!.innerHTML = 'Pressure (P):';
    statusExtra2.querySelector('.status-value')!.innerHTML = `${thermoDiagram.pressure.toFixed(2)}`;

    statusExtra3.classList.remove('hidden');
    statusExtra3.querySelector('.status-label')!.innerHTML = 'Volume (V):';
    statusExtra3.querySelector('.status-value')!.innerHTML = `${thermoDiagram.volume.toFixed(2)}`;
  } else if (activeConfig.type === 'em') {
    if (emDiagram.particles.length > 0) {
      statusTime.innerText = `${emDiagram.t.toFixed(2)}s`;
      const p = emDiagram.particles[0];
      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      const ke = 0.5 * p.m * speed * speed;

      statusExtra1.classList.remove('hidden');
      statusExtra1.querySelector('.status-label')!.innerHTML = 'Position (X, Y):';
      statusExtra1.querySelector('.status-value')!.innerHTML = `(${p.x.toFixed(2)}m, ${p.y.toFixed(2)}m)`;

      statusExtra2.classList.remove('hidden');
      statusExtra2.querySelector('.status-label')!.innerHTML = 'Velocity (v):';
      statusExtra2.querySelector('.status-value')!.innerHTML = `${speed.toFixed(2)} m/s`;

      statusExtra3.classList.remove('hidden');
      statusExtra3.querySelector('.status-label')!.innerHTML = 'Kinetic Energy:';
      statusExtra3.querySelector('.status-value')!.innerHTML = `${ke.toFixed(2)} J`;
    } else {
      statusTime.innerText = '--';

      statusExtra1.classList.remove('hidden');
      statusExtra1.querySelector('.status-label')!.innerHTML = 'Charges:';
      statusExtra1.querySelector('.status-value')!.innerHTML = `${activeConfig.charges.length}`;

      statusExtra2.classList.remove('hidden');
      const selCharge = activeConfig.charges.find(c => c.id === selectedChargeId);
      statusExtra2.querySelector('.status-label')!.innerHTML = 'Selected:';
      statusExtra2.querySelector('.status-value')!.innerHTML = selCharge ? `${selCharge.id} (${selCharge.q > 0 ? '+' : ''}${selCharge.q} nC)` : 'None';

      statusExtra3.classList.remove('hidden');
      statusExtra3.querySelector('.status-label')!.innerHTML = 'Telemetry:';
      statusExtra3.querySelector('.status-value')!.innerHTML = selCharge ? `(${selCharge.x.toFixed(1)}m, ${selCharge.y.toFixed(1)}m)` : 'Click to select';
    }
  } else if (activeConfig.type === 'circuit') {
    statusTime.innerText = `${circuitEngine.t.toFixed(4)}s`;

    statusExtra1.classList.remove('hidden');
    statusExtra1.querySelector('.status-label')!.innerHTML = 'Convergence:';
    statusExtra1.querySelector('.status-value')!.innerHTML = circuitEngine.converged ? 'YES' : 'NO';

    statusExtra2.classList.remove('hidden');
    statusExtra2.querySelector('.status-label')!.innerHTML = 'Iterations:';
    statusExtra2.querySelector('.status-value')!.innerHTML = `${circuitEngine.subIterations}`;

    statusExtra3.classList.remove('hidden');
    statusExtra3.querySelector('.status-label')!.innerHTML = 'Node Count:';
    statusExtra3.querySelector('.status-value')!.innerHTML = `${circuitEngine.nodeList.length}`;
  }
}

// Start orchestration
document.addEventListener('DOMContentLoaded', init);
if (document.readyState === 'interactive' || document.readyState === 'complete') {
  init();
}
