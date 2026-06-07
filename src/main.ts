import './style.css';
import type { PhysicsConfig } from './lib/types';
import { PhysicsCanvas } from './lib/PhysicsCanvas';
import { FbdDiagram } from './lib/diagrams/FbdDiagram';
import { VectorDiagram } from './lib/diagrams/VectorDiagram';
import { ShmDiagram } from './lib/diagrams/ShmDiagram';
import { WaveDiagram } from './lib/diagrams/WaveDiagram';
import { MechanicsDiagram } from './lib/diagrams/MechanicsDiagram';
import { GraphModule } from './lib/diagrams/GraphModule';
import type { GraphMode } from './lib/diagrams/GraphModule';

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
    showPhaseSpace: false
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
    showPhaseSpace: false
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
    showPhaseSpace: false
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
    showPhaseSpace: true
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
  }
};

// --- Orchestrator App State ---
let activeConfig: PhysicsConfig = { ...PRESETS['shm-horizontal'] };
let isPlaying: boolean = true;
let simSpeed: number = 1.0;
let lastTime: number = 0;

// Render Canvas classes
let pc: PhysicsCanvas;
let graphModule: GraphModule;

// Individual Diagram Modifiers
let fbdDiagram: FbdDiagram;
let vectorDiagram: VectorDiagram;
let shmDiagram: ShmDiagram;
let waveDiagram: WaveDiagram;
let mechanicsDiagram: MechanicsDiagram;

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

  // Start animation loop
  lastTime = performance.now();
  requestAnimationFrame(simulationLoop);
}

// --- Load Preset Config ---
function loadPreset(name: string) {
  const baseConfig = PRESETS[name];
  if (!baseConfig) return;

  // Clone config
  activeConfig = JSON.parse(JSON.stringify(baseConfig));

  // Sync Select inputs
  selectPreset.value = name;

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
    } else if (config.mode === 'collision') {
      addSlider('Mass Sphere A (kg)', 1, 8, 0.5, config.collision.massA, (v) => {
        config.collision.massA = v;
        mechanicsDiagram.setConfig(config);
      });
      addSlider('Mass Sphere B (kg)', 1, 8, 0.5, config.collision.massB, (v) => {
        config.collision.massB = v;
        mechanicsDiagram.setConfig(config);
      });
      addSlider('Bounce Restitution e', 0, 1.0, 0.05, config.collision.restitution, (v) => {
        config.collision.restitution = v;
        mechanicsDiagram.setConfig(config);
      });
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
  }
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
    }
  }
}

// Start orchestration
document.addEventListener('DOMContentLoaded', init);
if (document.readyState === 'interactive' || document.readyState === 'complete') {
  init();
}
