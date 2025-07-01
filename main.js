
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

const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const endScreen = document.getElementById('end-screen');

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

const player = new PIXI.Container();
const playerBody = new PIXI.Graphics();
playerBody.beginFill(0x00ff00);
playerBody.drawCircle(0, 0, 20);
playerBody.endFill();
player.addChild(playerBody);
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
player.x = worldWidth / 2;
player.y = worldHeight / 2;
player.hp = 100;
world.addChild(player);

let target = { x: player.x, y: player.y };
let enemies = [];
let bullets = [];

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
    if (dist === 0) return;

    const bullet = new PIXI.Graphics();
    bullet.beginFill(0xffff00);
    bullet.drawCircle(0, 0, 5);
    bullet.endFill();
    bullet.x = player.x;
    bullet.y = player.y;
    const speed = 8;
    bullet.vx = dirX / dist * speed;
    bullet.vy = dirY / dist * speed;
    bullet.target = nearest;
    world.addChild(bullet);
    bullets.push(bullet);
}

setInterval(() => {
    if (gameStarted && !gameOver) shootBullet();
}, 500);

// === Спавн врагов ===
function spawnEnemy() {
    const enemy = new PIXI.Container();
    const body = new PIXI.Graphics();
    body.beginFill(0xff0000);
    body.drawCircle(0, 0, 18);
    body.endFill();
    enemy.addChild(body);
    enemy.x = Math.random() * worldWidth;
    enemy.y = Math.random() * worldHeight;
    enemy.hp = 10;
    // полоска здоровья
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

    world.addChild(enemy);
    enemies.push(enemy);
}

setInterval(() => {
    if (gameStarted && !gameOver && enemies.length < 50) spawnEnemy();
}, 2000);

// === Управление ===
app.stage.interactive = true;
app.stage.on('pointerdown', (e) => {
    if (!gameStarted || gameOver) return;
    target = getWorldPos(e.data.global);
});
app.stage.on('pointermove', (e) => {
    if (!gameStarted || gameOver) return;
    if (e.data.buttons || e.data.originalEvent.touches) {
        target = getWorldPos(e.data.global);
    }
});

function getWorldPos(screenPos) {
    return {
        x: screenPos.x - world.x,
        y: screenPos.y - world.y
    };
}

// === Основной цикл ===
app.ticker.add(() => {
    if (!gameStarted || gameOver) return;

    // Движение игрока
    const dx = target.x - player.x;
    const dy = target.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const speed = 4;
    if (dist > 1) {
        player.x += dx / dist * speed;
        player.y += dy / dist * speed;
    }

    // Обновляем полоску здоровья игрока
    player.hpBar.scale.x = player.hp / 100;

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
                enemy.hp -= 10;
                enemy.hpBar.scale.x = Math.max(0, enemy.hp / 10);
                world.removeChild(b);
                bullets.splice(i, 1);
                break;
            }
        }
    }

    // Враги идут к игроку
    for (let enemy of enemies) {
        enemy.visible = enemy.x > minX && enemy.x < maxX && enemy.y > minY && enemy.y < maxY;

        const edx = player.x - enemy.x;
        const edy = player.y - enemy.y;
        const edist = Math.sqrt(edx * edx + edy * edy);
        if (edist > 1) {
            const enemySpeed = 1.5;
            enemy.x += edx / edist * enemySpeed;
            enemy.y += edy / edist * enemySpeed;
        }

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
            world.removeChild(enemy);
            enemies.splice(enemies.indexOf(enemy), 1);
        }
    }

    if (player.hp <= 0) {
        showEndScreen();
    }
});

// === Начало игры ===
function startGame() {
    gameStarted = true;
    gameOver = false;
    player.hp = 100;
    player.x = worldWidth / 2;
    player.y = worldHeight / 2;
    target = { x: player.x, y: player.y };
    player.hpBar.scale.x = 1;

    for (let e of enemies) world.removeChild(e);
    enemies = [];
    for (let b of bullets) world.removeChild(b);
    bullets = [];

    spawnEnemy();
}
