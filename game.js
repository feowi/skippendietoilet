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
let player = { x: 100, y: 100, size: 50, speed: 5, health: 100, weapon: 1, armor: 0 };
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
let maps = [
  'https://i.imgur.com/yHoT8kZ.png',
  'https://i.imgur.com/qmd6CO5.jpeg',
  'https://i.imgur.com/QtQR6sF.jpeg'
];

// Shop items met prijzen en effecten
const shopItems = [
  { id: 'weapon', name: 'Wapen upgrade', price: 20, desc: 'Meer schade', apply() { player.weapon++; upgrades = 'Wapen Lv. ' + player.weapon; } },
  { id: 'armor', name: 'Armor upgrade', price: 15, desc: 'Minder schade', apply() { player.armor++; upgrades = 'Armor Lv. ' + player.armor; } },
  { id: 'healthBoost', name: 'Gezondheid boost', price: 25, desc: 'Herstelt 50 health', apply() { player.health = Math.min(100, player.health + 50); } },
  { id: 'speedBoost', name: 'Snelheid boost', price: 30, desc: 'Snelheid tijdelijk omhoog', apply() {
    player.speed = 10; powerUpActive = true; powerUpTimer = 300; upgrades = 'Snelheid!'; } }
];

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

// Functies
function createToilets(num) {
  toilets = [];
  for (let i = 0; i < num; i++) {
    toilets.push({
      x: Math.random() * (canvas.width - 50),
      y: Math.random() * (canvas.height - 50),
      size: 50,
      color: getRandomColor(),
      dir: Math.random() < 0.5 ? 1 : -1,
      speed: 0.8 + Math.random() * (1.0 + level * 0.1), // minder snel dan eerst
      health: 20 + level * 2
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

  // Houd player binnen canvas
  if (player.x < 0) player.x = 0;
  if (player.y < 0) player.y = 0;
  if (player.x > canvas.width - player.size) player.x = canvas.width - player.size;
  if (player.y > canvas.height - player.size) player.y = canvas.height - player.size;
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

function checkCollisions() {
  toilets.forEach(t => {
    if (rectsIntersect(player, t)) {
      // Minder schade door armor, en toiletten doen minder schade (halve schade tov eerst)
      let damage = Math.max(1, 10 - player.armor * 2); 
      player.health -= damage;
      spawnConfetti(player.x + player.size / 2, player.y + player.size / 2, '#e74c3c');
      if (soundOn) plopSound.play();
      shake = 8;

      if (player.health <= 0) {
        alert('Game Over! Je score: ' + score);
        resetGame();
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
  createToilets(3); // minder toiletten in het begin
  updateUI();
}

function updateUI() {
  scoreEl.textContent = 'Score: ' + score;
  levelEl.textContent = 'Level: ' + level;
  upgradesEl.textContent = 'Upgrades: ' + upgrades;
  healthText.textContent = player.health;
  healthFill.style.width = player.health + '%';
  updateHighscore();
}

// Shop UI vullen
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

// Main game loop
function gameLoop() {
  // Achtergrond
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Shake effect
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

  // PowerUp timer reset
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
resetGame();
gameLoop();
