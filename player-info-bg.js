// player-info-bg.js - p5 instance mode to avoid conflicts
const bgSketch = (p) => {
  let gravity = 0.4;
  let bounceSprites = [];

  p.setup = function() {
    let cnv = p.createCanvas(p.windowWidth, p.windowHeight);
    cnv.position(0, 0);
    cnv.style("z-index", "-1");
    cnv.style("position", "fixed");
  };

  p.draw = function() {
    p.background (0, 0, 0);

    // Apply gravity & bounce to all sprites
    for (let i = bounceSprites.length - 1; i >= 0; i--) {
      let s = bounceSprites[i];
      s.vel.y += gravity;

      // Bounce on bottom
      if (s.y + s.d / 2 > p.height) {
        s.y = p.height - s.d / 2;
        s.vel.y *= -0.7;
        s.vel.x *= 0.98;
      }

      // Bounce on sides
      if (s.x - s.d / 2 < 0) {
        s.x = s.d / 2;
        s.vel.x *= -0.7;
      }
      if (s.x + s.d / 2 > p.width) {
        s.x = p.width - s.d / 2;
        s.vel.x *= -0.7;
      }
    }

    // Basketball cursor
    p.noStroke();
    p.fill(255, 165, 0);
    p.ellipse(p.mouseX, p.mouseY, 30, 30);
  };

p.mousePressed = function() {
  // Check if click is on an input element or button
  let target = document.elementFromPoint(p.mouseX, p.mouseY);
  if (target && (target.tagName === 'INPUT' || target.tagName === 'BUTTON' || target.closest('input') || target.closest('button'))) {
    // Don't create balls if clicking on UI elements
    return true; // Allow the event to continue to the UI element
  }
  
  // Create bouncy ball only if not clicking on UI
  let ball = {
    x: p.mouseX,
    y: p.mouseY,
    velX: p.random(-3, 3),
    velY: p.random(-2, 2),
    size: p.random(15, 40),
    color: p.color(255, 140, 0)
  };
  bounceSprites.push(ball);
  
  // Prevent event from bubbling to other elements
  return false;
};

  // Update the draw function to handle our custom ball objects
  p.draw = function() {
    p.background (0, 0, 0);

    // Apply gravity & bounce to all balls
    for (let i = bounceSprites.length - 1; i >= 0; i--) {
      let ball = bounceSprites[i];
      
      // Apply gravity
      ball.velY += gravity;
      
      // Update position
      ball.x += ball.velX;
      ball.y += ball.velY;

      // Bounce on bottom
      if (ball.y + ball.size / 2 > p.height) {
        ball.y = p.height - ball.size / 2;
        ball.velY *= -0.7;
        ball.velX *= 0.98;
      }

      // Bounce on sides
      if (ball.x - ball.size / 2 < 0) {
        ball.x = ball.size / 2;
        ball.velX *= -0.7;
      }
      if (ball.x + ball.size / 2 > p.width) {
        ball.x = p.width - ball.size / 2;
        ball.velX *= -0.7;
      }

      // Draw the ball
      p.fill(ball.color);
      p.noStroke();
      p.ellipse(ball.x, ball.y, ball.size, ball.size);
    }

    // Basketball cursor
    p.fill(255, 165, 0);
    p.ellipse(p.mouseX, p.mouseY, 30, 30);
  };

  p.keyPressed = function() {
    if (p.key === 'c') {
      // Clear all balls
      bounceSprites = [];
    }
  };

  p.windowResized = function() {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  };
};

// Create the p5 instance for background
new p5(bgSketch);


