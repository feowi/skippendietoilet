// main.js

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

let player = { x: 400, y: 300, size: 20, speed: 5, score: 0, lives: 3 };
let bullets = [];
let enemies = [];
let powerUps = [];
let bosses = [];
let level = 1;
let dayTime = true;
let gameOver = false;

// Sounds
const shootSound = new Audio('sounds/shoot.wav');
const hitSound = new Audio('sounds/hit.wav');
const powerUpSound = new Audio('sounds/powerup.wav');
const bgMusic = new Audio('sounds/music.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.3;
bgMusic.play();

function drawPlayer() {
  ctx.fillStyle = 'cyan';
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
  ctx.fill();
}

function drawEnemies() {
  enemies.forEach(enemy => {
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawBullets() {
  bullets.forEach(bullet => {
    ctx.fillStyle = 'yellow';
    ctx.fillRect(bullet.x, bullet.y, 5, 10);
  });
}

function drawPowerUps() {
  powerUps.forEach(p => {
    ctx.fillStyle = 'green';
    ctx.fillRect(p.x, p.y, 15, 15);
  });
}

function drawBosses() {
  bosses.forEach(b => {
    ctx.fillStyle = 'purple';
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawHUD() {
  ctx.fillStyle = 'white';
  ctx.fillText(`Score: ${player.score}  Lives: ${player.lives}  Level: ${level}`, 10, 20);
}

function drawDayNightCycle() {
  ctx.fillStyle = dayTime ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,50,0.5)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function moveEnemies() {
  enemies.forEach(e => e.y += 1);
  bosses.forEach(b => b.y += 0.5);
}

function moveBullets() {
  bullets = bullets.filter(b => b.y > 0);
  bullets.forEach(b => b.y -= 10);
}

function spawnEnemy() {
  enemies.push({ x: Math.random() * canvas.width, y: 0, size: 15 });
}

function spawnBoss() {
  bosses.push({ x: canvas.width / 2, y: 0, size: 50, health: 10 });
}

function spawnPowerUp() {
  powerUps.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height });
}

function checkCollisions() {
  bullets.forEach(b => {
    enemies.forEach((e, ei) => {
      if (Math.hypot(b.x - e.x, b.y - e.y) < e.size) {
        hitSound.play();
        enemies.splice(ei, 1);
        player.score++;
      }
    });
    bosses.forEach((bss, bi) => {
      if (Math.hypot(b.x - bss.x, b.y - bss.y) < bss.size) {
        bss.health--;
        if (bss.health <= 0) {
          hitSound.play();
          bosses.splice(bi, 1);
          player.score += 10;
        }
      }
    });
  });
  powerUps.forEach((p, pi) => {
    if (Math.hypot(player.x - p.x, player.y - p.y) < 20) {
      powerUpSound.play();
      powerUps.splice(pi, 1);
      player.lives++;
    }
  });
  enemies.forEach((e, ei) => {
    if (Math.hypot(player.x - e.x, player.y - e.y) < e.size) {
      enemies.splice(ei, 1);
      player.lives--;
      if (player.lives <= 0) gameOver = true;
    }
  });
}

function nextLevel() {
  level++;
  if (level % 5 === 0) spawnBoss();
  for (let i = 0; i < level * 2; i++) spawnEnemy();
  if (level % 3 === 0) spawnPowerUp();
}

function update() {
  if (gameOver) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawDayNightCycle();
  drawPlayer();
  drawBullets();
  drawEnemies();
  drawPowerUps();
  drawBosses();
  drawHUD();
  moveBullets();
  moveEnemies();
  checkCollisions();
  if (enemies.length === 0 && bosses.length === 0) nextLevel();
}

setInterval(() => {
  dayTime = !dayTime;
}, 5000);

setInterval(update, 1000 / 60);

// Controls
addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') player.x -= player.speed;
  if (e.key === 'ArrowRight') player.x += player.speed;
  if (e.key === 'ArrowUp') player.y -= player.speed;
  if (e.key === 'ArrowDown') player.y += player.speed;
  if (e.key === ' ') {
    bullets.push({ x: player.x, y: player.y });
    shootSound.play();
  }
});
