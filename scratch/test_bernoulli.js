const diameter1 = 1.5;
const diameter2 = 0.3;
const flowRate = 0.030;
const dt = 0.016;

function getPipeDiameter(x) {
  return diameter1 - (diameter1 - diameter2) * Math.exp(-(x * x) / 0.8);
}

// Initialize particles randomly in [-2.5, 2.5]
let particles = [];
for (let i = 0; i < 35; i++) {
  particles.push(-2.5 + Math.random() * 5.0);
}

// Run simulation for 5000 frames (80 seconds)
for (let frame = 0; frame < 5000; frame++) {
  particles = particles.map(x => {
    const d = getPipeDiameter(x);
    const area = Math.PI * (d / 2) * (d / 2);
    const speed = flowRate / area;
    let newX = x + speed * dt;
    if (newX > 2.5) {
      newX = -2.5;
    }
    return newX;
  });
}

// Print distribution
const left = particles.filter(x => x < 0).length;
const right = particles.filter(x => x >= 0).length;
console.log(`Particles - Left: ${left}, Right: ${right}`);
console.log(`First 10 particles:`, particles.slice(0, 10));
