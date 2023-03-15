class Particle {
  constructor(x, y, mass, isPinned) {
    this.x = x;
    this.y = y;
    this.prevX = x;
    this.prevY = y;
    this.mass = mass;
    this.isPinned = isPinned;
    this.initX = x;
    this.initY = y;
  }

  update(deltaTime, acceleration) {
    const prevPosition = { x: this.x, y: this.y };

    this.x = this.x * 2 - this.prevX + acceleration.x * (deltaTime * deltaTime);
    this.y = this.y * 2 - this.prevY + acceleration.y * (deltaTime * deltaTime);

    this.prevX = prevPosition.x;
    this.prevY = prevPosition.y;

    if (this.isPinned) {
      this.x = this.initX;
      this.y = this.initY;
    }
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
  let attachmentThreshold = 30;
  let attached = false;

  canvas.addEventListener("mousemove", (e) => {
    mouseX = e.offsetX;
    mouseY = e.offsetY;
  });

  // canvas.addEventListener("click", () => {
  //   attachmentThreshold = attachmentThreshold ? 0 : 30;
  // });

  canvas.addEventListener("mousedown", () => {
    attached = true;
  });

  canvas.addEventListener("mouseup", () => {
    attached = false;
  });

  const numParticles = 12;
  const particles = [];
  const sticks = [];

  for (let i = 0; i < numParticles; i++) {
    const startX = width / 2;
    const particle = new Particle(startX, i * 10, 10000, i === 0);
    particles.push(particle);

    let stickStartPoint = i > 0 ? particles[i - 1] : { x: startX - 1, y: 0 };

    const stick = new Stick(
      stickStartPoint,
      particles[i],
      getDistance(stickStartPoint, particles[i])
    );
    sticks.push(stick);
  }

  const draw = (timestamp) => {
    const elapsed = previousTimeStamp ? timestamp - previousTimeStamp : 0;
    previousTimeStamp = timestamp;

    ctx.clearRect(0, 0, width, height);

    // drawLine(ctx, width / 2, 0, mouseX, mouseY);
    // drawCircle(ctx, mouseX, mouseY, 10);

    if (
      getDistance(particles[numParticles - 1], { x: mouseX, y: mouseY }) <
      attachmentThreshold
    ) {
      canvas.style.cursor = "pointer";
      if (attached) {
        particles[numParticles - 1].x = mouseX;
        particles[numParticles - 1].y = mouseY;
      }
    } else {
      canvas.style.cursor = "default";
    }

    // Update particle positions
    for (let i = 0; i < particles.length; i++) {
      const particle = particles[i];
      const force = { x: 0.0, y: 9.82 };

      const acceleration = {
        x: force.x / particle.mass,
        y: force.y / particle.mass,
      };

      particle.update(elapsed, acceleration);
      keepInsideView(particle, width, height);
    }

    // Apply stick constraints to particles
    for (let i = 0; i < sticks.length; i++) {
      const stick = sticks[i];

      const diff = getDifference(stick.p1, stick.p2);
      const diffLength = getLength(diff);
      const diffFactor = ((stick.length - diffLength) / diffLength) * 0.5;
      const offset = { x: diff.x * diffFactor, y: diff.y * diffFactor };

      stick.p1.x += offset.x;
      stick.p1.y += offset.y;
      stick.p2.x -= offset.x;
      stick.p2.y -= offset.y;
    }

    // Draw particles
    for (let i = 0; i < particles.length; i++) {
      drawCircle(
        ctx,
        particles[i].x,
        particles[i].y,
        i === particles.length - 1 ? 8 : 3
      );
    }

    // Draw sticks
    for (let i = 0; i < sticks.length; i++) {
      drawLine(
        ctx,
        sticks[i].p1.x,
        sticks[i].p1.y,
        sticks[i].p2.x,
        sticks[i].p2.y
      );
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
