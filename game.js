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

// --- Nieuwe variabelen voor weapons, unlocks, pets, trails, etc ---
let weapons = [
  { name: "Gun", unlocked: true, fire: shootBullet },
  { name: "Sword", unlocked: false, fire: swingSword },
  { name: "Laser", unlocked: false, fire: shootLaser }
];
let currentWeapon = 0;
let swordSwings = [];
let lasers = [];
let unlockedSkins = [0];
let unlockedPets = [];
let pets = [
  { name: "Cat", unlocked: false, color: "orange" },
  { name: "Dog", unlocked: false, color: "brown" }
];
let equippedPet = null;
let trails = [
  { name: "Rainbow", unlocked: false },
  { name: "Fire", unlocked: false }
];
let equippedTrail = null;

// --- Camera/wereld offset zodat speler altijd in het midden ---
function getCameraOffset() {
  return {
    x: player.x - canvas.width / 2,
    y: player.y - canvas.height / 2
  };
}

// --- Draw player in center, rest met offset ---
function drawPlayer() {
  ctx.save();
  let px = canvas.width / 2, py = canvas.height / 2;
  // Trail
  if (equippedTrail === "Rainbow") {
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.arc(px, py, player.size + 10 + i * 3, 0, Math.PI * 2);
      ctx.strokeStyle = `hsl(${i * 60},100%,60%)`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
  // Skin
  ctx.fillStyle = skins[currentSkin];
  ctx.beginPath();
  ctx.arc(px, py, player.size, 0, Math.PI * 2);
  ctx.fill();
  // Pet
  if (equippedPet !== null) {
    ctx.fillStyle = pets[equippedPet].color;
    ctx.beginPath();
    ctx.arc(px - 30, py + 30, 12, 0, Math.PI * 2);
    ctx.fill();
  }
  // Shield effect
  if (shieldActive) {
    ctx.strokeStyle = 'aqua';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(px, py, player.size + 6, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

// --- Draw enemies met offset ---
function drawEnemies() {
  let cam = getCameraOffset();
  enemies.forEach(enemy => {
    ctx.save();
    let ex = enemy.x - cam.x, ey = enemy.y - cam.y;
    if (enemy.type === 'fast') ctx.fillStyle = 'orange';
    else if (enemy.type === 'zigzag') ctx.fillStyle = 'yellow';
    else if (enemy.type === 'tank') ctx.fillStyle = 'gray';
    else if (enemy.type === 'shooter') ctx.fillStyle = 'blue';
    else if (enemy.type === 'splitter') ctx.fillStyle = 'pink';
    else ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(ex, ey, enemy.size, 0, Math.PI * 2);
    ctx.fill();
    // Enemy health bar
    if (enemy.health && enemy.health < enemy.maxHealth) {
      ctx.fillStyle = "#fff";
      ctx.fillRect(ex - 15, ey - enemy.size - 10, 30, 5);
      ctx.fillStyle = "#f00";
      ctx.fillRect(ex - 15, ey - enemy.size - 10, 30 * (enemy.health / enemy.maxHealth), 5);
    }
    ctx.restore();
  });
}

// --- Draw bullets, lasers, sword swings met offset ---
function drawBullets() {
  let cam = getCameraOffset();
  bullets.forEach(bullet => {
    ctx.fillStyle = 'yellow';
    ctx.fillRect(bullet.x - cam.x, bullet.y - cam.y, 5, 10);
  });
  lasers.forEach(l => {
    ctx.strokeStyle = "lime";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(l.x1 - cam.x, l.y1 - cam.y);
    ctx.lineTo(l.x2 - cam.x, l.y2 - cam.y);
    ctx.stroke();
  });
  swordSwings.forEach(s => {
    ctx.strokeStyle = "white";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, player.size + 18, s.a1, s.a2);
    ctx.stroke();
  });
}

// --- Draw powerups, portals met offset ---
function drawPowerUps() {
  let cam = getCameraOffset();
  powerUps.forEach(p => {
    ctx.save();
    let px = p.x - cam.x, py = p.y - cam.y;
    if (p.type === 'green') ctx.fillStyle = 'green';
    else if (p.type === 'coin') ctx.fillStyle = 'gold';
    else if (p.type === 'shield') ctx.fillStyle = 'aqua';
    else if (p.type === 'slow') ctx.fillStyle = 'blue';
    else if (p.type === 'skin') ctx.fillStyle = 'magenta';
    else if (p.type === 'mystery') ctx.fillStyle = 'purple';
    else ctx.fillStyle = 'white';
    ctx.fillRect(px, py, 15, 15);
    ctx.restore();
  });
}
function drawPortals() {
  let cam = getCameraOffset();
  portals.forEach(p => {
    ctx.save();
    ctx.strokeStyle = 'violet';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(p.x - cam.x, p.y - cam.y, 25, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  });
}

// --- Enemy AI en movement ---
function moveEnemies() {
  let cam = getCameraOffset();
  enemies.forEach(e => {
    // Richting naar speler (altijd midden)
    let dx = canvas.width / 2 - (e.x - cam.x);
    let dy = canvas.height / 2 - (e.y - cam.y);
    let dist = Math.hypot(dx, dy);
    let speed = e.type === 'fast' ? 2.5 : e.type === 'tank' ? 0.7 : 1;
    if (e.type === 'zigzag') {
      e.x += Math.sin(Date.now() / 100 + e.y) * 2;
      e.y += speed;
    } else if (e.type === 'shooter') {
      e.y += 0.7;
      // Schiet af en toe
      if (Math.random() < 0.01) {
        let angle = Math.atan2(dy, dx);
        enemies.push({
          x: e.x, y: e.y, size: 7, type: 'bullet', vx: Math.cos(angle) * 5, vy: Math.sin(angle) * 5
        });
      }
    } else if (e.type === 'bullet') {
      e.x += e.vx; e.y += e.vy;
    } else {
      e.x += dx / dist * speed;
      e.y += dy / dist * speed;
    }
  });
  bosses.forEach(b => b.y += 0.5);
}

// --- Weapons ---
function shootBullet() {
  bullets.push({ x: player.x, y: player.y, vx: 0, vy: -10 });
}
function swingSword() {
  swordSwings.push({ a1: Math.PI * 1.2, a2: Math.PI * 1.8, timer: 15 });
}
function shootLaser() {
  lasers.push({
    x1: player.x, y1: player.y,
    x2: player.x, y2: player.y - 300,
    timer: 10
  });
}

// --- Weapon switching ---
addEventListener('keydown', e => {
  // ...existing code...
  if (e.key === '1') currentWeapon = 0;
  if (e.key === '2' && weapons[1].unlocked) currentWeapon = 1;
  if (e.key === '3' && weapons[2].unlocked) currentWeapon = 2;
  // ...existing code...
});

// --- Fire weapon ---
addEventListener('keydown', e => {
  // ...existing code...
  if (e.key === ' ' && !paused && !gameOver) {
    weapons[currentWeapon].fire();
    shootSound.play();
  }
  // ...existing code...
});

// --- Update sword/laser timers ---
function updateWeapons() {
  swordSwings = swordSwings.filter(s => --s.timer > 0);
  lasers = lasers.filter(l => --l.timer > 0);
}

// --- Unlocks via achievements ---
function unlockByAchievement(name) {
  if (name === "Sword Master") weapons[1].unlocked = true;
  if (name === "Laser Unlocked") weapons[2].unlocked = true;
  if (name === "Rainbow Trail") {
    trails[0].unlocked = true;
    equippedTrail = "Rainbow";
  }
  if (name === "Cat Friend") {
    pets[0].unlocked = true;
    equippedPet = 0;
  }
  if (name === "Fire Trail") {
    trails[1].unlocked = true;
    equippedTrail = "Fire";
  }
}

// --- Achievements uitbreiden ---
function checkAchievements() {
  if (player.score >= 25 && !achievements.includes("Sword Master")) {
    achievements.push("Sword Master");
    unlockByAchievement("Sword Master");
  }
  if (player.score >= 50 && !achievements.includes("Laser Unlocked")) {
    achievements.push("Laser Unlocked");
    unlockByAchievement("Laser Unlocked");
  }
  if (combo >= 10 && !achievements.includes("Rainbow Trail")) {
    achievements.push("Rainbow Trail");
    unlockByAchievement("Rainbow Trail");
  }
  if (playerLevel >= 5 && !achievements.includes("Cat Friend")) {
    achievements.push("Cat Friend");
    unlockByAchievement("Cat Friend");
  }
  if (player.score >= 100 && !achievements.includes("Fire Trail")) {
    achievements.push("Fire Trail");
    unlockByAchievement("Fire Trail");
  }
}

// --- Fun: mystery box, minigame, random events, pets, trails ---
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
  if (Math.random() < 0.1) powerUps.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, type: 'mystery' });
}

// --- Mystery box effect ---
function openMysteryBox() {
  let r = Math.random();
  if (r < 0.2) player.lives++;
  else if (r < 0.4) coins += 10;
  else if (r < 0.6) shieldActive = true;
  else if (r < 0.8) doubleScore = true;
  else achievements.push("Lucky Box!");
}

// --- Check collisions aangepast voor weapons, mystery, unlocks ---
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
  // Sword swings
  swordSwings.forEach(s => {
    enemies.forEach((e, ei) => {
      let cam = getCameraOffset();
      let ex = e.x - cam.x, ey = e.y - cam.y;
      let dx = ex - canvas.width / 2, dy = ey - canvas.height / 2;
      let dist = Math.hypot(dx, dy);
      let angle = Math.atan2(dy, dx);
      if (dist < player.size + 25 && angle > s.a1 && angle < s.a2) {
        killEnemy(e, ei);
        player.score++;
        xp += 2;
      }
    });
  });
  // Lasers
  lasers.forEach(l => {
    enemies.forEach((e, ei) => {
      let cam = getCameraOffset();
      let ex = e.x - cam.x, ey = e.y - cam.y;
      if (Math.abs(ex - canvas.width / 2) < 10 && ey < canvas.height / 2 && ey > canvas.height / 2 - 300) {
        killEnemy(e, ei);
        player.score += 2;
        xp += 3;
      }
    });
  });
  // Powerups
  powerUps.forEach((p, pi) => {
    let cam = getCameraOffset();
    let px = p.x - cam.x, py = p.y - cam.y;
    if (Math.hypot(canvas.width / 2 - px, canvas.height / 2 - py) < player.size + 10) {
      if (p.type === 'mystery') openMysteryBox();
      else if (p.type === 'coin') coins += 5;
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
  // Sword swings
  swordSwings.forEach(s => {
    enemies.forEach((e, ei) => {
      let cam = getCameraOffset();
      let ex = e.x - cam.x, ey = e.y - cam.y;
      let dx = ex - canvas.width / 2, dy = ey - canvas.height / 2;
      let dist = Math.hypot(dx, dy);
      let angle = Math.atan2(dy, dx);
      if (dist < player.size + 25 && angle > s.a1 && angle < s.a2) {
        killEnemy(e, ei);
        player.score++;
        xp += 2;
      }
    });
  });
  // Lasers
  lasers.forEach(l => {
    enemies.forEach((e, ei) => {
      let cam = getCameraOffset();
      let ex = e.x - cam.x, ey = e.y - cam.y;
      if (Math.abs(ex - canvas.width / 2) < 10 && ey < canvas.height / 2 && ey > canvas.height / 2 - 300) {
        killEnemy(e, ei);
        player.score += 2;
        xp += 3;
      }
    });
  });
  // Powerups
  powerUps.forEach((p, pi) => {
    let cam = getCameraOffset();
    let px = p.x - cam.x, py = p.y - cam.y;
    if (Math.hypot(canvas.width / 2 - px, canvas.height / 2 - py) < player.size + 10) {
      if (p.type === 'mystery') openMysteryBox();
      // ...existing code...
      powerUps.splice(pi, 1);
    }
  });
  // ...existing code...
  checkAchievements();
}

// --- update() aanvullen ---
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
