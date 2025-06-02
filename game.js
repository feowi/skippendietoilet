// Canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// UI elementen
const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');
const upgradesEl = document.getElementById('upgrades');
const healthFill = document.getElementById('health-fill');
const healthText = document.getElementById('health-text');
const highscoreEl = document.getElementById('highscore');
const shopBtn = document.getElementById('shop-btn');
const settingsBtn = document.getElementById('settings-btn');
const shopModal = document.getElementById('shop');
const settingsModal = document.getElementById('settings');
const shopItemsList = document.getElementById('shop-items');
const closeShopBtn = document.getElementById('close-shop');
const closeSettingsBtn = document.getElementById('close-settings');
const toggleSoundCheckbox = document.getElementById('toggle-sound');
const gameMessage = document.getElementById('game-message');
const coinsEl = document.getElementById('coins'); // extra coins display

// Geluiden
const plopSound = document.getElementById('plopSound');
const powerUpSound = document.getElementById('powerUpSound');
const bossSound = document.getElementById('bossSound');

let soundOn = true;
let deathMessageTimeout = null;

// Afbeeldingen
const playerImg = new Image();
playerImg.src = 'https://cdn-icons-png.flaticon.com/512/1946/1946488.png';
const toiletImg = new Image();
toiletImg.src = 'https://cdn-icons-png.flaticon.com/512/1048/1048953.png';
const bossImg = new Image();
bossImg.src = 'https://cdn-icons-png.flaticon.com/512/616/616408.png';

// Variabelen
let player = { 
  x: 100, y: 100, size: 50, speed: 5, health: 100, maxHealth: 100,
  weapon: 1, armor: 0, coins: 500, hasRegen: false, regenTimer: 60, scoreMultiplier: 1
};
let toilets = [];
let powerUps = [];
let score = 0;
let level = 1;
let upgrades = 'Geen';
let shake = 0;
let powerUpActive = false;
let powerUpTimer = 0;
let highscore = localStorage.getItem('highscore') || 0;
let keys = {};
let confettiParticles = [];
let lastSide = 'left';
let regenUpgradeCount = 0; // voor prijsverhoging

// Shop items met dynamische prijs bij Health Regen
let shopItems = [
  { 
    name: 'Sneller', 
    basePrice: 100, 
    desc: 'Verhoogt snelheid', 
    apply: () => { player.speed += 2; upgrades = 'Sneller'; } 
  },
  { 
    name: 'Wapen Upgrade', 
    basePrice: 200, 
    desc: 'Verhoogt wapen damage', 
    apply: () => { player.weapon += 1; upgrades = 'Wapen Upgrade'; } 
  },
  { 
    name: 'Health Regen', 
    basePrice: 0,  // eerste keer gratis
    desc: 'Gezondheid regeneratie', 
    apply: () => { 
      player.hasRegen = true; 
      upgrades = 'Health Regen'; 
      regenUpgradeCount++;
    },
    getPrice: () => regenUpgradeCount === 0 ? 0 : 50 * regenUpgradeCount
  },
  { 
    name: 'Score Booster', 
    basePrice: 150, 
    desc: 'Verdubbelt score punten', 
    apply: () => { 
      player.scoreMultiplier = 2; 
      upgrades = 'Score Booster'; 
    } 
  }
];

// Event listeners
document.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
document.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

shopBtn.addEventListener('click', () => {
  fillShop();
  shopModal.classList.add('visible');
  shopModal.classList.remove('hidden');
  // Zorg dat settings dicht is
  settingsModal.classList.remove('visible');
  settingsModal.classList.add('hidden');
});

closeShopBtn.addEventListener('click', () => {
  shopModal.classList.add('hidden');
  shopModal.classList.remove('visible');
});

settingsBtn.addEventListener('click', () => {
  settingsModal.classList.add('visible');
  settingsModal.classList.remove('hidden');
  // Zorg dat shop dicht is
  shopModal.classList.remove('visible');
  shopModal.classList.add('hidden');
});

closeSettingsBtn.addEventListener('click', () => {
  settingsModal.classList.add('hidden');
  settingsModal.classList.remove('visible');
});

toggleSoundCheckbox.addEventListener('change', e => {
  soundOn = e.target.checked;
});

function createToilets(num) {
  for (let i = 0; i < num; i++) {
    toilets.push({
      x: Math.random() * (canvas.width - 50),
      y: Math.random() * (canvas.height - 50),
      size: 50,
      color: getRandomColor(),
      dir: Math.random() < 0.5 ? 1 : -1,
      speed: 0.8 + Math.random() * (1.0 + level * 0.1),
      health: 5 + level * 2
    });
  }
}

function getRandomColor() {
  const colors = ['#ffb703', '#fb8500', '#ff006e', '#8338ec', '#3a86ff', '#06d6a0', '#118ab2'];
  return colors[Math.floor(Math.random() * colors.length)];
}

function movePlayer() {
  if (keys['arrowup'] || keys['w']) player.y -= player.speed;
  if (keys['arrowdown'] || keys['s']) player.y += player.speed;
  if (keys['arrowleft'] || keys['a']) player.x -= player.speed;
  if (keys['arrowright'] || keys['d']) player.x += player.speed;

  if (player.x < 0) player.x = 0;
  if (player.y < 0) player.y = 0;
  if (player.x > canvas.width - player.size) player.x = canvas.width - player.size;
  if (player.y > canvas.height - player.size) player.y = canvas.height - player.size;

  if (player.x < canvas.width / 3) lastSide = 'left';
  else if (player.x > canvas.width * 2 / 3) lastSide = 'right';
  else if (player.y < canvas.height / 3) lastSide = 'top';
  else if (player.y > canvas.height * 2 / 3) lastSide = 'bottom';
}

function drawPlayer() {
  ctx.drawImage(playerImg, player.x, player.y, player.size, player.size);
}

function drawToilets() {
  toilets.forEach(t => {
    ctx.drawImage(toiletImg, t.x, t.y, t.size, t.size);
  });
}

function updateToilets() {
  toilets.forEach(t => {
    t.x += t.speed * t.dir;
    if (t.x < 0 || t.x > canvas.width - t.size) t.dir *= -1;
  });
}

let lastDamageTime = 0;
function checkCollisions() {
  const now = Date.now();
  toilets.forEach(t => {
    if (rectsIntersect(player, t)) {
      if (now - lastDamageTime > 500) {
        player.health -= 15;
        t.health -= 15;

        if (t.health <= 0) {
          score += 10 * (player.scoreMultiplier || 1);
          player.coins += 10; // Verdien coins bij kill
          spawnConfetti(t.x + t.size/2, t.y + t.size/2, '#06d6a0');
          toilets.splice(toilets.indexOf(t), 1);
          createToilets(1);
          if (soundOn) plopSound.play();
        } else {
          spawnConfetti(player.x + player.size/2, player.y + player.size/2, '#e74c3c');
          if (soundOn) powerUpSound.play();
        }

        lastDamageTime = now;
        shake = 8;
        updateUI();

        if (player.health <= 0) {
          resetGameWithMessage();
          player.health = 0;
        }
      }
    }
  });
}

function rectsIntersect(a, b) {
  return !(b.x > a.x + a.size ||
           b.x + b.size < a.x ||
           b.y > a.y + a.size ||
           b.y + b.size < a.y);
}

function spawnConfetti(x, y, color) {
  for (let i = 0; i < 15; i++) {
    confettiParticles.push({
      x,
      y,
      size: 5,
      color,
      speedX: (Math.random() - 0.5) * 5,
      speedY: (Math.random() - 0.5) * 5,
      alpha: 1
    });
  }
}

function drawConfetti() {
  confettiParticles.forEach((p, i) => {
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.alpha;
    ctx.fillRect(p.x, p.y, p.size, p.size);
    p.x += p.speedX;
    p.y += p.speedY;
    p.alpha -= 0.03;
    if (p.alpha <= 0) confettiParticles.splice(i, 1);
  });
  ctx.globalAlpha = 1;
}

function updateHighscore() {
  if (score > highscore) {
    highscore = score;
    localStorage.setItem('highscore', highscore);
  }
  highscoreEl.textContent = 'Highscore: ' + highscore;
}

function updateUI() {
  scoreEl.textContent = 'Score: ' + score;
  levelEl.textContent = 'Level: ' + level;
  upgradesEl.textContent = 'Upgrades: ' + upgrades;
  healthText.textContent = player.health;
  healthFill.style.width = player.health + '%';
  updateHighscore();
  coinsEl.textContent = `Coins: ${player.coins}`;
}

function fillShop() {
  shopItemsList.innerHTML = '';
  shopItems.forEach(item => {
    let price = item.basePrice;
    if (item.name === 'Health Regen') {
      price = item.getPrice();
    }
    let li = document.createElement('li');
    li.textContent = `${item.name} - €${price} (${item.desc})`;
    let btn = document.createElement('button');
    btn.textContent = 'Koop';
    btn.disabled = player.coins < price;
    btn.addEventListener('click', () => buyUpgrade(item, price));
    li.appendChild(btn);
    shopItemsList.appendChild(li);
  });
}

function buyUpgrade(item, price) {
  if (player.coins < price) return;
  player.coins -= price;
  item.apply();
  updateUI();
  fillShop();
  if (soundOn) powerUpSound.play();
}

function resetGameWithMessage() {
  showGameMessage('Je bent dood! Het spel wordt herstart...', 3000);
  setTimeout(() => {
    player.x = canvas.width / 2 - player.size / 2;
    player.y = canvas.height / 2 - player.size / 2;
    player.health = player.maxHealth;
    score = 0;
    level = 1;
    toilets = [];
    createToilets(5);
    upgrades = 'Geen';
    regenUpgradeCount = 0;
    player.hasRegen = false;
    player.scoreMultiplier = 1;
    player.speed = 5;
    player.weapon = 1;
    updateUI();
    clearGameMessage();
  }, 3000);
}

function showGameMessage(text, duration) {
  if (deathMessageTimeout) clearTimeout(deathMessageTimeout);
  gameMessage.textContent = text;
  gameMessage.style.display = 'block';
  if (duration) {
    deathMessageTimeout = setTimeout(() => {
      gameMessage.style.display = 'none';
    }, duration);
  }
}

function clearGameMessage() {
  gameMessage.style.display = 'none';
  if (deathMessageTimeout) clearTimeout(deathMessageTimeout);
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  movePlayer();
  updateToilets();
  checkCollisions();

  // Health regeneratie (indien actief)
  if (player.hasRegen && player.health < player.maxHealth) {
    if (!player.regenTimer) player.regenTimer = 60;
    player.regenTimer--;
    if (player.regenTimer <= 0) {
      player.health = Math.min(player.health + 1, player.maxHealth);
      player.regenTimer = 60;
    }
  }

  drawPlayer();
  drawToilets();
  drawConfetti();

  if (shake > 0) {
    shake--;
  }

  updateUI();
  requestAnimationFrame(gameLoop);
}

function resetGame() {
  player = { 
    x: canvas.width / 2 - 25, y: canvas.height / 2 - 25, size: 50, speed: 5, health: 100, maxHealth: 100,
    weapon: 1, armor: 0, coins: 500, hasRegen: false, regenTimer: 60, scoreMultiplier: 1
  };
  score = 0;
  level = 1;
  toilets = [];
  createToilets(5);
  upgrades = 'Geen';
  regenUpgradeCount = 0;
  updateUI();
  clearGameMessage();
}

resetGame();
gameLoop();
