
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

const player = new PIXI.Graphics();
player.beginFill(0x00ff00);
player.drawCircle(0, 0, 20);
player.endFill();
player.x = worldWidth / 2;
player.y = worldHeight / 2;
player.hp = 100;
world.addChild(player);

let target = { x: player.x, y: player.y };
let enemies = [];

// === Спавн врагов ===
function spawnEnemy() {
    const enemy = new PIXI.Graphics();
    enemy.beginFill(0xff0000);
    enemy.drawCircle(0, 0, 18);
    enemy.endFill();
    enemy.x = Math.random() * worldWidth;
    enemy.y = Math.random() * worldHeight;
    enemy.hp = 10;
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

    // Камера
    world.x = -player.x + app.screen.width / 2;
    world.y = -player.y + app.screen.height / 2;
    world.x = Math.min(0, Math.max(world.x, app.screen.width - worldWidth));
    world.y = Math.min(0, Math.max(world.y, app.screen.height - worldHeight));

    // Враги идут к игроку
    for (let enemy of enemies) {
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
            player.hp -= 0.1;
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

    for (let e of enemies) world.removeChild(e);
    enemies = [];

    spawnEnemy();
}
