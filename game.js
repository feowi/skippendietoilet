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

// Geluiden
const plopSound = document.getElementById('plopSound');
const powerUpSound = document.getElementById('powerUpSound');
const bossSound = document.getElementById('bossSound');

let soundOn = true;

// Afbeeldingen
const playerImg = new Image();
playerImg.src = 'https://cdn-icons-png.flaticon.com/512/1946/1946488.png';
const toiletImg = new Image();
toiletImg.src = 'https://cdn-icons-png.flaticon.com/512/1048/1048953.png';
const bossImg = new Image();
bossImg.src = 'https://cdn-icons-png.flaticon.com/512/616/616408.png';

// Variabelen
let player = { x: 100, y: 100, size: 50, speed: 5, health: 100, weapon: 1, armor: 0, coins: 0 };
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
let shopItems = [
  { name: 'Sneller', price: 100, desc: 'Verhoogt snelheid', apply: () => { player.speed += 2; upgrades = 'Sneller'; } },
  { name: 'Wapen Upgrade', price: 200, desc: 'Verhoogt wapen damage', apply: () => { player.weapon += 1; upgrades = 'Wapen Upgrade'; } }
];

let regenCost = 0; // Beginprijs gratis

shopItems.push(
  {
    name: 'Gezonde regeneratie',
    price: regenCost,
    desc: 'Regeneert 1 HP per seconde. Prijs stijgt elke keer.',
    apply: () => {
      player.hasRegen = true;
      upgrades = 'Gezonde regeneratie';
      regenCost = regenCost === 0 ? 50 : regenCost + 50; // na gratis eerst 50 dan steeds duurder
      // Update de prijs in shop
      shopItems.find(i => i.name === 'Gezonde regeneratie').price = regenCost;
    }
  },
  {
    name: 'Snellere score',
    price: 150,
    desc: 'Verdubbelt score per toilet',
    apply: () => {
      player.scoreMultiplier = 2;
      upgrades = 'Snellere score';
    }
  },
  {
    name: 'Extra health bar',
    price: 300,
    desc: 'Verhoogt maximale health naar 150',
    apply: () => {
      player.maxHealth = 150;
      if (player.health > 150) player.health = 150;
      upgrades = 'Extra health bar';
    }
  },
  {
    name: 'Wapen upgrade +',
    price: 400,
    desc: 'Nog meer wapendamage',
    apply: () => {
      player.weapon += 2;
      upgrades = 'Wapen upgrade +';
    }
  }
);

// Event listeners
document.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
document.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

shopBtn.addEventListener('click', () => {
  fillShop();
  shopModal.classList.add('visible');
  shopModal.classList.remove('hidden');
});
closeShopBtn.addEventListener('click', () => {
  shopModal.classList.add('hidden');
  shopModal.classList.remove('visible');
});

settingsBtn.addEventListener('click', () => {
  settingsModal.classList.add('visible');
  settingsModal.classList.remove('hidden');
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

function createPowerUp() {
  powerUps.push({
    x: Math.random() * (canvas.width - 30),
    y: Math.random() * (canvas.height - 30),
    size: 30,
    type: Math.random() < 0.5 ? 'speed' : 'score'
  });
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
  toilets.forEach((t, i) => {
    if (rectsIntersect(player, t)) {
      if (now - lastDamageTime > 500) {
        player.health -= 15;
        t.health -= 15;

        if (t.health <= 0) {
          score += 10;
          spawnConfetti(t.x + t.size/2, t.y + t.size/2, '#06d6a0');
          toilets.splice(i, 1);
          createToilets(1);
          if (soundOn) plopSound.play();
        } else {
          spawnConfetti(player.x + player.size/2, player.y + player.size/2, '#e74c3c');
          if (soundOn) powerUpSound.play();
        }

        lastDamageTime = now;
        shake = 8;
        updateUI();
        
        // Health regeneratie (indien actief)
if (player.hasRegen && player.health < (player.maxHealth || 100)) {
  if (!player.regenTimer) player.regenTimer = 60; // 60 frames ~ 1 seconde
  player.regenTimer--;
  if (player.regenTimer <= 0) {
    player.health = Math.min(player.health + 1, player.maxHealth || 100);
    player.regenTimer = 60;
  }
}

        if (player.health <= 0) {
          resetGameWithPopup();
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
  for (let i = confettiParticles.length - 1; i >= 0; i--) {
    const p = confettiParticles[i];
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.alpha;
    ctx.fillRect(p.x, p.y, p.size, p.size);
    p.x += p.speedX;
    p.y += p.speedY;
    p.alpha -= 0.03;
    if (p.alpha <= 0) confettiParticles.splice(i, 1);
  }
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
}

function fillShop() {
  shopItemsList.innerHTML = '';
  shopItems.forEach(item => {
    const li = document.createElement('li');
    li.textContent = `${item.name} (${item.price} punten) - ${item.desc}`;
    li.style.cursor = 'pointer';
    li.addEventListener('click', () => {
      if (score >= item.price) {
        score -= item.price;
        item.apply();
        updateUI();
        if (soundOn) powerUpSound.play();
        alert(`Je hebt ${item.name} gekocht!`);
        shopModal.classList.remove('visible');
        shopModal.classList.add('hidden');
      } else {
        alert('Niet genoeg punten!');
      }
    });
    shopItemsList.appendChild(li);
  });
}

function showDeathPopup() {
  const popup = document.getElementById('death-popup');
  popup.style.display = 'block';
  return new Promise(resolve => {
    const okBtn = document.getElementById('death-ok-btn');
    function onOk() {
      okBtn.removeEventListener('click', onOk);
      popup.style.display = 'none';
      resolve();
    }
    okBtn.addEventListener('click', onOk);
  });
}

async function resetGameWithPopup() {
  await showDeathPopup();
  if (lastSide === 'left') {
    player.x = 20;
    player.y = canvas.height / 2;
  } else if (lastSide === 'right') {
    player.x = canvas.width - 70;
    player.y = canvas.height / 2;
  } else if (lastSide === 'top') {
    player.x = canvas.width / 2;
    player.y = 20;
  } else if (lastSide === 'bottom') {
    player.x = canvas.width / 2;
    player.y = canvas.height - 70;
  }
  player.health = 100;
  score = 0;
  level = 1;
  toilets = [];
  createToilets(5);
  updateUI();
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (shake > 0) {
    const dx = (Math.random() - 0.5) * shake;
    const dy = (Math.random() - 0.5) * shake;
    ctx.save();
    ctx.translate(dx, dy);
    shake--;
  }

  movePlayer();
  updateToilets();
  drawToilets();
  drawPlayer();
  drawConfetti();
  checkCollisions();

  if (powerUpActive) {
    powerUpTimer--;
    if (powerUpTimer <= 0) {
      powerUpActive = false;
      player.speed = 5;
      upgrades = 'Geen';
      updateUI();
    }
  }

  if (shake > 0) ctx.restore();

  updateUI();
  requestAnimationFrame(gameLoop);
}

// Start
function resetGame() {
  player.x = 100;
  player.y = 100;
  player.health = 100;
  player.speed = 5;
  player.weapon = 1;
  player.armor = 0;
  score = 0;
  level = 1;
  upgrades = 'Geen';
  toilets = [];
  powerUps = [];
  confettiParticles = [];
  createToilets(3);
  updateUI();
}

resetGame();
player.hasRegen = false;
player.scoreMultiplier = 1;
player.maxHealth = 100;
gameLoop();
