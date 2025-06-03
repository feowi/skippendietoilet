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

// Extra state voor nieuwe features
let coins = 0;
let achievements = [];
let combo = 0;
let comboTimer = 0;
let weather = null; // 'rain', 'snow', 'storm'
let weatherTimer = 0;
let portals = [];
let skins = ['cyan', 'orange', 'lime', 'magenta'];
let currentSkin = 0;
let randomEventTimer = 0;
let randomEventActive = false;
let shieldActive = false;
let shieldTimer = 0;
let slowMotion = false;
let slowMotionTimer = 0;
let xp = 0;
let xpToNext = 20;
let playerLevel = 1;
let paused = false;
let doubleScore = false;
let doubleScoreTimer = 0;
let speedBoost = false;
let speedBoostTimer = 0;
let showGameOver = false;

// Sounds
const shootSound = new Audio('sounds/shoot.wav');
const hitSound = new Audio('sounds/hit.wav');
const powerUpSound = new Audio('sounds/powerup.wav');
const bgMusic = new Audio('sounds/music.mp3');
window.bgMusic = bgMusic; // Voor settings toggle
bgMusic.loop = true;
bgMusic.volume = 0.3;
bgMusic.play();

function drawPlayer() {
  ctx.save();
  // Skin
  ctx.fillStyle = skins[currentSkin];
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
  ctx.fill();
  // Shield effect
  if (shieldActive) {
    ctx.strokeStyle = 'aqua';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.size + 6, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

// Nieuwe power-ups
function drawPowerUps() {
  powerUps.forEach(p => {
    ctx.save();
    if (p.type === 'green') ctx.fillStyle = 'green';
    else if (p.type === 'coin') ctx.fillStyle = 'gold';
    else if (p.type === 'shield') ctx.fillStyle = 'aqua';
    else if (p.type === 'slow') ctx.fillStyle = 'blue';
    else if (p.type === 'skin') ctx.fillStyle = 'magenta';
    else ctx.fillStyle = 'white';
    ctx.fillRect(p.x, p.y, 15, 15);
    ctx.restore();
  });
}

// Nieuwe vijandtypes
function drawEnemies() {
  enemies.forEach(enemy => {
    ctx.save();
    if (enemy.type === 'fast') ctx.fillStyle = 'orange';
    else if (enemy.type === 'zigzag') ctx.fillStyle = 'yellow';
    else if (enemy.type === 'splitter') ctx.fillStyle = 'pink';
    else ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

// Portals tekenen
function drawPortals() {
  portals.forEach(p => {
    ctx.save();
    ctx.strokeStyle = 'violet';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 25, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  });
}

// Weer-effecten
function drawWeather() {
  if (weather === 'rain') {
    for (let i = 0; i < 50; i++) {
      ctx.strokeStyle = '#00f8';
      ctx.beginPath();
      let rx = Math.random() * canvas.width;
      let ry = Math.random() * canvas.height;
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx, ry + 15);
      ctx.stroke();
    }
  }
  if (weather === 'snow') {
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = '#fff8';
      ctx.beginPath();
      ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (weather === 'storm') {
    if (Math.random() < 0.01) {
      ctx.fillStyle = '#fff8';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }
}

// HUD uitbreiden
function drawHUD() {
  ctx.fillStyle = 'white';
  ctx.fillText(`Score: ${player.score}  Lives: ${player.lives}  Level: ${level}  Coins: ${coins}`, 10, 20);
  ctx.fillText(`Combo: ${combo}`, 10, 40);
  ctx.fillText(`Skin: ${skins[currentSkin]}`, 10, 60);
  ctx.fillText(`XP: ${xp}/${xpToNext}  Player Lv: ${playerLevel}`, 10, 80);
  if (slowMotion) ctx.fillText('SLOW MOTION!', 10, 100);
  if (shieldActive) ctx.fillText('SHIELD!', 10, 120);
  if (doubleScore) ctx.fillText('DOUBLE SCORE!', 10, 140);
  if (speedBoost) ctx.fillText('SPEED BOOST!', 10, 160);
  // Achievements
  achievements.forEach((a, i) => {
    ctx.fillStyle = 'gold';
    ctx.fillText(`Achievement: ${a}`, 10, 180 + i * 20);
  });
}

function drawDayNightCycle() {
  ctx.fillStyle = dayTime ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,50,0.5)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function moveEnemies() {
  enemies.forEach(e => {
    if (e.type === 'fast') e.y += 2.5;
    else if (e.type === 'zigzag') {
      e.y += 1.2;
      e.x += Math.sin(Date.now() / 100 + e.y) * 2;
    }
    else e.y += 1;
  });
  bosses.forEach(b => b.y += 0.5);
}

function moveBullets() {
  bullets = bullets.filter(b => b.y > 0);
  bullets.forEach(b => b.y -= 10);
}

function spawnEnemy() {
  // Random type
  let r = Math.random();
  let type = 'normal';
  if (r < 0.15) type = 'fast';
  else if (r < 0.25) type = 'zigzag';
  else if (r < 0.3) type = 'splitter';
  enemies.push({ x: Math.random() * canvas.width, y: 0, size: 15, type });
}

// Splitter vijand splitst bij dood
function killEnemy(e, ei) {
  if (e.type === 'splitter') {
    for (let i = 0; i < 2; i++) {
      enemies.push({ x: e.x + i * 10, y: e.y, size: 10, type: 'fast' });
    }
  }
  enemies.splice(ei, 1);
}

function spawnBoss() {
  bosses.push({ x: canvas.width / 2, y: 0, size: 50, health: 10 });
}

function spawnPowerUp() {
  // Random type
  let r = Math.random();
  let type = 'green';
  if (r < 0.15) type = 'coin';
  else if (r < 0.25) type = 'shield';
  else if (r < 0.35) type = 'slow';
  else if (r < 0.45) type = 'skin';
  else if (r < 0.55) type = 'doubleScore';
  else if (r < 0.65) type = 'speedBoost';
  powerUps.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, type });
}

// Portals spawnen
function spawnPortal() {
  portals.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height });
}

function checkCollisions() {
  bullets.forEach(b => {
    enemies.forEach((e, ei) => {
      if (Math.hypot(b.x - e.x, b.y - e.y) < e.size) {
        hitSound.play();
        killEnemy(e, ei);
        let scoreAdd = doubleScore ? 2 : 1;
        player.score += scoreAdd;
        xp += 3;
        combo++;
        comboTimer = 120;
        // Achievement
        if (player.score >= 10 && !achievements.includes('10 kills')) achievements.push('10 kills');
        if (combo === 5 && !achievements.includes('Combo 5')) achievements.push('Combo 5');
      }
    });
    bosses.forEach((bss, bi) => {
      if (Math.hypot(b.x - bss.x, b.y - bss.y) < bss.size) {
        bss.health--;
        if (bss.health <= 0) {
          hitSound.play();
          bosses.splice(bi, 1);
          let scoreAdd = doubleScore ? 20 : 10;
          player.score += scoreAdd;
          xp += 10;
          achievements.push('Boss defeated');
        }
      }
    });
  });
  powerUps.forEach((p, pi) => {
    if (Math.hypot(player.x - p.x, player.y - p.y) < 20) {
      powerUpSound.play();
      if (p.type === 'coin') coins += 5;
      else if (p.type === 'shield') {
        shieldActive = true;
        shieldTimer = 300;
      }
      else if (p.type === 'slow') {
        slowMotion = true;
        slowMotionTimer = 180;
      }
      else if (p.type === 'skin') {
        currentSkin = (currentSkin + 1) % skins.length;
      }
      else if (p.type === 'doubleScore') {
        doubleScore = true;
        doubleScoreTimer = 300;
      }
      else if (p.type === 'speedBoost') {
        speedBoost = true;
        speedBoostTimer = 300;
      }
      else player.lives++;
      powerUps.splice(pi, 1);
    }
  });
  enemies.forEach((e, ei) => {
    if (Math.hypot(player.x - e.x, player.y - e.y) < e.size) {
      if (shieldActive) {
        shieldActive = false;
        enemies.splice(ei, 1);
        return;
      }
      enemies.splice(ei, 1);
      player.lives--;
      combo = 0;
      if (player.lives <= 0) {
        gameOver = true;
        showGameOver = true;
      }
    }
  });
  // Portals
  portals.forEach((p, pi) => {
    if (Math.hypot(player.x - p.x, player.y - p.y) < 25) {
      player.x = Math.random() * canvas.width;
      player.y = Math.random() * canvas.height;
      portals.splice(pi, 1);
    }
  });
}

function nextLevel() {
  level++;
  if (level % 5 === 0) spawnBoss();
  for (let i = 0; i < level * 2; i++) spawnEnemy();
  if (level % 3 === 0) spawnPowerUp();
  if (level % 4 === 0) spawnPortal();
  // Achievement
  if (level === 10 && !achievements.includes('Level 10')) achievements.push('Level 10');
}

function update() {
  if (paused) {
    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = "#222";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#fff";
    ctx.font = "bold 48px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("PAUSED", canvas.width / 2, canvas.height / 2);
    ctx.textAlign = "left";
    ctx.restore();
    return;
  }
  if (gameOver) {
    if (showGameOver) drawGameOver();
    return;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawDayNightCycle();
  drawWeather();
  drawPlayer();
  drawBullets();
  drawEnemies();
  drawPowerUps();
  drawBosses();
  drawPortals();
  drawHUD();
  moveBullets();
  moveEnemies();
  checkCollisions();
  if (enemies.length === 0 && bosses.length === 0) nextLevel();

  // Combo timer
  if (comboTimer > 0) comboTimer--;
  else combo = 0;

  // Shield timer
  if (shieldActive) {
    shieldTimer--;
    if (shieldTimer <= 0) shieldActive = false;
  }

  // Double score timer
  if (doubleScore) {
    doubleScoreTimer--;
    if (doubleScoreTimer <= 0) doubleScore = false;
  }

  // Speed boost timer
  if (speedBoost) {
    speedBoostTimer--;
    if (speedBoostTimer <= 0) speedBoost = false;
  }

  // Slow motion timer
  if (slowMotion) {
    slowMotionTimer--;
    if (slowMotionTimer <= 0) slowMotion = false;
  }

  // Weather timer
  if (weatherTimer > 0) weatherTimer--;
  else {
    let r = Math.random();
    if (r < 0.33) weather = 'rain';
    else if (r < 0.66) weather = 'snow';
    else weather = 'storm';
    weatherTimer = 600 + Math.random() * 600;
  }

  // Random event
  if (!randomEventActive && Math.random() < 0.001) {
    randomEventActive = true;
    let eventType = Math.random();
    if (eventType < 0.5) {
      // Meteor shower: spawn veel vijanden
      for (let i = 0; i < 10; i++) spawnEnemy();
      achievements.push('Meteor Shower!');
    } else {
      // Coin rain
      for (let i = 0; i < 10; i++) powerUps.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, type: 'coin' });
      achievements.push('Coin Rain!');
    }
    randomEventTimer = 300;
  }
  if (randomEventActive) {
    randomEventTimer--;
    if (randomEventTimer <= 0) randomEventActive = false;
  }

  // XP/level up
  if (xp >= xpToNext) {
    xp -= xpToNext;
    playerLevel++;
    xpToNext = Math.floor(xpToNext * 1.3 + 10);
    player.lives++;
    achievements.push('Level up!');
  }

  // UI bijwerken
  if (typeof updateUI === 'function') {
    updateUI(player.score, level, coins, player.lives, xp, xpToNext, playerLevel);
  }
}

function drawGameOver() {
  ctx.save();
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = "#222";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#fff";
  ctx.font = "bold 48px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 40);
  ctx.font = "28px sans-serif";
  ctx.fillText(`Score: ${player.score}`, canvas.width / 2, canvas.height / 2 + 10);
  ctx.fillText("Press R to restart", canvas.width / 2, canvas.height / 2 + 60);
  ctx.textAlign = "left";
  ctx.font = "16px sans-serif";
  ctx.fillStyle = "#0ff";
  ctx.fillText("Tip: Gebruik de shop en power-ups!", 20, canvas.height - 30);
  ctx.restore();
}

setInterval(() => {
  dayTime = !dayTime;
}, 5000);

setInterval(update, slowMotion ? 1000 / 30 : 1000 / 60);

// Controls
addEventListener('keydown', e => {
  if (paused && e.key !== 'p' && e.key !== 'P' && e.key !== 'r' && e.key !== 'R') return;
  if (e.key === 'ArrowLeft') player.x -= speedBoost ? player.speed * 2 : player.speed;
  if (e.key === 'ArrowRight') player.x += speedBoost ? player.speed * 2 : player.speed;
  if (e.key === 'ArrowUp') player.y -= speedBoost ? player.speed * 2 : player.speed;
  if (e.key === 'ArrowDown') player.y += speedBoost ? player.speed * 2 : player.speed;
  if (e.key === ' ') {
    bullets.push({ x: player.x, y: player.y });
    shootSound.play();
  }
  if (e.key === 'Tab') {
    currentSkin = (currentSkin + 1) % skins.length;
  }
  if (e.key === 'p' || e.key === 'P') {
    paused = !paused;
  }
  if ((e.key === 'r' || e.key === 'R') && gameOver) {
    // Reset alles
    player = { x: 400, y: 300, size: 20, speed: 5, score: 0, lives: 3 };
    bullets = [];
    enemies = [];
    powerUps = [];
    bosses = [];
    level = 1;
    dayTime = true;
    gameOver = false;
    showGameOver = false;
    coins = 0;
    achievements = [];
    combo = 0;
    comboTimer = 0;
    weather = null;
    weatherTimer = 0;
    portals = [];
    currentSkin = 0;
    randomEventTimer = 0;
    randomEventActive = false;
    shieldActive = false;
    shieldTimer = 0;
    slowMotion = false;
    slowMotionTimer = 0;
    xp = 0;
    xpToNext = 20;
    playerLevel = 1;
    doubleScore = false;
    doubleScoreTimer = 0;
    speedBoost = false;
    speedBoostTimer = 0;
    paused = false;
  }
});

// Shop functionaliteit
if (typeof document !== "undefined") {
  document.getElementById('shop-items').onclick = function(e) {
    let li = e.target.tagName === 'LI' ? e.target : e.target.closest('li');
    if (!li) return;
    let text = li.textContent;
    if (text.includes('Extra Life') && coins >= 10) {
      player.lives++;
      coins -= 10;
    }
    if (text.includes('Shield') && coins >= 8) {
      shieldActive = true;
      shieldTimer = 300;
      coins -= 8;
    }
    if (text.includes('Random Skin') && coins >= 5) {
      currentSkin = Math.floor(Math.random() * skins.length);
      coins -= 5;
    }
    if (typeof updateUI === 'function') {
      updateUI(player.score, level, coins, player.lives, xp, xpToNext, playerLevel);
    }
  };
}
