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

function setup(onDragged) {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  ctx.strokeStyle = "#93370D";
  ctx.fillStyle = "#FDB022";
  ctx.lineWidth = 2;
  let mouseX = 0;
  let mouseY = 0;
  const width = canvas.width;
  const height = canvas.height;
  let previousTimeStamp = 0;
  let attachmentThreshold = 30;
  let mouseDown = false;
  let attachedToMouse = false;
  const handleSize = 8;
  const particleSize = 0;
  const GRAVITY = 9.82;
  const dragStart = { x: 0, y: 0 };
  const particleMass = 10_000;
  const handleMass = 20_000;
  const dragThreshold = 150;
  const numParticles = 20;
  const ropeLength = 100;
  const particles = [];
  const sticks = [];
  const startX = width / 2;

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      previousTimeStamp = 0;
    }
  });

  const handleTouchMove = (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    mouseX = e.touches[0].clientX - rect.x;
    mouseY = e.touches[0].clientY - rect.y;

    if (attachedToMouse) {
      const distanceDragged = getDistance(dragStart, {
        x: e.touches[0].clientX - rect.x,
        y: e.touches[0].clientY - rect.y,
      });

      if (distanceDragged > dragThreshold) {
        mouseDown = false;
        attachedToMouse = false;
        onDragged();
      }
    }
  };

  const handleMouseMove = (e) => {
    e.preventDefault();
    mouseX = e.offsetX;
    mouseY = e.offsetY;

    if (attachedToMouse) {
      const distanceDragged = getDistance(dragStart, {
        x: e.offsetX,
        y: e.offsetY,
      });

      if (distanceDragged > dragThreshold) {
        mouseDown = false;
        attachedToMouse = false;
        onDragged();
      }
    }
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    mouseDown = true;
    dragStart.x = e.offsetX;
    dragStart.y = e.offsetY;
  };

  const handleMouseUp = () => {
    mouseDown = false;
    attachedToMouse = false;
  };

  const handleTouchStart = (e) => {
    e.preventDefault();
    mouseDown = true;
    const rect = canvas.getBoundingClientRect();
    dragStart.x = e.touches[0].clientX - rect.x;
    dragStart.y = e.touches[0].clientY - rect.y;
  };

  canvas.addEventListener("mousemove", handleMouseMove);
  canvas.addEventListener("mousedown", handleMouseDown);
  canvas.addEventListener("mouseup", handleMouseUp);
  canvas.addEventListener("touchmove", handleTouchMove);
  canvas.addEventListener("touchstart", handleTouchStart);
  canvas.addEventListener("touchend", handleMouseUp);

  // Create particles and sticks
  for (let i = 0; i < numParticles; i++) {
    const particle = new Particle(
      startX,
      i * (ropeLength / numParticles),
      i < numParticles - 1 ? particleMass : handleMass,
      i === 0
    );
    particles.push(particle);

    let stickStartPoint = i > 0 ? particles[i - 1] : { x: startX - 0.01, y: 0 };

    const stick = new Stick(
      stickStartPoint,
      particles[i],
      getDistance(stickStartPoint, particles[i])
    );
    sticks.push(stick);
  }

  const draw = (timestamp) => {
    const elapsed = previousTimeStamp ? timestamp - previousTimeStamp : 1;
    previousTimeStamp = timestamp;

    ctx.clearRect(0, 0, width, height);

    const distanceToHandle = getDistance(particles[numParticles - 1], {
      x: mouseX,
      y: mouseY,
    });

    if (distanceToHandle < attachmentThreshold && mouseDown) {
      attachedToMouse = true;
    }

    if (attachedToMouse) {
      particles[numParticles - 1].x = mouseX;
      particles[numParticles - 1].y = mouseY;
    }

    if (distanceToHandle < attachmentThreshold) {
      canvas.style.cursor = "pointer";
    } else {
      canvas.style.cursor = "default";
    }

    // Update particle positions
    for (let i = 0; i < particles.length; i++) {
      const particle = particles[i];
      const force = { x: 0, y: GRAVITY };

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

      // Move points toward each other
      stick.p1.x += offset.x;
      stick.p1.y += offset.y;
      stick.p2.x -= offset.x;
      stick.p2.y -= offset.y;
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

    // Draw particles
    for (let i = 0; i < particles.length; i++) {
      const isHandle = i === particles.length - 1;

      drawCircle(
        ctx,
        particles[i].x,
        particles[i].y,
        isHandle ? handleSize : particleSize,
        isHandle
      );
    }

    window.requestAnimationFrame(draw);
  };

  window.requestAnimationFrame(draw);
}

const handler = () => console.log("click!");

setup(handler);

function drawCircle(ctx, x, y, radius, fill) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  if (fill) {
    ctx.fill();
  } else {
    ctx.stroke();
  }
}

function drawLine(ctx, startX, startY, endX, endY) {
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();
}
