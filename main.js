
// === Инициализация PIXI ===
const app = new PIXI.Application({
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 0x1e1e1e
});
document.body.appendChild(app.view);

// === Переменные интерфейса ===
let gameStarted = false;
let gameOver = false;
let gamePaused = false;

// Апгрейды и счётчики
const upgrades = {
    level: 1,
    bulletCount: 1,
    bulletSpeed: 8,
    fireRate: 500, // мс между выстрелами
    damage: 10,
    maxHP: 100,
    secondPistol: false
};
let killCount = 0;
let coinCount = 0;

const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const endScreen = document.getElementById('end-screen');
const coinCounterEl = document.getElementById('coinCounter');
const upgradePopup = document.getElementById('upgrade-popup');
const upgradeButtons = document.getElementById('upgrade-buttons');

const allUpgrades = [
    { key: 'bulletCount', name: 'Количество пуль', desc: 'больше пуль за выстрел' },
    { key: 'bulletSpeed', name: 'Скорость пуль', desc: 'пули летят быстрее' },
    { key: 'fireRate', name: 'Скорострельность', desc: 'стрелять быстрее' },
    { key: 'damage', name: 'Урон', desc: 'больше урона' },
    { key: 'maxHP', name: 'Макс. здоровье', desc: '+10 к здоровью' },
    { key: 'secondPistol', name: 'Второй пистолет', desc: 'пистолет во второй руке' }
];

startBtn.onclick = () => {
    document.getElementById('ui').style.display = 'none';
    startGame();
};
restartBtn.onclick = () => {
    endScreen.style.display = 'none';
    startGame();
};

function showEndScreen() {
    gameOver = true;
    endScreen.style.display = 'block';
}

function showUpgradePopup() {
    gamePaused = true;
    upgradeButtons.innerHTML = '';
    const available = allUpgrades.filter(u => u.key !== 'secondPistol' || !upgrades.secondPistol);
    const opts = [];
    const count = Math.min(4, available.length);
    const arr = available.slice();
    for (let i = 0; i < count; i++) {
        const choice = arr.splice(Math.floor(Math.random() * arr.length), 1)[0];
        opts.push(choice);
    }
    for (let opt of opts) {
        const btn = document.createElement('button');
        btn.className = 'upgrade-btn';
        btn.innerHTML = `${opt.name}<br><small>${opt.desc}</small>`;
        btn.onclick = () => { applyUpgrade(opt.key); hideUpgradePopup(); };
        upgradeButtons.appendChild(btn);
    }
    upgradePopup.style.display = 'flex';
}

function hideUpgradePopup() {
    gamePaused = false;
    upgradePopup.style.display = 'none';
}

function applyUpgrade(key) {
    switch (key) {
        case 'bulletCount':
            upgrades.bulletCount = Math.min(3, upgrades.bulletCount + 1);
            break;
        case 'bulletSpeed':
            upgrades.bulletSpeed *= 1.15;
            break;
        case 'fireRate':
            upgrades.fireRate = Math.max(50, upgrades.fireRate * 0.9);
            break;
        case 'damage':
            upgrades.damage += 5;
            break;
        case 'maxHP':
            upgrades.maxHP += 10;
            player.hp += 10;
            break;
        case 'secondPistol':
            if (!upgrades.secondPistol) {
                upgrades.secondPistol = true;
                const gun2 = new PIXI.Graphics();
                gun2.beginFill(0x777777);
                gun2.drawRect(0, -3, player.gunLength, 6);
                gun2.endFill();
                gun2.position.set(-20, 0);
                player.addChild(gun2);
                player.leftGun = gun2;
            }
            break;
    }
}

// === Карта и игрок ===
const worldWidth = 3000;
const worldHeight = 3000;

const world = new PIXI.Container();
app.stage.addChild(world);

// Фон карты
const background = new PIXI.Graphics();
background.beginFill(0x555555);
background.drawRect(0, 0, worldWidth, worldHeight);
background.endFill();
world.addChild(background);
// сетка для лучшего ощущения движения
const grid = new PIXI.Graphics();
grid.lineStyle(1, 0x444444, 6);
for (let x = 0; x <= worldWidth; x += 10) {
    grid.moveTo(x, 0);
    grid.lineTo(x, worldHeight);
}
for (let y = 0; y <= worldHeight; y += 10) {
    grid.moveTo(0, y);
    grid.lineTo(worldWidth, y);
}
world.addChild(grid);
// видимая граница мира
const border = new PIXI.Graphics();
border.lineStyle(8, 0x222222);
border.drawRect(0, 0, worldWidth, worldHeight);
world.addChild(border);

const player = new PIXI.Container();
const playerBody = new PIXI.Graphics();
playerBody.beginFill(0x00ff00);
playerBody.drawCircle(0, 0, 20);
playerBody.endFill();
player.addChild(playerBody);
// ноги (круги)
const leftLeg = new PIXI.Graphics();
leftLeg.beginFill(0x00aa00);
leftLeg.drawCircle(-8, 24, 5);
leftLeg.endFill();
const rightLeg = new PIXI.Graphics();
rightLeg.beginFill(0x00aa00);
rightLeg.drawCircle(8, 24, 5);
rightLeg.endFill();
player.addChild(leftLeg);
player.addChild(rightLeg);
// руки (круги)
const leftArm = new PIXI.Graphics();
leftArm.beginFill(0x00aa00);
leftArm.drawCircle(-18, 0, 5);
leftArm.endFill();
const rightArm = new PIXI.Graphics();
rightArm.beginFill(0x00aa00);
rightArm.drawCircle(18, 0, 5);
rightArm.endFill();
player.addChild(leftArm);
player.addChild(rightArm);
// глаза игрока
const eye1 = new PIXI.Graphics();
eye1.beginFill(0xffffff);
eye1.drawCircle(-6, -6, 4);
eye1.endFill();
const eye2 = new PIXI.Graphics();
eye2.beginFill(0xffffff);
eye2.drawCircle(6, -6, 4);
eye2.endFill();
const pupil1 = new PIXI.Graphics();
pupil1.beginFill(0x000000);
pupil1.drawCircle(-6, -6, 2);
pupil1.endFill();
const pupil2 = new PIXI.Graphics();
pupil2.beginFill(0x000000);
pupil2.drawCircle(6, -6, 2);
pupil2.endFill();
player.addChild(eye1, eye2, pupil1, pupil2);
// пистолет
const gunLength = 20;
const gun = new PIXI.Graphics();
gun.beginFill(0x777777);
gun.drawRect(0, -3, gunLength, 6);
gun.endFill();
gun.pivot.set(0, 0);
gun.position.set(20, 0); // держим в руках
player.addChild(gun);
player.gun = gun;
player.gunLength = gunLength;
// полоска здоровья игрока
const playerBarBg = new PIXI.Graphics();
playerBarBg.beginFill(0x000000);
playerBarBg.drawRect(-20, -34, 40, 6);
playerBarBg.endFill();
const playerBar = new PIXI.Graphics();
playerBar.beginFill(0x00ff00);
playerBar.drawRect(-20, -34, 40, 6);
playerBar.endFill();
player.addChild(playerBarBg);
player.addChild(playerBar);
player.hpBar = playerBar;
const hpText = new PIXI.Text('100', {fontSize: 12, fill: 0xffffff});
hpText.anchor.set(0.5);
hpText.y = -38;
player.addChild(hpText);
player.hpText = hpText;
const levelText = new PIXI.Text('Lv 1', {fontSize: 12, fill: 0xffffff});
levelText.anchor.set(1, 0.5);
levelText.position.set(-24, -31);
player.addChild(levelText);
player.levelText = levelText;
player.x = worldWidth / 2;
player.y = worldHeight / 2;
player.hp = upgrades.maxHP;
world.addChild(player);

let target = { x: player.x, y: player.y };
let enemies = [];
let bullets = [];
let coins = [];
const SHOOT_RADIUS = 300;
let squads = [];
const playerSpeed = 0.9;
const enemySpeed = 0.2;

function shootBullet() {
    if (enemies.length === 0) return;
    // ищем ближайшего врага
    let nearest = enemies[0];
    let minDist = Infinity;
    for (let e of enemies) {
        const dx = e.x - player.x;
        const dy = e.y - player.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < minDist) { minDist = d; nearest = e; }
    }
    const dirX = nearest.x - player.x;
    const dirY = nearest.y - player.y;
    const dist = Math.sqrt(dirX * dirX + dirY * dirY);
    if (dist === 0 || dist > SHOOT_RADIUS) return;

    const guns = [player.gun];
    if (upgrades.secondPistol && player.leftGun) guns.push(player.leftGun);
    for (const g of guns) {
        const gunOffset = g.position.x + player.gunLength;
        for (let i = 0; i < upgrades.bulletCount; i++) {
            const bullet = new PIXI.Graphics();
            bullet.beginFill(0xffff00);
            bullet.drawCircle(0, 0, 5);
            bullet.endFill();
            const angle = g.rotation + (i - (upgrades.bulletCount - 1) / 2) * 0.2;
            bullet.x = player.x + Math.cos(angle) * gunOffset;
            bullet.y = player.y + Math.sin(angle) * gunOffset;
            const speed = upgrades.bulletSpeed;
            const bdx = Math.cos(angle);
            const bdy = Math.sin(angle);
            bullet.vx = bdx * speed;
            bullet.vy = bdy * speed;
            bullet.damage = upgrades.damage;
            world.addChild(bullet);
            bullets.push(bullet);
        }
    }
}

let lastShot = 0;

// === Спавн врагов ===
function createEnemy() {
    const enemy = new PIXI.Container();
    const body = new PIXI.Graphics();
    body.beginFill(0xff0000);
    body.drawCircle(0, 0, 18);
    body.endFill();
    enemy.addChild(body);
    // глаза
    const eye1 = new PIXI.Graphics();
    eye1.beginFill(0xffffff);
    eye1.drawCircle(-6, -6, 4);
    eye1.endFill();
    const eye2 = new PIXI.Graphics();
    eye2.beginFill(0xffffff);
    eye2.drawCircle(6, -6, 4);
    eye2.endFill();
    const pupil1 = new PIXI.Graphics();
    pupil1.beginFill(0x000000);
    pupil1.drawCircle(-6, -6, 2);
    pupil1.endFill();
    const pupil2 = new PIXI.Graphics();
    pupil2.beginFill(0x000000);
    pupil2.drawCircle(6, -6, 2);
    pupil2.endFill();
    enemy.addChild(eye1, eye2, pupil1, pupil2);
    // руки и ноги
    const leftArm = new PIXI.Graphics();
    leftArm.beginFill(0xaa0000);
    leftArm.drawRect(-26, -4, 8, 12);
    leftArm.endFill();
    const rightArm = new PIXI.Graphics();
    rightArm.beginFill(0xaa0000);
    rightArm.drawRect(18, -4, 8, 12);
    rightArm.endFill();
    const leftLeg = new PIXI.Graphics();
    leftLeg.beginFill(0xaa0000);
    leftLeg.drawRect(-12, 18, 6, 14);
    leftLeg.endFill();
    const rightLeg = new PIXI.Graphics();
    rightLeg.beginFill(0xaa0000);
    rightLeg.drawRect(6, 18, 6, 14);
    rightLeg.endFill();
    enemy.addChild(leftArm, rightArm, leftLeg, rightLeg);

    enemy.maxHP = 20;
    enemy.hp = enemy.maxHP;
    const barBg = new PIXI.Graphics();
    barBg.beginFill(0x000000);
    barBg.drawRect(-18, -30, 36, 4);
    barBg.endFill();
    const bar = new PIXI.Graphics();
    bar.beginFill(0xff0000);
    bar.drawRect(-18, -30, 36, 4);
    bar.endFill();
    enemy.addChild(barBg);
    enemy.addChild(bar);
    enemy.hpBar = bar;
    const hpText = new PIXI.Text(String(enemy.hp), {fontSize: 10, fill: 0xffffff});
    hpText.anchor.set(0.5);
    hpText.y = -32;
    enemy.addChild(hpText);
    enemy.hpText = hpText;
    return enemy;
}

function spawnCoin(x, y) {
    const coin = new PIXI.Graphics();
    coin.beginFill(0xffd700);
    coin.drawCircle(0, 0, 8);
    coin.endFill();
    coin.x = x;
    coin.y = y;
    world.addChild(coin);
    coins.push(coin);
}

function spawnEnemyGroup() {
    const count = Math.floor(Math.random() * 3) + 1;
    const side = Math.floor(Math.random() * 4);
    let x = 0, y = 0;
    if (side === 0) { x = Math.random() * worldWidth; y = 0; }
    else if (side === 1) { x = Math.random() * worldWidth; y = worldHeight; }
    else if (side === 2) { x = 0; y = Math.random() * worldHeight; }
    else { x = worldWidth; y = Math.random() * worldHeight; }
    const squad = { x, y, members: [] };
    for (let i = 0; i < count; i++) {
        const enemy = createEnemy();
        enemy.offsetX = (Math.random() - 0.5) * 40;
        enemy.offsetY = (Math.random() - 0.5) * 40;
        enemy.x = x + enemy.offsetX;
        enemy.y = y + enemy.offsetY;
        enemy.squad = squad;
        squad.members.push(enemy);
        world.addChild(enemy);
        enemies.push(enemy);
    }
    squads.push(squad);
}

setInterval(() => {
    if (gameStarted && !gameOver && !gamePaused && enemies.length < 200) spawnEnemyGroup();
}, 1500);

// === Управление ===
app.stage.interactive = true;
app.stage.on('pointerdown', (e) => {
    if (!gameStarted || gameOver) return;
    target = getWorldPos(e.data.global);
});
app.stage.on('pointermove', (e) => {
    if (!gameStarted || gameOver) return;
    target = getWorldPos(e.data.global);
});

function getWorldPos(screenPos) {
    return {
        x: screenPos.x - world.x,
        y: screenPos.y - world.y
    };
}

// === Основной цикл ===
app.ticker.add(() => {
    if (!gameStarted || gameOver || gamePaused) return;

    // авто-наведение пистолета на ближайшего зомби
    if (enemies.length > 0) {
        let nearest = enemies[0];
        let minDist = Infinity;
        for (let e of enemies) {
            const dx = e.x - player.x;
            const dy = e.y - player.y;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d < minDist) { minDist = d; nearest = e; }
        }
        const rot = Math.atan2(nearest.y - player.y, nearest.x - player.x);
        player.gun.rotation = rot;
        if (player.leftGun) player.leftGun.rotation = rot;
    }

    const now = performance.now();
    if (now - lastShot > upgrades.fireRate) {
        shootBullet();
        lastShot = now;
    }

    // Движение игрока
    const dx = target.x - player.x;
    const dy = target.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 1) {
        player.x += dx / dist * playerSpeed;
        player.y += dy / dist * playerSpeed;
    }

    // Обновляем полоску и текст здоровья игрока
    player.hpBar.scale.x = player.hp / upgrades.maxHP;
    player.hpText.text = Math.round(player.hp);
    player.levelText.text = `Lv ${upgrades.level}`;

    // Камера
    world.x = -player.x + app.screen.width / 2;
    world.y = -player.y + app.screen.height / 2;
    world.x = Math.min(0, Math.max(world.x, app.screen.width - worldWidth));
    world.y = Math.min(0, Math.max(world.y, app.screen.height - worldHeight));

    const padding = 100;
    const minX = -world.x - padding;
    const minY = -world.y - padding;
    const maxX = -world.x + app.screen.width + padding;
    const maxY = -world.y + app.screen.height + padding;

    // Пули
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.vx;
        b.y += b.vy;

        if (b.x < 0 || b.y < 0 || b.x > worldWidth || b.y > worldHeight) {
            world.removeChild(b);
            bullets.splice(i, 1);
            continue;
        }

        // столкновение с врагами
        for (let enemy of enemies) {
            const bdx = enemy.x - b.x;
            const bdy = enemy.y - b.y;
            if (Math.sqrt(bdx * bdx + bdy * bdy) < 20) {
                enemy.hp -= b.damage;
                enemy.hpBar.scale.x = Math.max(0, enemy.hp / enemy.maxHP);
                enemy.hpText.text = Math.max(0, Math.round(enemy.hp));
                world.removeChild(b);
                bullets.splice(i, 1);
                break;
            }
        }
    }

    // Монеты
    for (let i = coins.length - 1; i >= 0; i--) {
        const c = coins[i];
        const cdx = c.x - player.x;
        const cdy = c.y - player.y;
        if (Math.sqrt(cdx * cdx + cdy * cdy) < 25) {
            world.removeChild(c);
            coins.splice(i, 1);
            coinCount++;
            coinCounterEl.textContent = `Coins: ${coinCount}`;
        }
    }

    // Враги идут к игроку группами
    for (let squad of squads) {
        const sdx = player.x - squad.x;
        const sdy = player.y - squad.y;
        const sdist = Math.sqrt(sdx * sdx + sdy * sdy);
        if (sdist > 1) {
            squad.x += sdx / sdist * enemySpeed;
            squad.y += sdy / sdist * enemySpeed;
        }
        for (let enemy of squad.members) {
            enemy.x = squad.x + enemy.offsetX;
            enemy.y = squad.y + enemy.offsetY;
            enemy.visible = enemy.x > minX && enemy.x < maxX && enemy.y > minY && enemy.y < maxY;

            // Столкновение с игроком
            const pdx = enemy.x - player.x;
            const pdy = enemy.y - player.y;
            if (Math.sqrt(pdx * pdx + pdy * pdy) < 40) {
                const now = performance.now();
                if (!player.lastHit || now - player.lastHit > 500) {
                    player.hp -= 5;
                    player.lastHit = now;
                }
            }

            // смерть врага
            if (enemy.hp <= 0) {
                spawnCoin(enemy.x, enemy.y);
                killCount++;
                const newLevel = Math.min(100, Math.floor(killCount / 50) + 1);
                if (newLevel > upgrades.level && upgrades.level < 100) {
                    upgrades.level = newLevel;
                    showUpgradePopup();
                }
                world.removeChild(enemy);
                enemies.splice(enemies.indexOf(enemy), 1);
                squad.members.splice(squad.members.indexOf(enemy), 1);
            }
        }
    }
    squads = squads.filter(s => s.members.length > 0);

    if (player.hp <= 0) {
        showEndScreen();
    }
});

// === Начало игры ===
function startGame() {
    gameStarted = true;
    gameOver = false;
    gamePaused = false;
    upgrades.level = 1;
    upgrades.bulletCount = 1;
    upgrades.bulletSpeed = 8;
    upgrades.fireRate = 500;
    upgrades.damage = 10;
    upgrades.maxHP = 100;
    upgrades.secondPistol = false;
    killCount = 0;
    coinCount = 0;
    coinCounterEl.textContent = 'Coins: 0';
    upgradePopup.style.display = 'none';
    lastShot = 0;
    player.hp = upgrades.maxHP;
    if (player.leftGun) { player.removeChild(player.leftGun); player.leftGun = null; }
    player.x = worldWidth / 2;
    player.y = worldHeight / 2;
    target = { x: player.x, y: player.y };
    player.hpBar.scale.x = 1;
    player.hpText.text = upgrades.maxHP;
    player.levelText.text = `Lv ${upgrades.level}`;

    for (let e of enemies) world.removeChild(e);
    enemies = [];
    for (let b of bullets) world.removeChild(b);
    bullets = [];
    for (let c of coins) world.removeChild(c);
    coins = [];
    squads = [];

    spawnEnemyGroup();
}
