const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let keys = {};
let score = 0;
let lives = 3;
let dayTime = true;
let timeCounter = 0;

const player = {
  x: 100,
  y: 100,
  size: 20,
  speed: 3,
  invisible: false,
  invisibleTimer: 0
};

const enemies = [];
const bosses = [];
const powerUps = [];

function spawnEnemy() {
  enemies.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: 20,
    speed: 1.5
  });
}

function spawnPowerUp() {
  powerUps.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: 15,
    type: Math.random() < 0.5 ? "speed" : "invisible"
  });
}

function spawnBoss() {
  bosses.push({
    x: canvas.width,
    y: Math.random() * canvas.height,
    size: 40,
    speed: 2
  });
}

function update() {
  // Player movement
  if (keys["ArrowUp"]) player.y -= player.speed;
  if (keys["ArrowDown"]) player.y += player.speed;
  if (keys["ArrowLeft"]) player.x -= player.speed;
  if (keys["ArrowRight"]) player.x += player.speed;

  // Clamp player position
  player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
  player.y = Math.max(0, Math.min(canvas.height - player.size, player.y));

  // Invisible timer
  if (player.invisible) {
    player.invisibleTimer--;
    if (player.invisibleTimer <= 0) {
      player.invisible = false;
    }
  }

  // Update enemies
  for (const enemy of enemies) {
    if (enemy.x < player.x) enemy.x += enemy.speed;
    if (enemy.x > player.x) enemy.x -= enemy.speed;
    if (enemy.y < player.y) enemy.y += enemy.speed;
    if (enemy.y > player.y) enemy.y -= enemy.speed;

    if (!player.invisible &&
        Math.abs(enemy.x - player.x) < player.size &&
        Math.abs(enemy.y - player.y) < player.size) {
      lives--;
      enemy.x = Math.random() * canvas.width;
      enemy.y = Math.random() * canvas.height;
      if (lives <= 0) {
        alert("Game Over!");
        document.location.reload();
      }
    }
  }

  // Update bosses
  for (const boss of bosses) {
    boss.x -= boss.speed;
    if (boss.x < -boss.size) {
      boss.x = canvas.width + boss.size;
      boss.y = Math.random() * canvas.height;
    }

    if (!player.invisible &&
        Math.abs(boss.x - player.x) < boss.size &&
        Math.abs(boss.y - player.y) < boss.size) {
      lives = 0;
      alert("Verslagen door een boss!");
      document.location.reload();
    }
  }

  // Power-up pickup
  for (let i = powerUps.length - 1; i >= 0; i--) {
    const p = powerUps[i];
    if (Math.abs(p.x - player.x) < p.size &&
        Math.abs(p.y - player.y) < p.size) {
      if (p.type === "speed") {
        player.speed = 6;
        setTimeout(() => { player.speed = 3; }, 5000);
      } else if (p.type === "invisible") {
        player.invisible = true;
        player.invisibleTimer = 300;
      }
      powerUps.splice(i, 1);
      score += 5;
    }
  }

  // Time / day-night cycle
  timeCounter++;
  if (timeCounter % 600 === 0) {
    dayTime = !dayTime;
    if (!dayTime) spawnBoss();
  }
}

function draw() {
  // Background
  ctx.fillStyle = dayTime ? "#87CEEB" : "#001d3d";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Player
  ctx.fillStyle = player.invisible ? "rgba(0,255,0,0.3)" : "lime";
  ctx.fillRect(player.x, player.y, player.size, player.size);

  // Enemies
  ctx.fillStyle = "red";
  for (const enemy of enemies) {
    ctx.fillRect(enemy.x, enemy.y, enemy.size, enemy.size);
  }

  // Bosses
  ctx.fillStyle = "black";
  for (const boss of bosses) {
    ctx.fillRect(boss.x, boss.y, boss.size, boss.size);
  }

  // Power-ups
  for (const p of powerUps) {
    ctx.fillStyle = p.type === "speed" ? "blue" : "yellow";
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }

  // HUD
  ctx.fillStyle = "white";
  ctx.fillText("Score: " + score, 10, 20);
  ctx.fillText("Lives: " + lives, 10, 40);
  ctx.fillText("Tijd: " + (dayTime ? "Dag" : "Nacht"), 10, 60);
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

document.addEventListener("keydown", (e) => keys[e.key] = true);
document.addEventListener("keyup", (e) => keys[e.key] = false);
canvas.addEventListener("click", spawnPowerUp);

// Start game
for (let i = 0; i < 5; i++) spawnEnemy();
gameLoop();
