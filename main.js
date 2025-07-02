// === Инициализация PIXI ===
const app = new PIXI.Application({
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 0x1e1e1e,
    antialias: true,
});
document.body.appendChild(app.view);

// === Константы и конфигурация ===
const CONFIG = {
    WORLD_WIDTH: 3000,
    WORLD_HEIGHT: 3000,
    PLAYER_SPEED: 4,
    PLAYER_HEALTH: 100,
    ENEMY_SPEED: 1.8,
    ENEMY_HEALTH: 10,
    BULLET_SPEED: 8,
    MAX_ENEMIES_BASE: 10,
    ENEMIES_PER_SCORE_TIER: 5,
};

// === Переменные состояния игры ===
let player, world, backgroundGrid;
let enemies = [];
let bullets = [];
let score = 0;
let time = 0; // Переменная для анимаций, основанных на времени
let gameIsOver = true;

// === Элементы интерфейса ===
const hud = document.getElementById('hud');
const scoreDisplay = document.getElementById('score');
const healthBar = document.getElementById('health-bar');
const startScreen = document.getElementById('start-screen');
const endScreen = document.getElementById('end-screen');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const finalScoreDisplay = document.getElementById('final-score');

// === Классы ===

// Базовый класс для всех живых существ с анимацией ног
class Creature extends PIXI.Graphics {
    constructor() {
        super();
        this.legs = new PIXI.Graphics();
        this.addChild(this.legs);
        this.legAnimationPhase = Math.random() * Math.PI * 2;
    }

    animateLegs(speed) {
        this.legs.clear();
        this.legs.beginFill(0x555555);
        const legOffset = Math.sin(time * 0.2 + this.legAnimationPhase) * 5;
        this.legs.drawCircle(-10, 15, 4 + legOffset * 0.5);
        this.legs.drawCircle(10, 15, 4 - legOffset * 0.5);
        this.legs.drawCircle(-10, -15, 4 - legOffset * 0.5);
        this.legs.drawCircle(10, -15, 4 + legOffset * 0.5);
        this.legs.endFill();
    }
}


class Player extends Creature {
    constructor() {
        super();
        this.body = new PIXI.Graphics();
        this.gun = new PIXI.Graphics();
        this.addChild(this.body, this.gun);

        this.drawBody();
        this.drawGun();
        
        this.x = CONFIG.WORLD_WIDTH / 2;
        this.y = CONFIG.WORLD_HEIGHT / 2;
        this.hp = CONFIG.PLAYER_HEALTH;
        this.maxHp = CONFIG.PLAYER_HEALTH;
        this.recoil = 0;
    }

    drawBody() {
        this.body.clear();
        this.body.beginFill(0x00ff00);
        this.body.drawCircle(0, 0, 20);
        this.body.endFill();
    }

    drawGun() {
        this.gun.clear();
        this.gun.beginFill(0x888888);
        // Отдача отодвигает ствол назад
        this.gun.drawRect(15 - this.recoil, -5, 20, 10);
        this.gun.endFill();
    }

    update() {
        // Анимация отдачи
        if (this.recoil > 0) {
            this.recoil -= 1;
            this.drawGun();
        }
        // Анимация ног
        this.animateLegs();
    }

    takeDamage(amount) {
        this.hp -= amount;
        healthBar.style.width = `${Math.max(0, this.hp / this.maxHp * 100)}%`;
        showDamageFlash();
        if (this.hp <= 0) {
            endGame();
        }
    }
    
    shoot() {
        const worldMousePos = app.renderer.plugins.interaction.mouse.getLocalPosition(world);
        const bullet = new Bullet(this.x, this.y, worldMousePos);
        bullets.push(bullet);
        world.addChild(bullet);
        this.recoil = 10; // Запускаем анимацию отдачи
    }
}

class Enemy extends Creature {
    constructor() {
        super();
        const edge = Math.floor(Math.random() * 4);
        const spawnX = Math.random() * CONFIG.WORLD_WIDTH;
        const spawnY = Math.random() * CONFIG.WORLD_HEIGHT;
        
        this.x = spawnX;
        this.y = spawnY;
        this.hp = CONFIG.ENEMY_HEALTH;
        this.animationOffset = Math.random() * 100; // Для уникальной анимации каждого врага
    }

    update() {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 1) {
            this.x += dx / dist * CONFIG.ENEMY_SPEED;
            this.y += dy / dist * CONFIG.ENEMY_SPEED;
        }

        // Анимация "дыхания"
        const scale = 1 + Math.sin(time * 0.1 + this.animationOffset) * 0.05;
        this.scale.set(scale);

        this.draw();
        this.animateLegs();
    }
    
    draw() {
        this.clear(); // Очищаем старую графику
        this.beginFill(0xff0000);
        this.drawCircle(0, 0, 18);
        this.endFill();
    }
}

class Bullet extends PIXI.Graphics {
    constructor(startX, startY, targetPos) {
        super();
        this.beginFill(0xffff00);
        this.drawCircle(0, 0, 8);
        this.endFill();
        this.x = startX;
        this.y = startY;

        const dx = targetPos.x - startX;
        const dy = targetPos.y - startY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        this.vx = (dx / dist) * CONFIG.BULLET_SPEED;
        this.vy = (dy / dist) * CONFIG.BULLET_SPEED;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
    }
}

// === Функции игры (остаются без изменений, кроме ticker) ===

function createBackgroundGrid() {
    const grid = new PIXI.Graphics();
    grid.lineStyle(1, 0x333333, 1);
    for (let i = 0; i < CONFIG.WORLD_WIDTH; i += 50) {
        grid.moveTo(i, 0);
        grid.lineTo(i, CONFIG.WORLD_HEIGHT);
    }
    for (let i = 0; i < CONFIG.WORLD_HEIGHT; i += 50) {
        grid.moveTo(0, i);
        grid.lineTo(CONFIG.WORLD_WIDTH, i);
    }
    return grid;
}

function startGame() {
    gameIsOver = false;
    score = 0;
    time = 0;
    
    enemies.forEach(e => world.removeChild(e));
    bullets.forEach(b => world.removeChild(b));
    enemies = [];
    bullets = [];

    if (player) world.removeChild(player);
    player = new Player();
    world.addChild(player);
    
    updateScore(0);
    healthBar.style.width = '100%';

    startScreen.classList.add('hidden');
    endScreen.classList.add('hidden');
    hud.classList.remove('hidden');
}

function endGame() {
    gameIsOver = true;
    hud.classList.add('hidden');
    endScreen.classList.remove('hidden');
    finalScoreDisplay.textContent = `Ваш счет: ${score}`;
}

function spawnEnemy() {
    const maxEnemies = CONFIG.MAX_ENEMIES_BASE + Math.floor(score / 100) * CONFIG.ENEMIES_PER_SCORE_TIER;
    if (enemies.length < maxEnemies) {
        const enemy = new Enemy();
        world.addChild(enemy);
        enemies.push(enemy);
    }
}

function updateScore(points) {
    score += points;
    scoreDisplay.textContent = `Счет: ${score}`;
}

function showDamageFlash() {
    const flash = document.createElement('div');
    flash.className = 'damage-flash';
    document.body.appendChild(flash);
    setTimeout(() => document.body.removeChild(flash), 200);
}

// === Основной игровой цикл ===
app.ticker.add((delta) => {
    if (gameIsOver) return;
    
    time += delta; // Обновляем глобальное время для анимаций

    // --- Обновление объектов ---
    player.update();
    enemies.forEach(enemy => enemy.update());
    bullets.forEach(bullet => bullet.update());

    // --- Проверка столкновений ---
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        let bulletHit = false;
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            const dx = bullet.x - enemy.x;
            const dy = bullet.y - enemy.y;
            if (dx * dx + dy * dy < (18 * enemy.scale.x + 8) * (18 * enemy.scale.x + 8)) {
                world.removeChild(enemy);
                enemies.splice(j, 1);
                bulletHit = true;
                updateScore(10);
                break;
            }
        }
        if (bulletHit || bullet.x < 0 || bullet.x > CONFIG.WORLD_WIDTH || bullet.y < 0 || bullet.y > CONFIG.WORLD_HEIGHT) {
            world.removeChild(bullet);
            bullets.splice(i, 1);
        }
    }

    for (let enemy of enemies) {
        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        if (dx * dx + dy * dy < (20 + 18 * enemy.scale.x) * (20 + 18 * enemy.scale.x)) {
            player.takeDamage(0.2 * delta);
        }
    }

    // --- Камера и поворот игрока ---
    world.pivot.x = player.x;
    world.pivot.y = player.y;
    world.x = app.screen.width / 2;
    world.y = app.screen.height / 2;
    
    const worldMousePos = app.renderer.plugins.interaction.mouse.getLocalPosition(world);
    player.rotation = Math.atan2(worldMousePos.y - player.y, worldMousePos.x - player.x);
});

// === Инициализация мира и событий ===
function init() {
    world = new PIXI.Container();
    app.stage.addChild(world);
    
    backgroundGrid = createBackgroundGrid();
    world.addChild(backgroundGrid);
    
    setInterval(() => {
        if (!gameIsOver) spawnEnemy();
    }, 1000);

    startBtn.onclick = startGame;
    restartBtn.onclick = startGame;
    
    app.stage.interactive = true;
    app.stage.on('pointerdown', () => {
        if (!gameIsOver) {
            player.shoot();
        }
    });
}

init();