class Particle {
  constructor(x, y, mass) {
    this.x = x;
    this.y = y;
    this.prevX = x;
    this.prevY = y;
    this.mass = mass;
  }

  update(deltaTime, acceleration) {
    const prevPosition = { x: this.x, y: this.y };

    this.x = this.x * 2 - this.prevX + acceleration.x * (deltaTime * deltaTime);
    this.y = this.y * 2 - this.prevY + acceleration.y * (deltaTime * deltaTime);

    this.prevX = prevPosition.x;
    this.prevY = prevPosition.y;
  }
}

class Stick {
  constructor(p1, p2, length) {
    this.p1 = p1;
    this.p2 = p2;
    this.length = length;
  }
}

function getDistance(p1, p2) {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function getLength(v) {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

function getDifference(p1, p2) {
  return {
    x: p1.x - p2.x,
    y: p1.y - p2.y,
  };
}

function keepInsideView(particle, width, height) {
  if (particle.y >= height) particle.y = height;
  if (particle.x >= width) particle.x = width;
  if (particle.y < 0) particle.y = 0;
  if (particle.x < 0) particle.x = 0;
}

function setup() {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  ctx.strokeStyle = "red";
  ctx.lineWidth = 2;
  let mouseX = 0;
  let mouseY = 0;
  const width = canvas.width;
  const height = canvas.height;
  let previousTimeStamp = 0;

  canvas.addEventListener("mousemove", (e) => {
    mouseX = e.offsetX;
    mouseY = e.offsetY;
  });

  const particles = [];
  let pA = new Particle(220, 20, 10000);
  let pB = new Particle(280, 20, 10000);
  let pC = new Particle(280, 60, 10000);
  let pD = new Particle(220, 60, 10000);
  particles.push(pA, pB, pC, pD);

  const draw = (timestamp) => {
    const elapsed = previousTimeStamp ? timestamp - previousTimeStamp : 0;
    previousTimeStamp = timestamp;

    ctx.clearRect(0, 0, width, height);

    drawLine(ctx, width / 2, 0, mouseX, mouseY);
    drawCircle(ctx, mouseX, mouseY, 10);

    for (let i = 0; i < particles.length; i++) {
      const particle = particles[i];
      const force = { x: 0.0, y: 5 };

      const acceleration = {
        x: force.x / particle.mass,
        y: force.y / particle.mass,
      };

      particle.update(elapsed, acceleration);
      keepInsideView(particle, width, height);
      drawCircle(ctx, particle.x, particle.y, 5);
    }

    window.requestAnimationFrame(draw);
  };

  window.requestAnimationFrame(draw);
}

setup();

function drawCircle(ctx, x, y, radius) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  ctx.stroke();
}

function drawLine(ctx, startX, startY, endX, endY) {
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();
}
