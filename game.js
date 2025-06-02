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

updateShopUI();


function showTopNotification(msg) {
  const notif = document.getElementById('top-notification');
  notif.textContent = msg;
  notif.style.opacity = '1';
  notif.style.pointerEvents = 'auto';
  
  setTimeout(() => {
    notif.style.opacity = '0';
    notif.style.pointerEvents = 'none';
  }, 10000); // verdwijnt na 10 seconden
}

function updateShopUI() {
  const itemsContainer = document.getElementById('shop-items');
  const boostsContainer = document.getElementById('shop-boosts');
  itemsContainer.innerHTML = '';
  boostsContainer.innerHTML = '';

  for (const key in shopItems) {
    const item = shopItems[key];

    // Maak knop voor elk item
    const btn = document.createElement('button');
    btn.textContent = `${item.name} - Prijs: ${item.price} coins - Gekocht: ${item.count}`;
    btn.style.margin = '8px';
    btn.style.padding = '10px 20px';
    btn.style.borderRadius = '10px';
    btn.style.fontWeight = '600';
    btn.style.cursor = 'pointer';
    
    // Grijs maken als boost in cooldown of geen geld
    if (item.isBoost && item.cooldown) {
      btn.disabled = true;
      btn.textContent += ' (Cooldown...)';
      btn.style.opacity = '0.5';
      btn.style.cursor = 'not-allowed';
    } else if (player.coins < item.price) {
      btn.disabled = true;
      btn.style.opacity = '0.5';
      btn.style.cursor = 'not-allowed';
    } else {
      btn.disabled = false;
      btn.style.opacity = '1';
    }

    btn.onclick = () => buyItem(key);

    // Voeg toe aan boost of normale items container
    if (item.isBoost) {
      boostsContainer.appendChild(btn);
    } else {
      itemsContainer.appendChild(btn);
    }
  }
}


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

// Pas createToilets aan om health te fixen:
function createToilets(num) {
  toilets = toilets.concat([]);
  for (let i = 0; i < num; i++) {
    toilets.push({
      x: Math.random() * (canvas.width - 50),
      y: Math.random() * (canvas.height - 50),
      size: 50,
      color: getRandomColor(),
      dir: Math.random() < 0.5 ? 1 : -1,
      speed: 0.8 + Math.random() * (1.0 + level * 0.1),
      health: 5 + level * 2  // begin 5 health en beetje groei per level
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

// Bijvoorbeeld detecteer links/rechts kant van het canvas:
if(player.x < canvas.width / 3) lastSide = 'left';
else if(player.x > canvas.width * 2 / 3) lastSide = 'right';
else if(player.y < canvas.height / 3) lastSide = 'top';
else if(player.y > canvas.height * 2 / 3) lastSide = 'bottom';

// Functie om popup te tonen en wachten op ok
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

// Pas resetGame aan om popup te gebruiken en daarna speler te verplaatsen naar laatste kant
async function resetGame() {
  await showDeathPopup();
  
  // Hier verplaats speler naar lastSide (voorbeeld: left/right/top/bottom)
  if(lastSide === 'left') {
    player.x = 20;
    player.y = canvas.height / 2;
  } else if(lastSide === 'right') {
    player.x = canvas.width - 70;
    player.y = canvas.height / 2;
  } else if(lastSide === 'top') {
    player.x = canvas.width / 2;
    player.y = 20;
  } else if(lastSide === 'bottom') {
    player.x = canvas.width / 2;
    player.y = canvas.height - 70;
  }
  
  // Reset andere speler stats
  player.health = 100;
  score = 0;
  level = 1;
  toilets = [];
  createToilets(5);
  updateUI();
}

// Damage cooldown fix (zorgt dat toilet schade cooldown werkt)
let lastDamageTime = 0;

function checkCollisions() {
  const now = Date.now();
  toilets.forEach(t => {
    if (rectsIntersect(player, t)) {
      if (now - lastDamageTime > 500) {  // cooldown van 500 ms
        player.health -= 15;  // damage value player neemt op zich

        // Schade aan toilet
        t.health -= 15;  // player damage op toilet
        
        if (t.health <= 0) {
          score += 10;
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
          resetGame();
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

function showTopNotification(msg) {
  const notif = document.getElementById('top-notification');
  notif.textContent = msg;
  notif.style.opacity = '1';
  notif.style.pointerEvents = 'auto';
  
  setTimeout(() => {
    notif.style.opacity = '0';
    notif.style.pointerEvents = 'none';
  }, 3000); // verdwijnt na 3 seconden
}


// Start
resetGame();
gameLoop();

