
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
// ноги
const leftLeg = new PIXI.Graphics();
leftLeg.beginFill(0x00aa00);
leftLeg.drawRect(-12, 20, 6, 14);
leftLeg.endFill();
const rightLeg = new PIXI.Graphics();
rightLeg.beginFill(0x00aa00);
rightLeg.drawRect(6, 20, 6, 14);
rightLeg.endFill();
player.addChild(leftLeg);
player.addChild(rightLeg);
// руки
const leftArm = new PIXI.Graphics();
leftArm.beginFill(0x00aa00);
leftArm.drawRect(-26, -8, 8, 14);
leftArm.endFill();
const rightArm = new PIXI.Graphics();
rightArm.beginFill(0x00aa00);
rightArm.drawRect(18, -8, 8, 14);
rightArm.endFill();
player.addChild(leftArm);
player.addChild(rightArm);
// пистолет
const gunLength = 20;
const gun = new PIXI.Graphics();
gun.beginFill(0x777777);
gun.drawRect(0, -3, gunLength, 6);
gun.endFill();
gun.pivot.set(0, 0);
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
player.x = worldWidth / 2;
player.y = worldHeight / 2;
player.hp = 100;
world.addChild(player);

let target = { x: player.x, y: player.y };
let enemies = [];
let bullets = [];
const SHOOT_RADIUS = 300;
let squads = [];

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

    const bullet = new PIXI.Graphics();
    bullet.beginFill(0xffff00);
    bullet.drawCircle(0, 0, 5);
    bullet.endFill();
    bullet.x = player.x + Math.cos(player.gun.rotation) * player.gunLength;
    bullet.y = player.y + Math.sin(player.gun.rotation) * player.gunLength;
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

    enemy.hp = 10;
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
    return enemy;
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
    if (gameStarted && !gameOver && enemies.length < 200) spawnEnemyGroup();
}, 1500);

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
        player.gun.rotation = Math.atan2(nearest.y - player.y, nearest.x - player.x);
    }

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

    // Враги идут к игроку группами
    for (let squad of squads) {
        const sdx = player.x - squad.x;
        const sdy = player.y - squad.y;
        const sdist = Math.sqrt(sdx * sdx + sdy * sdy);
        if (sdist > 1) {
            const enemySpeed = 1.5;
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
    player.hp = 100;
    player.x = worldWidth / 2;
    player.y = worldHeight / 2;
    target = { x: player.x, y: player.y };
    player.hpBar.scale.x = 1;

    for (let e of enemies) world.removeChild(e);
    enemies = [];
    for (let b of bullets) world.removeChild(b);
    bullets = [];
    squads = [];

    spawnEnemyGroup();
}
