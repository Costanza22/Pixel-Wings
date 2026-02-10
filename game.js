
const CANVAS_WIDTH = 1400;
const CANVAS_HEIGHT = 800;
const ATTACK_DAMAGE = 10;
const ATTACK_DAMAGE_STRONG = 20;
const ATTACK_RANGE = 80;
const MOVE_SPEED = 7;
const BLOCK_DAMAGE_REDUCTION = 0.5;
const COMBO_TIME_WINDOW = 60;
const MAX_COMBO_MULTIPLIER = 2.0;
const MAX_STAMINA = 100;
const STAMINA_REGEN = 0.3;
const BLOCK_STAMINA_COST = 2;
const STRONG_ATTACK_STAMINA_COST = 30;
const STRONG_ATTACK_COOLDOWN = 60;
const DASH_SPEED = 15;
const DASH_DURATION = 10;
const DASH_STAMINA_COST = 20;
const DASH_DOUBLE_TAP_TIME = 20;
const ULTIMATE_COOLDOWN = 300;
const ULTIMATE_STAMINA_COST = 50;
const BURN_DURATION = 180;
const BURN_DAMAGE_PER_SECOND = 2;
const POWERUP_SPAWN_CHANCE = 0.3;
const POWERUP_LIFETIME = 600;
const HEALTH_REGEN_BETWEEN_PHASES = 0.3;

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

let pressedKeys = new Set();
let gameOver = false;
let winner = null;
let isPaused = false;
let inMenu = true;
let currentPhase = 1;
let phaseTransition = false;
let phaseTransitionTimer = 0;
let particles = [];
let damageNumbers = [];
let fireProjectiles = [];
let screenShake = { x: 0, y: 0, intensity: 0 };
let lastFrameTime = performance.now();
let fps = 0;
let frameCount = 0;
let fpsUpdateTime = 0;
let aiEnabled = true;
let aiDecisionTimer = 0;

let score = 0;
let totalDamageDealt = 0;
let totalDamageTaken = 0;
let gameStartTime = 0;
let gameTime = 0;
let bestScore = parseInt(localStorage.getItem('bestScore') || '0');
let totalKills = 0;
let powerUps = [];
let upgradeScreen = false;
let availableUpgrades = [];
let upgradeTimeoutId = null;
let dragon2Defeated = false;
let enemyDragons = [];
let dashKeys = { left: { lastPress: 0, count: 0 }, right: { lastPress: 0, count: 0 }, up: { lastPress: 0, count: 0 }, down: { lastPress: 0, count: 0 } };

class Particle {
    constructor(x, y, color, velocityX, velocityY, life = 30) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.vx = velocityX;
        this.vy = velocityY;
        this.life = life;
        this.maxLife = life;
        this.size = Math.random() * 4 + 2;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.2;
        this.vx *= 0.98;
        this.life--;
    }

    draw() {
        const alpha = this.life / this.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    isDead() {
        return this.life <= 0;
    }
}

class DamageNumber {
    constructor(x, y, damage, isCritical = false) {
        this.x = x;
        this.y = y;
        this.damage = damage;
        this.isCritical = isCritical;
        this.life = 60;
        this.maxLife = 60;
        this.vy = -2;
    }

    update() {
        this.y += this.vy;
        this.vy *= 0.95;
        this.life--;
    }

    draw() {
        const alpha = this.life / this.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = this.isCritical ? 'bold 32px Arial' : 'bold 24px Arial';
        ctx.fillStyle = this.isCritical ? '#ff0000' : '#ffff00';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.textAlign = 'center';
        const text = `-${Math.round(this.damage)}`;
        ctx.strokeText(text, this.x, this.y);
        ctx.fillText(text, this.x, this.y);
        ctx.restore();
    }

    isDead() {
        return this.life <= 0;
    }
}

class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = 40;
        this.height = 40;
        this.life = POWERUP_LIFETIME;
        this.maxLife = POWERUP_LIFETIME;
        this.rotation = 0;
        this.bobOffset = 0;
    }

    update() {
        this.life--;
        this.rotation += 0.1;
        this.bobOffset = Math.sin(this.life * 0.1) * 5;
    }

    draw() {
        const alpha = Math.min(1, this.life / 60);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2 + this.bobOffset);
        ctx.rotate(this.rotation);

        let color = '#00ff00';
        let symbol = '❤';
        if (this.type === 'stamina') {
            color = '#0088ff';
            symbol = '⚡';
        } else if (this.type === 'damage') {
            color = '#ff0000';
            symbol = '⚔';
        } else if (this.type === 'speed') {
            color = '#ffff00';
            symbol = '💨';
        }

        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.width / 2);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(symbol, 0, 0);

        ctx.restore();
    }

    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    collidesWith(dragon) {
        const bounds = this.getBounds();
        const dragonBounds = dragon.getBounds();

        return bounds.x < dragonBounds.x + dragonBounds.width &&
               bounds.x + bounds.width > dragonBounds.x &&
               bounds.y < dragonBounds.y + dragonBounds.height &&
               bounds.y + bounds.height > dragonBounds.y;
    }

    isDead() {
        return this.life <= 0;
    }
}

class FireProjectile {
    constructor(x, y, direction, owner) {
        this.x = x;
        this.y = y;
        this.direction = direction;
        this.angle = 0;
        this.speed = 8;
        this.width = 40;
        this.height = 30;
        this.life = 60;
        this.maxLife = 60;
        this.owner = owner;
        this.damage = ATTACK_DAMAGE;
    }

    update() {

        if (this.angle !== 0) {
            this.x += Math.cos(this.angle) * this.direction * this.speed;
            this.y += Math.sin(this.angle) * this.speed;
        } else {
            this.x += this.direction * this.speed;
        }
        this.life--;
    }

    draw() {
        const alpha = this.life / this.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;

        const gradient = ctx.createRadialGradient(
            this.x + this.width / 2, this.y + this.height / 2, 0,
            this.x + this.width / 2, this.y + this.height / 2, this.width / 2
        );
        gradient.addColorStop(0, '#ffff00');
        gradient.addColorStop(0.5, '#ff6600');
        gradient.addColorStop(1, '#ff0000');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(this.x + this.width / 2, this.y + this.height / 2,
                   this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        for (let i = 0; i < 5; i++) {
            const offsetX = (Math.random() - 0.5) * this.width * 0.6;
            const offsetY = (Math.random() - 0.5) * this.height * 0.6;
            const size = Math.random() * 8 + 4;
            ctx.fillStyle = `rgba(255, ${200 + Math.random() * 55}, 0, ${alpha * 0.8})`;
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2 + offsetX,
                   this.y + this.height / 2 + offsetY, size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    isDead() {
        return this.life <= 0 || this.x < -100 || this.x > canvas.width + 100;
    }

    collidesWith(dragon) {
        const bounds = this.getBounds();
        const dragonBounds = dragon.getBounds();

        return bounds.x < dragonBounds.x + dragonBounds.width &&
               bounds.x + bounds.width > dragonBounds.x &&
               bounds.y < dragonBounds.y + dragonBounds.height &&
               bounds.y + bounds.height > dragonBounds.y;
    }
}

class Dragon {
    constructor(x, y, imagePath, name, facingRight) {
        this.x = x;
        this.y = y;
        this.name = name;
        this.facingRight = facingRight;
        this.maxHealth = 100;
        this.health = this.maxHealth;
        this.isAttacking = false;
        this.isBlocking = false;
        this.attackCooldown = 0;
        this.blockCooldown = 0;
        this.comboCount = 0;
        this.comboTimer = 0;
        this.stamina = MAX_STAMINA;
        this.maxStamina = MAX_STAMINA;
        this.strongAttackCooldown = 0;
        this.lastAttackType = 'normal';
        this.isDashing = false;
        this.dashCooldown = 0;
        this.dashDirection = { x: 0, y: 0 };
        this.ultimateCooldown = 0;
        this.statusEffects = [];
        this.speedMultiplier = 1.0;
        this.damageMultiplier = 1.0;
        this.isDead = false;
        this.deathAnimation = 0;
        this.upgrades = {
            health: 0,
            damage: 0,
            speed: 0,
            staminaRegen: 0
        };
        this.image = new Image();
        this.imageLoaded = false;
        this.width = 200;
        this.height = 200;
        this.hitFlash = 0;
        this.mouthOpen = 0;

        this.animationState = 'idle';
        this.animationFrame = 0;
        this.animationTimer = 0;
        this.victoryAnimationTimer = 0;
        this.isVictoryDancing = false;
        this.attackAnimationFrame = 0;
        this.idleBounce = 0;
        this.victoryRotation = 0;
        this.isFlying = false;
        this.flyingOffset = 0;
        this.wingFlapTimer = 0;

        this.image.onload = () => {
            this.imageLoaded = true;
            console.log('Imagem carregada com sucesso:', imagePath, 'para', this.name);

            this.height = 200;
            this.width = 200;
        };

        this.image.onerror = () => {
            console.error('Erro ao carregar imagem:', imagePath, 'para', this.name);
            this.imageLoaded = false;

            if (imagePath.includes('dragon_azul') || imagePath.includes('dragon_epico') || imagePath.includes('dragon_epic') || imagePath.includes('dragon_supremo') || imagePath.includes('dragon_lendario') || imagePath.includes('Lendário') || imagePath.includes('pngfre.com') || imagePath.includes('blue_dragon_flying') || imagePath.includes('blue dragon fly')) {
                console.log('Tentando usar imagem alternativa para', this.name);

                const fallbackImage = new Image();
                fallbackImage.onload = () => {
                    this.image = fallbackImage;
                    this.imageLoaded = true;

                    this.height = 200;
                    this.width = 200;
                };
                fallbackImage.onerror = () => {
                    console.error('Erro ao carregar imagem alternativa');
                };
                fallbackImage.src = 'assets/sprites/dragon green flying.png?v=' + Date.now();
            }
        };

        const separator = imagePath.includes('?') ? '&' : '?';
        this.image.src = imagePath + separator + 'v=' + Date.now();
    }

    update() {
        if (this.isDead) {
            this.deathAnimation++;
            this.animationState = 'death';
            return;
        }

        this.animationTimer++;
        this.animationFrame = Math.floor(this.animationTimer / 8) % 4;

        if (this.isAttacking) {
            this.animationState = 'attack';
            this.attackAnimationFrame++;
        } else if (this.isBlocking) {
            this.animationState = 'block';
        } else if (this.isDashing) {
            this.animationState = 'dash';
        } else if (this.isFlying) {
            this.animationState = 'flying';
            this.flyingOffset = Math.sin(this.animationTimer * 0.2) * 5;
            this.wingFlapTimer++;
        } else {
            this.animationState = 'idle';
            this.idleBounce = Math.sin(this.animationTimer * 0.1) * 5;
        }

        if (this.attackCooldown > 0) {
            this.attackCooldown--;
        }
        if (this.strongAttackCooldown > 0) {
            this.strongAttackCooldown--;
        }
        if (this.ultimateCooldown > 0) {
            this.ultimateCooldown--;
        }
        if (this.dashCooldown > 0) {
            this.dashCooldown--;
        }
        if (this.isAttacking && this.attackCooldown === 0) {
            this.isAttacking = false;
            this.attackAnimationFrame = 0;
        }
        if (this.blockCooldown > 0) {
            this.blockCooldown--;
        }
        if (this.comboTimer > 0) {
            this.comboTimer--;
        } else {
            this.comboCount = 0;
        }
        if (this.hitFlash > 0) {
            this.hitFlash--;
        }
        if (this.mouthOpen > 0) {
            this.mouthOpen--;
        }

        if (this.isDashing) {
            this.dashCooldown--;
            if (this.dashCooldown <= 0) {
                this.isDashing = false;
            }
        }

        this.statusEffects = this.statusEffects.filter(effect => {
            effect.duration--;

            if (effect.type === 'burn' && effect.duration % 60 === 0) {
                this.health = Math.max(0, this.health - BURN_DAMAGE_PER_SECOND);

                for (let i = 0; i < 5; i++) {
                    particles.push(new Particle(
                        this.x + this.width / 2 + (Math.random() - 0.5) * 30,
                        this.y + this.height / 2 + (Math.random() - 0.5) * 30,
                        '#ff6600',
                        (Math.random() - 0.5) * 2,
                        -Math.random() * 2 - 1,
                        20
                    ));
                }
            }

            return effect.duration > 0;
        });

        this.speedMultiplier = 1.0;
        this.damageMultiplier = 1.0 + (this.upgrades.damage * 0.1);

        if (this.upgrades.speed > 0) {
            this.speedMultiplier *= (1.0 + this.upgrades.speed * 0.1);
        }

        const staminaRegenRate = STAMINA_REGEN * (1.0 + this.upgrades.staminaRegen * 0.2);
        if (this.isBlocking && this.stamina > 0) {
            this.stamina = Math.max(0, this.stamina - BLOCK_STAMINA_COST);
            if (this.stamina <= 0) {
                this.stopBlock();
            }
        } else {

            if (this.stamina < this.maxStamina) {
                this.stamina = Math.min(this.maxStamina, this.stamina + staminaRegenRate);
            }
        }
    }

    move(dx, dy, screenWidth, screenHeight) {

        const actualDx = dx * this.speedMultiplier;
        const actualDy = dy * this.speedMultiplier;

        if (this.isDashing) {
            const dashDx = this.dashDirection.x * DASH_SPEED;
            const dashDy = this.dashDirection.y * DASH_SPEED;
            const newX = this.x + dashDx;
            const newY = this.y + dashDy;

            if (newX >= 0 && newX + this.width <= screenWidth) {
                this.x = newX;
            }
            if (newY >= 0 && newY + this.height <= screenHeight) {
                this.y = newY;
            }
        } else {
            const newX = this.x + actualDx;
            const newY = this.y + actualDy;

            if (newX >= 0 && newX + this.width <= screenWidth) {
                this.x = newX;
            }
            if (newY >= 0 && newY + this.height <= screenHeight) {
                this.y = newY;
            }
        }
    }

    dash(direction) {
        if (this.stamina >= DASH_STAMINA_COST && !this.isDashing && this.dashCooldown <= 0) {
            this.isDashing = true;
            this.dashCooldown = DASH_DURATION;
            this.dashDirection = direction;
            this.stamina -= DASH_STAMINA_COST;

            for (let i = 0; i < 10; i++) {
                particles.push(new Particle(
                    this.x + this.width / 2,
                    this.y + this.height / 2,
                    '#00ffff',
                    (Math.random() - 0.5) * 4,
                    (Math.random() - 0.5) * 4,
                    15
                ));
            }
        }
    }

    ultimate() {
        if (this.ultimateCooldown === 0 && this.stamina >= ULTIMATE_STAMINA_COST && !this.isBlocking) {
            this.ultimateCooldown = ULTIMATE_COOLDOWN;
            this.stamina -= ULTIMATE_STAMINA_COST;
            this.isAttacking = true;
            this.attackCooldown = 20;
            this.mouthOpen = 25;

            const mouthX = this.facingRight ? this.x + this.width : this.x;
            const mouthY = this.y + this.height / 2;
            const direction = this.facingRight ? 1 : -1;

            for (let i = -2; i <= 2; i++) {
                const projectile = new FireProjectile(mouthX, mouthY, direction, this);
                projectile.damage = ATTACK_DAMAGE_STRONG * 1.5;
                projectile.width = 70;
                projectile.height = 60;
                projectile.speed = 12;

                const angle = i * 0.2;
                projectile.angle = angle;
                fireProjectiles.push(projectile);
            }

            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height / 2;
            for (let i = 0; i < 50; i++) {
                const angle = (Math.PI * 2 * i) / 50;
                const speed = Math.random() * 8 + 5;
                particles.push(new Particle(
                    centerX,
                    centerY,
                    '#ff00ff',
                    Math.cos(angle) * speed,
                    Math.sin(angle) * speed,
                    40
                ));
            }

            screenShake.intensity = 15;
        }
    }

    addStatusEffect(type, duration) {

        this.statusEffects = this.statusEffects.filter(e => e.type !== type);
        this.statusEffects.push({ type, duration });
    }

    attack(isStrong = false) {
        if (this.isBlocking) return;

        if (isStrong) {
            if (this.strongAttackCooldown > 0 || this.stamina < STRONG_ATTACK_STAMINA_COST) {
                return;
            }
            this.stamina -= STRONG_ATTACK_STAMINA_COST;
            this.strongAttackCooldown = STRONG_ATTACK_COOLDOWN;
            this.lastAttackType = 'strong';
        } else {
            if (this.attackCooldown > 0) return;
            this.lastAttackType = 'normal';
        }

        if (this.attackCooldown === 0 || isStrong) {
            this.isAttacking = true;
            this.attackCooldown = isStrong ? 10 : 30;
            this.mouthOpen = isStrong ? 20 : 15;

            const mouthX = this.facingRight ? this.x + this.width : this.x;
            const mouthY = this.y + this.height / 2;
            const direction = this.facingRight ? 1 : -1;
            const projectile = new FireProjectile(mouthX, mouthY, direction, this);
            if (isStrong) {
                projectile.damage = ATTACK_DAMAGE_STRONG;
                projectile.width = 60;
                projectile.height = 50;
                projectile.speed = 10;
            }
            fireProjectiles.push(projectile);

            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height / 2;
            const particleCount = isStrong ? 25 : 15;
            for (let i = 0; i < particleCount; i++) {
                const angle = (Math.PI * 2 * i) / particleCount;
                const speed = Math.random() * (isStrong ? 5 : 3) + (isStrong ? 3 : 2);
                particles.push(new Particle(
                    centerX,
                    centerY,
                    isStrong ? '#ff6600' : (this.name.includes('Roxo') ? '#aa44ff' : '#44ff44'),
                    Math.cos(angle) * speed,
                    Math.sin(angle) * speed,
                    isStrong ? 30 : 20
                ));
            }
        }
    }

    block() {
        if (this.blockCooldown === 0 && !this.isAttacking && this.stamina > 0) {
            this.isBlocking = true;
            this.animationState = 'block';
        }
    }

    stopBlock() {
        if (this.isBlocking) {
            this.isBlocking = false;
            this.blockCooldown = 10;
        }
    }

    startVictoryDance() {
        this.isVictoryDancing = true;
        this.victoryAnimationTimer = 0;
        this.animationState = 'victory';
    }

    stopVictoryDance() {
        this.isVictoryDancing = false;
        this.victoryAnimationTimer = 0;
        this.victoryRotation = 0;
        this.idleBounce = 0;
    }

    takeDamage(damage, attacker) {

        let finalDamage = damage;
        let wasBlocked = false;

        if (this.isBlocking) {

            finalDamage = 0;
            wasBlocked = true;

            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height / 2;
            for (let i = 0; i < 10; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 2 + 1;
                particles.push(new Particle(
                    centerX,
                    centerY,
                    '#ffffff',
                    Math.cos(angle) * speed,
                    Math.sin(angle) * speed,
                    15
                ));
            }
        } else {

            if (attacker && attacker.comboCount > 0) {
                const comboMultiplier = 1 + (attacker.comboCount * 0.1);
                finalDamage = damage * Math.min(comboMultiplier, MAX_COMBO_MULTIPLIER);
            }

            if (attacker && attacker.damageMultiplier) {
                finalDamage *= attacker.damageMultiplier;
            }

            if (attacker && attacker.lastAttackType === 'strong') {

                this.addStatusEffect('burn', BURN_DURATION);
            }
            if (attacker && attacker.lastAttackType === 'ultimate') {

                this.addStatusEffect('burn', BURN_DURATION * 2);
            }

            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height / 2;
            for (let i = 0; i < 20; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 4 + 2;
                particles.push(new Particle(
                    centerX,
                    centerY,
                    '#ff0000',
                    Math.cos(angle) * speed,
                    Math.sin(angle) * speed,
                    25
                ));
            }

            screenShake.intensity = 5;
            this.hitFlash = 5;
        }

        this.health -= finalDamage;
        if (this.health < 0) {
            this.health = 0;
        }

        if (this.health <= 0 && !this.isDead) {
            this.isDead = true;
            this.deathAnimation = 0;
        }

        if (attacker && attacker === dragon1 && finalDamage > 0) {
            totalDamageDealt += finalDamage;
        }
        if (this === dragon1 && finalDamage > 0) {
            totalDamageTaken += finalDamage;
        }

        const isCritical = attacker && attacker.comboCount >= 3;
        damageNumbers.push(new DamageNumber(
            this.x + this.width / 2,
            this.y + this.height / 2,
            finalDamage,
            isCritical
        ));

        if (attacker && !wasBlocked) {
            attacker.comboCount++;
            attacker.comboTimer = COMBO_TIME_WINDOW;
        }
    }

    isAlive() {
        return this.health > 0 && !this.isDead;
    }

    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    isInAttackRange(other, attackRange) {
        const bounds = this.getBounds();

        if (this.facingRight && this.x < other.x) {
            return this.x + this.width >= other.x - attackRange &&
                   this.y < other.y + other.height &&
                   this.y + this.height > other.y;
        } else if (!this.facingRight && this.x > other.x) {
            return this.x <= other.x + other.width + attackRange &&
                   this.y < other.y + other.height &&
                   this.y + this.height > other.y;
        }
        return false;
    }

    draw() {
        if (!this.imageLoaded) {

            let placeholderColor = '#00ff00';
            if (this.name.includes('Roxo')) {
                placeholderColor = '#aa00ff';
            } else if (this.name.includes('Lendário')) {
                placeholderColor = '#ffaa00';
            } else if (this.name.includes('Épico')) {
                placeholderColor = '#0088ff';
            } else if (this.name.includes('Supremo')) {
                placeholderColor = '#ff0088';
            }
            ctx.fillStyle = placeholderColor;
            ctx.fillRect(this.x, this.y, this.width, this.height);

            ctx.fillStyle = '#ffffff';
            ctx.font = '12px Arial';
            ctx.fillText('Carregando...', this.x, this.y + this.height / 2);
            return;
        }

        ctx.save();

        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;

        if (this.animationState === 'attack') {
            const attackProgress = this.attackAnimationFrame / 20;
            const attackOffset = Math.sin(attackProgress * Math.PI) * 20;
            ctx.translate(centerX, centerY);
            ctx.rotate((this.facingRight ? 1 : -1) * Math.sin(attackProgress * Math.PI) * 0.1);
            ctx.scale(1 + Math.sin(attackProgress * Math.PI) * 0.15, 1 - Math.sin(attackProgress * Math.PI) * 0.1);
            ctx.translate(-centerX, -centerY);
        }

        if (this.animationState === 'block') {
            const blockPulse = Math.sin(this.animationTimer * 0.3) * 0.05;
            ctx.translate(centerX, centerY);
            ctx.scale(1 - blockPulse, 1 - blockPulse);
            ctx.translate(-centerX, -centerY);
        }

        if (this.animationState === 'idle') {
            ctx.translate(0, this.idleBounce);
        }

        if (this.animationState === 'dash') {
            const dashStretch = 1.2;
            ctx.translate(centerX, centerY);
            ctx.scale(dashStretch, 0.8);
            ctx.translate(-centerX, -centerY);
        }

        if (this.animationState === 'flying' && !this.isAttacking && !this.isBlocking && !this.isDashing) {

            ctx.translate(0, this.flyingOffset);

            const tiltAngle = Math.sin(this.animationTimer * 0.15) * 0.03;
            ctx.translate(centerX, centerY);
            ctx.rotate(tiltAngle);
            ctx.translate(-centerX, -centerY);

            if (this.name.includes('Verde')) {
                const legRotation = -0.15;
                ctx.translate(centerX, centerY);
                ctx.rotate(legRotation);
                ctx.translate(-centerX, -centerY);
            }

            const wingFlap = 1 + Math.sin(this.wingFlapTimer * 0.4) * 0.05;
            ctx.translate(centerX, centerY);
            ctx.scale(1, wingFlap);
            ctx.translate(-centerX, -centerY);
        }

        if (this.hitFlash > 0) {
            ctx.globalAlpha = 0.7;
            ctx.filter = 'brightness(1.5)';
        }

        if (this.isDashing) {
            ctx.globalAlpha = 0.6;
        }

        const hasBurn = this.statusEffects.some(e => e.type === 'burn');
        if (hasBurn) {
            ctx.filter = (ctx.filter || '') + ' hue-rotate(-30deg) brightness(1.2)';

            for (let i = 0; i < 3; i++) {
                particles.push(new Particle(
                    this.x + Math.random() * this.width,
                    this.y + Math.random() * this.height,
                    '#ff6600',
                    (Math.random() - 0.5) * 2,
                    -Math.random() * 2 - 1,
                    15
                ));
            }
        }

        if (this.isBlocking) {
            ctx.globalAlpha = 0.8;
            ctx.filter = 'brightness(0.7)';

            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2,
                   (this.width + this.height) / 2 + 10, 0, Math.PI * 2);
            ctx.stroke();
        }

        if (this.isFlying && this.animationState === 'flying') {

            if (this.animationTimer % 5 === 0) {
                for (let i = 0; i < 3; i++) {
                    const wingX = this.facingRight ? this.x + this.width * 0.3 : this.x + this.width * 0.7;
                    const wingY = this.y + this.height * 0.4 + (Math.random() - 0.5) * 20;
                    particles.push(new Particle(
                        wingX,
                        wingY,
                        '#88ccff',
                        (this.facingRight ? -1 : 1) * (Math.random() * 2 + 1),
                        (Math.random() - 0.5) * 1,
                        20
                    ));
                }
            }
        }

        const isDragon2 = this.name.includes('Verde') || this.name.includes('Lendário') || this.name.includes('Épico');
        const isSupremo = this.name.includes('Supremo');

        if (this.facingRight) {
            if (isDragon2) {

                ctx.save();
                ctx.translate(this.x + this.width, this.y);
                ctx.scale(-1, 1);
                ctx.drawImage(this.image, 0, 0, this.width, this.height);
                ctx.restore();
            } else if (isSupremo) {

                ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
            } else {

                ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
            }
        } else {
            if (isDragon2) {

                ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
            } else if (isSupremo) {

                ctx.save();
                ctx.translate(this.x + this.width, this.y);
                ctx.scale(-1, 1);
                ctx.drawImage(this.image, 0, 0, this.width, this.height);
                ctx.restore();
            } else {

                ctx.save();
                ctx.translate(this.x + this.width, this.y);
                ctx.scale(-1, 1);
                ctx.drawImage(this.image, 0, 0, this.width, this.height);
                ctx.restore();
            }
        }

        if (this.mouthOpen > 0) {
            ctx.save();
            const progress = this.mouthOpen / 15;
            const mouthSize = progress * 25;
            const mouthX = this.facingRight ? this.x + this.width - 15 : this.x + 15;
            const mouthY = this.y + this.height * 0.55;

            ctx.globalAlpha = 0.9;
            const mouthGradient = ctx.createRadialGradient(mouthX, mouthY, 0, mouthX, mouthY, mouthSize);
            mouthGradient.addColorStop(0, '#ff6600');
            mouthGradient.addColorStop(0.5, '#ff0000');
            mouthGradient.addColorStop(1, '#cc0000');
            ctx.fillStyle = mouthGradient;
            ctx.beginPath();
            ctx.ellipse(mouthX, mouthY, mouthSize, mouthSize * 0.6, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.ellipse(mouthX, mouthY, mouthSize * 0.7, mouthSize * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.beginPath();
            ctx.ellipse(mouthX, mouthY - mouthSize * 0.2, mouthSize * 0.3, mouthSize * 0.15, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }

        ctx.restore();

        ctx.save();

        const barWidth = 150;
        const barHeight = 20;
        const barX = this.x + (this.width - barWidth) / 2;
        const barY = this.y - 50;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(barX - 3, barY - 3, barWidth + 6, barHeight + 6);

        ctx.fillStyle = 'rgba(50, 50, 50, 0.95)';
        ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);

        const healthPercent = Math.max(0, Math.min(1, this.health / this.maxHealth));
        if (healthPercent > 0.6) {
            ctx.fillStyle = '#00ff00';
        } else if (healthPercent > 0.3) {
            ctx.fillStyle = '#ffff00';
        } else {
            ctx.fillStyle = '#ff0000';
        }
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barWidth, barHeight);

        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const healthText = `${Math.ceil(this.health)}/${this.maxHealth}`;
        ctx.fillText(healthText, barX + barWidth / 2, barY + barHeight / 2);

        ctx.font = 'bold 18px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.textBaseline = 'bottom';
        ctx.strokeText(this.name, this.x + this.width / 2, barY - 10);
        ctx.fillText(this.name, this.x + this.width / 2, barY - 10);

        const staminaBarWidth = 150;
        const staminaBarHeight = 12;
        const staminaBarX = this.x + (this.width - staminaBarWidth) / 2;
        const staminaBarY = this.y - 35;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(staminaBarX - 3, staminaBarY - 3, staminaBarWidth + 6, staminaBarHeight + 6);

        ctx.fillStyle = 'rgba(30, 30, 50, 0.95)';
        ctx.fillRect(staminaBarX - 1, staminaBarY - 1, staminaBarWidth + 2, staminaBarHeight + 2);

        const staminaPercent = Math.max(0, Math.min(1, this.stamina / this.maxStamina));
        if (staminaPercent > 0.5) {
            ctx.fillStyle = '#0088ff';
        } else if (staminaPercent > 0.2) {
            ctx.fillStyle = '#ffff00';
        } else {
            ctx.fillStyle = '#ff0000';
        }
        ctx.fillRect(staminaBarX, staminaBarY, staminaBarWidth * staminaPercent, staminaBarHeight);

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(staminaBarX, staminaBarY, staminaBarWidth, staminaBarHeight);

        if (this.strongAttackCooldown > 0) {
            const cooldownPercent = this.strongAttackCooldown / STRONG_ATTACK_COOLDOWN;
            ctx.fillStyle = 'rgba(255, 100, 0, 0.7)';
            ctx.fillRect(staminaBarX, staminaBarY - 10, staminaBarWidth * cooldownPercent, 5);
        }

        if (this.ultimateCooldown > 0) {
            const ultimatePercent = this.ultimateCooldown / ULTIMATE_COOLDOWN;
            ctx.fillStyle = 'rgba(255, 0, 255, 0.7)';
            ctx.fillRect(staminaBarX, staminaBarY - 16, staminaBarWidth * ultimatePercent, 5);
        }

        if (this.isAttacking) {
            ctx.save();
            ctx.globalAlpha = 0.6;
            const gradient = ctx.createRadialGradient(
                this.x + this.width / 2, this.y + this.height / 2, 0,
                this.x + this.width / 2, this.y + this.height / 2,
                (this.width + this.height) / 2 + 30
            );
            gradient.addColorStop(0, '#ffff00');
            gradient.addColorStop(1, '#ff0000');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2,
                   (this.width + this.height) / 2 + 30, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        ctx.restore();
    }
}

let dragon1 = new Dragon(100, 500, 'assets/sprites/image.png', 'Dragão Roxo', true);
enemyDragons = [
    new Dragon(1000, 500, 'assets/sprites/dragon green flying.png', 'Dragão Verde 1', false),
    new Dragon(1200, 400, 'assets/sprites/dragon green flying.png', 'Dragão Verde 2', false)
];
enemyDragons[0].facingRight = true;
enemyDragons[0].isFlying = true;
enemyDragons[1].facingRight = true;
enemyDragons[1].isFlying = true;

let backgroundImage = new Image();
backgroundImage.onload = () => {
    console.log('Imagem de fundo fase 1 carregada!');
};
backgroundImage.onerror = () => {
    console.error('Erro ao carregar imagem de fundo fase 1');
};
backgroundImage.src = 'assets/backgrounds/background.jpg';

let backgroundPhase2 = new Image();
backgroundPhase2.onload = () => {
    console.log('Imagem de fundo fase 2 carregada!');
};
backgroundPhase2.onerror = () => {
    console.error('Erro ao carregar imagem de fundo fase 2');
};
backgroundPhase2.src = 'assets/backgrounds/background_phase2.jpg?v=' + Date.now();

let backgroundPhase3 = new Image();
backgroundPhase3.onload = () => {
    console.log('Imagem de fundo fase 3 carregada!');
};
backgroundPhase3.onerror = () => {
    console.error('Erro ao carregar imagem de fundo fase 3');
};
backgroundPhase3.src = 'assets/backgrounds/background_phase3.jpg?v=' + Date.now();

let backgroundPhase4 = new Image();
backgroundPhase4.onload = () => {
    console.log('Imagem de fundo fase 4 carregada!');
};
backgroundPhase4.onerror = () => {
    console.error('Erro ao carregar imagem de fundo fase 4');
};
backgroundPhase4.src = 'assets/backgrounds/background_phase4.jpg?v=' + Date.now();

let gameOverBackgroundImage = new Image();
gameOverBackgroundImage.onload = () => {
    console.log('Imagem de fundo de game over carregada!');
};
gameOverBackgroundImage.onerror = () => {
    console.error('Erro ao carregar imagem de fundo de game over');
};

gameOverBackgroundImage.src = 'assets/backgrounds/gameover_background.jpg?v=' + Date.now();

let victoryBackgroundImage = new Image();
victoryBackgroundImage.onload = () => {
    console.log('Imagem de fundo de vitória carregada!');
};
victoryBackgroundImage.onerror = () => {
    console.error('Erro ao carregar imagem de fundo de vitória');
};

victoryBackgroundImage.src = 'assets/backgrounds/victory_background.jpg?v=' + Date.now();

function update() {
    if (gameOver || isPaused || inMenu || upgradeScreen) return;

    if (gameStartTime === 0) {
        gameStartTime = performance.now();
    }
    gameTime = (performance.now() - gameStartTime) / 1000;

    if (phaseTransition) {
        phaseTransitionTimer++;
        if (phaseTransitionTimer > 180) {
            phaseTransition = false;
            phaseTransitionTimer = 0;
        }
        return;
    }

    dragon1.update();
    enemyDragons.forEach(enemy => enemy.update());

    powerUps = powerUps.filter(powerUp => {
        powerUp.update();

        if (powerUp.collidesWith(dragon1) && dragon1.isAlive()) {
            applyPowerUp(powerUp, dragon1);
            return false;
        }

        return !powerUp.isDead();
    });

    particles = particles.filter(p => {
        p.update();
        return !p.isDead();
    });

    damageNumbers = damageNumbers.filter(d => {
        d.update();
        return !d.isDead();
    });

    fireProjectiles = fireProjectiles.filter(fire => {
        fire.update();

        if (fire.owner !== dragon1 && fire.collidesWith(dragon1) && dragon1.isAlive()) {

            if (!dragon1.isBlocking) {
                dragon1.takeDamage(fire.damage, fire.owner);
            } else {

                const centerX = dragon1.x + dragon1.width / 2;
                const centerY = dragon1.y + dragon1.height / 2;
                for (let i = 0; i < 8; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = Math.random() * 2 + 1;
                    particles.push(new Particle(
                        centerX,
                        centerY,
                        '#ffffff',
                        Math.cos(angle) * speed,
                        Math.sin(angle) * speed,
                        15
                    ));
                }
            }
            return false;
        }
        let hitEnemy = false;
        enemyDragons.forEach(enemy => {
            if (fire.owner !== enemy && fire.collidesWith(enemy) && enemy.isAlive()) {
                if (!enemy.isBlocking) {
                    enemy.takeDamage(fire.damage, fire.owner);
                } else {
                    const centerX = enemy.x + enemy.width / 2;
                    const centerY = enemy.y + enemy.height / 2;
                    for (let i = 0; i < 8; i++) {
                        const angle = Math.random() * Math.PI * 2;
                        const speed = Math.random() * 2 + 1;
                        particles.push(new Particle(
                            centerX,
                            centerY,
                            '#ffffff',
                            Math.cos(angle) * speed,
                            Math.sin(angle) * speed,
                            15
                        ));
                    }
                }
                hitEnemy = true;
            }
        });
        if (hitEnemy) return false;

        return !fire.isDead();
    });

    if (screenShake.intensity > 0) {
        screenShake.x = (Math.random() - 0.5) * screenShake.intensity;
        screenShake.y = (Math.random() - 0.5) * screenShake.intensity;
        screenShake.intensity *= 0.9;
        if (screenShake.intensity < 0.1) {
            screenShake.intensity = 0;
            screenShake.x = 0;
            screenShake.y = 0;
        }
    }

    handleInput();

    if (aiEnabled) {
        updateAI();
    }

    checkCollisions();

    frameCount++;
    const currentTime = performance.now();
    if (currentTime - fpsUpdateTime >= 1000) {
        fps = frameCount;
        frameCount = 0;
        fpsUpdateTime = currentTime;
    }
}

function updateAI() {
    const screenWidth = canvas.width;
    const screenHeight = canvas.height;

    aiDecisionTimer++;

    const decisionSpeed = Math.max(5, 10 - (currentPhase * 2));
    if (aiDecisionTimer < decisionSpeed) return;
    aiDecisionTimer = 0;

    enemyDragons.forEach(ai => {
        const target = dragon1;

        if (!ai.isAlive() || !target.isAlive()) return;

    const dx = target.x - ai.x;
    const dy = target.y - ai.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const distanceX = Math.abs(dx);
    const distanceY = Math.abs(dy);

    const phaseMultiplier = currentPhase;
    const attackChance = 0.4 - (phaseMultiplier * 0.1);
    const blockChance = 0.4 + (phaseMultiplier * 0.1);
    const attackRange = 350 + (phaseMultiplier * 50);

    const shouldAttack = distance < attackRange && ai.attackCooldown === 0 && Math.random() > attackChance;
    const shouldBlock = distance < 250 && target.isAttacking && Math.random() > blockChance;
    const shouldMoveCloser = distance > 300;
    const shouldMoveAway = distance < 200 && ai.health < target.health * 0.8;

    if (shouldBlock && !ai.isAttacking) {
        ai.block();
    } else {
        ai.stopBlock();
    }

    if (shouldAttack && !ai.isBlocking) {

        ai.facingRight = ai.x < target.x;
        ai.attack();
    } else if (shouldMoveCloser || shouldMoveAway) {

        let moveDX = 0;
        let moveDY = 0;
        let aiMovingHorizontal = false;

        if (shouldMoveAway) {

            moveDX = dx > 0 ? -MOVE_SPEED : MOVE_SPEED;
            moveDY = dy > 0 ? -MOVE_SPEED : MOVE_SPEED;
        } else {

            moveDX = dx > 0 ? MOVE_SPEED : -MOVE_SPEED;
            moveDY = dy > 0 ? MOVE_SPEED : -MOVE_SPEED;
        }

        if (Math.abs(dx) > 30) {
            ai.move(moveDX, 0, screenWidth, screenHeight);

            ai.facingRight = moveDX > 0;
            aiMovingHorizontal = true;
        }
        if (Math.abs(dy) > 30) {
            ai.move(0, moveDY, screenWidth, screenHeight);
        }

        if (!aiMovingHorizontal && !ai.isBlocking) {
            ai.facingRight = ai.x < target.x;
        }
    } else {

        if (Math.random() > 0.6) {
            const randomX = (Math.random() - 0.5) * MOVE_SPEED * 0.5;
            const randomY = (Math.random() - 0.5) * MOVE_SPEED * 0.5;
            ai.move(randomX, randomY, screenWidth, screenHeight);

            if (randomX > 0) {
                ai.facingRight = true;
            } else if (randomX < 0) {
                ai.facingRight = false;
            }
        }
    }

        if (!shouldMoveCloser && !shouldMoveAway && !ai.isBlocking && distanceX > 50) {
            ai.facingRight = ai.x < target.x;
        }
    });
}

function handleInput() {
    const screenWidth = canvas.width;
    const screenHeight = canvas.height;

    const currentTime = performance.now();

    let dragon1MovingHorizontal = false;
    let dashDirection = null;

    if (pressedKeys.has('ArrowUp')) {

        if (currentTime - dashKeys.up.lastPress < DASH_DOUBLE_TAP_TIME * 16) {
            dashKeys.up.count++;
            if (dashKeys.up.count >= 2) {
                dashDirection = { x: 0, y: -1 };
                dashKeys.up.count = 0;
            }
        } else {
            dashKeys.up.count = 1;
        }
        dashKeys.up.lastPress = currentTime;

        if (!dragon1.isDashing) {
            dragon1.move(0, -MOVE_SPEED, screenWidth, screenHeight);
        }
    }
    if (pressedKeys.has('ArrowDown')) {
        if (currentTime - dashKeys.down.lastPress < DASH_DOUBLE_TAP_TIME * 16) {
            dashKeys.down.count++;
            if (dashKeys.down.count >= 2) {
                dashDirection = { x: 0, y: 1 };
                dashKeys.down.count = 0;
            }
        } else {
            dashKeys.down.count = 1;
        }
        dashKeys.down.lastPress = currentTime;

        if (!dragon1.isDashing) {
            dragon1.move(0, MOVE_SPEED, screenWidth, screenHeight);
        }
    }
    if (pressedKeys.has('ArrowLeft')) {
        if (currentTime - dashKeys.left.lastPress < DASH_DOUBLE_TAP_TIME * 16) {
            dashKeys.left.count++;
            if (dashKeys.left.count >= 2) {
                dashDirection = { x: -1, y: 0 };
                dashKeys.left.count = 0;
            }
        } else {
            dashKeys.left.count = 1;
        }
        dashKeys.left.lastPress = currentTime;

        if (!dragon1.isDashing) {
            dragon1.move(-MOVE_SPEED, 0, screenWidth, screenHeight);
            dragon1.facingRight = false;
            dragon1MovingHorizontal = true;
        }
    }
    if (pressedKeys.has('ArrowRight')) {
        if (currentTime - dashKeys.right.lastPress < DASH_DOUBLE_TAP_TIME * 16) {
            dashKeys.right.count++;
            if (dashKeys.right.count >= 2) {
                dashDirection = { x: 1, y: 0 };
                dashKeys.right.count = 0;
            }
        } else {
            dashKeys.right.count = 1;
        }
        dashKeys.right.lastPress = currentTime;

        if (!dragon1.isDashing) {
            dragon1.move(MOVE_SPEED, 0, screenWidth, screenHeight);
            dragon1.facingRight = true;
            dragon1MovingHorizontal = true;
        }
    }

    if (dashDirection) {
        dragon1.dash(dashDirection);
    }

    if (!dragon1MovingHorizontal && !dragon1.isBlocking && !dragon1.isDashing &&
        !pressedKeys.has('ArrowUp') && !pressedKeys.has('ArrowDown') &&
        !pressedKeys.has('ArrowLeft') && !pressedKeys.has('ArrowRight')) {
        const nearestEnemy = enemyDragons.reduce((nearest, enemy) => {
            if (!enemy.isAlive()) return nearest;
            if (!nearest) return enemy;
            const distNearest = Math.abs(dragon1.x - nearest.x);
            const distEnemy = Math.abs(dragon1.x - enemy.x);
            return distEnemy < distNearest ? enemy : nearest;
        }, null);
        if (nearestEnemy) {
            dragon1.facingRight = dragon1.x < nearestEnemy.x;
        }
    }
    if (pressedKeys.has('Space')) {

        const isStrong = pressedKeys.has('ShiftLeft') || pressedKeys.has('ShiftRight');
        dragon1.attack(isStrong);
    }
    if (pressedKeys.has('KeyX')) {

        dragon1.ultimate();
    }
    if (pressedKeys.has('ShiftLeft') || pressedKeys.has('ShiftRight')) {

        if (!pressedKeys.has('Space')) {
            dragon1.block();
        }
    } else {
        dragon1.stopBlock();
    }

}

function checkCollisions() {

    enemyDragons.forEach(enemy => {
        if (dragon1.isAttacking && dragon1.isInAttackRange(enemy, ATTACK_RANGE)) {
            if (!enemy.isBlocking) {
                enemy.takeDamage(ATTACK_DAMAGE, dragon1);
            } else {
                const centerX = enemy.x + enemy.width / 2;
                const centerY = enemy.y + enemy.height / 2;
                for (let i = 0; i < 8; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = Math.random() * 2 + 1;
                    particles.push(new Particle(
                        centerX,
                        centerY,
                        '#ffffff',
                        Math.cos(angle) * speed,
                        Math.sin(angle) * speed,
                        15
                    ));
                }
            }
        }

        if (enemy.isAttacking && enemy.isInAttackRange(dragon1, ATTACK_RANGE)) {
            if (!dragon1.isBlocking) {
                dragon1.takeDamage(ATTACK_DAMAGE, enemy);
            } else {
                const centerX = dragon1.x + dragon1.width / 2;
                const centerY = dragon1.y + dragon1.height / 2;
                for (let i = 0; i < 8; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = Math.random() * 2 + 1;
                    particles.push(new Particle(
                        centerX,
                        centerY,
                        '#ffffff',
                        Math.cos(angle) * speed,
                        Math.sin(angle) * speed,
                        15
                    ));
                }
            }
        }
    });

    const allEnemiesDead = enemyDragons.every(enemy => !enemy.isAlive());

    if (!dragon1.isAlive() && winner === null) {
        winner = enemyDragons.find(e => e.isAlive())?.name || 'Inimigo';
        gameOver = true;
        score += Math.floor(gameTime) * 5;
        if (score > bestScore) {
            bestScore = score;
            localStorage.setItem('bestScore', bestScore.toString());
        }
    } else if (allEnemiesDead && winner === null && !upgradeScreen && !dragon2Defeated) {

        dragon2Defeated = true;

        enemyDragons.forEach(enemy => {
            if (currentPhase === 1 && enemy.name.includes('Verde')) {
                const omgImage = new Image();
                omgImage.onload = () => {
                    enemy.image = omgImage;
                    enemy.imageLoaded = true;
                    enemy.height = 200;
                    enemy.width = 200;
                    console.log('Imagem do dragão verde mudada para omg dragon.png');
                };
                omgImage.onerror = () => {
                    console.error('Erro ao carregar omg dragon.png');
                };
                omgImage.src = 'assets/sprites/omg dragon.png?v=' + Date.now();
            } else if (currentPhase === 2 && enemy.name.includes('Lendário')) {
                const omgOrangeImage = new Image();
                omgOrangeImage.onload = () => {
                    enemy.image = omgOrangeImage;
                    enemy.imageLoaded = true;
                    enemy.height = 200;
                    enemy.width = 200;
                    console.log('Imagem do dragão lendário mudada para omg orange dragon.png');
                };
                omgOrangeImage.onerror = () => {
                    console.error('Erro ao carregar omg orange dragon.png');
                };
                omgOrangeImage.src = 'assets/sprites/omg orange dragon.png?v=' + Date.now();
            } else if (currentPhase === 3 && enemy.name.includes('Épico')) {
                const omgBlueImage = new Image();
                omgBlueImage.onload = () => {
                    enemy.image = omgBlueImage;
                    enemy.imageLoaded = true;
                    enemy.height = 200;
                    enemy.width = 200;
                    console.log('Imagem do dragão épico mudada para omg dragon blue.png');
                };
                omgBlueImage.onerror = () => {
                    console.error('Erro ao carregar omg dragon blue.png');
                };
                omgBlueImage.src = 'assets/sprites/omg dragon blue.png?v=' + Date.now();
            } else if (currentPhase === 4 && enemy.name.includes('Supremo')) {
                const omgGreenBossImage = new Image();
                omgGreenBossImage.onload = () => {
                    enemy.image = omgGreenBossImage;
                    enemy.imageLoaded = true;
                    enemy.height = 200;
                    enemy.width = 200;
                    console.log('Imagem do dragão supremo mudada para omg dragon green boss.png');
                };
                omgGreenBossImage.onerror = () => {
                    console.error('Erro ao carregar omg dragon green boss.png');
                };
                omgGreenBossImage.src = 'assets/sprites/omg dragon green boss.png?v=' + Date.now();
            }

            if (Math.random() < POWERUP_SPAWN_CHANCE) {
                const powerUpTypes = ['health', 'stamina', 'damage', 'speed'];
                const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
                const powerUpX = enemy.x + enemy.width / 2;
                const powerUpY = enemy.y + enemy.height / 2;
                powerUps.push(new PowerUp(powerUpX, powerUpY, randomType));
            }
        });

        const healAmount = dragon1.maxHealth * HEALTH_REGEN_BETWEEN_PHASES;
        dragon1.health = Math.min(dragon1.maxHealth, dragon1.health + healAmount);

        if (upgradeTimeoutId === null && !upgradeScreen) {

            if (currentPhase === 1) {

                upgradeTimeoutId = setTimeout(() => {

                    if (!upgradeScreen && availableUpgrades.length === 0) {
                        availableUpgrades = generateUpgrades();
                    }
                    if (!upgradeScreen) {
                        upgradeScreen = true;
                    }
                    upgradeTimeoutId = null;
                }, 3000);
            } else if (currentPhase === 2) {

                upgradeTimeoutId = setTimeout(() => {

                    if (!upgradeScreen && availableUpgrades.length === 0) {
                        availableUpgrades = generateUpgrades();
                    }
                    if (!upgradeScreen) {
                        upgradeScreen = true;
                    }
                    upgradeTimeoutId = null;
                }, 3000);
            } else if (currentPhase === 3) {

                upgradeTimeoutId = setTimeout(() => {

                    if (!upgradeScreen && availableUpgrades.length === 0) {
                        availableUpgrades = generateUpgrades();
                    }
                    if (!upgradeScreen) {
                        upgradeScreen = true;
                    }
                    upgradeTimeoutId = null;
                }, 3000);
            } else {

                winner = dragon1.name;
                gameOver = true;

                score += Math.floor(gameTime) * 5;
                score += currentPhase * 1000;
                if (score > bestScore) {
                    bestScore = score;
                    localStorage.setItem('bestScore', bestScore.toString());
                }
            }
        }
    }

    if (dragon1.comboCount > 0) {
        score += dragon1.comboCount * 10 * currentPhase;
    }
}

function applyPowerUp(powerUp, dragon) {
    switch(powerUp.type) {
        case 'health':
            dragon.health = Math.min(dragon.maxHealth, dragon.health + 30);

            for (let i = 0; i < 15; i++) {
                particles.push(new Particle(
                    powerUp.x, powerUp.y,
                    '#00ff00',
                    (Math.random() - 0.5) * 3,
                    (Math.random() - 0.5) * 3,
                    20
                ));
            }
            break;
        case 'stamina':
            dragon.stamina = Math.min(dragon.maxStamina, dragon.stamina + 50);
            for (let i = 0; i < 15; i++) {
                particles.push(new Particle(
                    powerUp.x, powerUp.y,
                    '#0088ff',
                    (Math.random() - 0.5) * 3,
                    (Math.random() - 0.5) * 3,
                    20
                ));
            }
            break;
        case 'damage':

            dragon.damageMultiplier = 1.5;
            setTimeout(() => {
                dragon.damageMultiplier = 1.0 + (dragon.upgrades.damage * 0.1);
            }, 5000);
            for (let i = 0; i < 15; i++) {
                particles.push(new Particle(
                    powerUp.x, powerUp.y,
                    '#ff0000',
                    (Math.random() - 0.5) * 3,
                    (Math.random() - 0.5) * 3,
                    20
                ));
            }
            break;
        case 'speed':

            const originalSpeed = dragon.speedMultiplier;
            dragon.speedMultiplier = 1.5;
            setTimeout(() => {
                dragon.speedMultiplier = originalSpeed;
            }, 5000);
            for (let i = 0; i < 15; i++) {
                particles.push(new Particle(
                    powerUp.x, powerUp.y,
                    '#ffff00',
                    (Math.random() - 0.5) * 3,
                    (Math.random() - 0.5) * 3,
                    20
                ));
            }
            break;
    }
}

function generateUpgrades() {
    const allUpgrades = [
        { type: 'health', name: 'Vida Extra', description: '+20 HP máximo' },
        { type: 'damage', name: 'Dano Aumentado', description: '+10% de dano' },
        { type: 'speed', name: 'Velocidade', description: '+10% de velocidade' },
        { type: 'staminaRegen', name: 'Regeneração', description: '+20% regeneração de stamina' }
    ];

    const shuffled = [...allUpgrades];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.slice(0, 3);
}

function applyUpgrade(upgradeType) {

    if (upgradeTimeoutId !== null) {
        clearTimeout(upgradeTimeoutId);
        upgradeTimeoutId = null;
    }

    switch(upgradeType) {
        case 'health':
            dragon1.maxHealth += 20;
            dragon1.health += 20;
            dragon1.upgrades.health++;
            break;
        case 'damage':
            dragon1.upgrades.damage++;
            break;
        case 'speed':
            dragon1.upgrades.speed++;
            break;
        case 'staminaRegen':
            dragon1.upgrades.staminaRegen++;
            break;
    }
    upgradeScreen = false;

    availableUpgrades = [];

    if (currentPhase === 1) {
        startPhase2();
    } else if (currentPhase === 2) {
        startPhase3();
    } else if (currentPhase === 3) {
        startPhase4();
    }
}

function render() {

    if (inMenu) {
        drawMenu();
        return;
    }

    if (gameOver) {

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        drawGameOverScreen();
        return;
    }

    if (upgradeScreen) {

        ctx.setTransform(1, 0, 0, 1, 0, 0);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        drawUpgradeScreen();
        return;
    }

    ctx.save();
    ctx.translate(screenShake.x, screenShake.y);

    ctx.clearRect(-10, -10, canvas.width + 20, canvas.height + 20);

    let currentBackground = backgroundImage;
    if (currentPhase === 2 && backgroundPhase2.complete && backgroundPhase2.naturalWidth > 0) {
        currentBackground = backgroundPhase2;
    } else if (currentPhase === 3 && backgroundPhase3.complete && backgroundPhase3.naturalWidth > 0) {
        currentBackground = backgroundPhase3;
    } else if (currentPhase === 4 && backgroundPhase4.complete && backgroundPhase4.naturalWidth > 0) {
        currentBackground = backgroundPhase4;
    }

    if (currentBackground.complete && currentBackground.naturalWidth > 0) {
        ctx.drawImage(currentBackground, 0, 0, canvas.width, canvas.height);
    } else {

        ctx.fillStyle = '#1e1e3e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    particles.forEach(p => p.draw());

    fireProjectiles.forEach(fire => fire.draw());

    powerUps.forEach(p => p.draw());

    dragon1.draw();
    enemyDragons.forEach(enemy => enemy.draw());

    damageNumbers.forEach(d => d.draw());

    ctx.restore();

    if (dragon1.comboCount > 0) {
        const barY = dragon1.y - 50;
        const comboX = dragon1.x + dragon1.width / 2;
        const comboY = barY - 45;

        ctx.font = 'bold 22px Arial';
        ctx.fillStyle = '#ff00ff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        const comboText = `${dragon1.comboCount}x COMBO!`;
        ctx.strokeText(comboText, comboX, comboY);
        ctx.fillText(comboText, comboX, comboY);
    }

    enemyDragons.forEach(enemy => {
        if (enemy.comboCount > 0) {
            const barY = enemy.y - 50;
            const comboX = enemy.x + enemy.width / 2;
            const comboY = barY - 45;
            ctx.font = 'bold 22px Arial';
            ctx.fillStyle = '#ff00ff';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            const comboText = `${enemy.comboCount}x COMBO!`;
            ctx.strokeText(comboText, comboX, comboY);
            ctx.fillText(comboText, comboX, comboY);
        }
    });

    drawHUD();

    if (phaseTransition) {
        const alpha = Math.min(phaseTransitionTimer / 60, 1);
        ctx.fillStyle = `rgba(0, 0, 0, ${0.8 * alpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const gradient = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, 0,
            canvas.width / 2, canvas.height / 2, 400
        );
        gradient.addColorStop(0, `rgba(255, 215, 0, ${0.4 * alpha})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const nextPhase = currentPhase + 1;
        ctx.font = 'bold 72px Arial';
        ctx.fillStyle = '#ffd700';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 5;
        ctx.textAlign = 'center';
        ctx.globalAlpha = alpha;
        ctx.strokeText(`FASE ${nextPhase}`, canvas.width / 2, canvas.height / 2 - 80);
        ctx.fillText(`FASE ${nextPhase}`, canvas.width / 2, canvas.height / 2 - 80);

        ctx.font = 'bold 36px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;

        let phaseText = '';
        if (nextPhase === 2) {
            phaseText = 'Dragão Lendário Aparece!';
        } else if (nextPhase === 3) {
            phaseText = 'Dragão Épico Aparece!';
        } else if (nextPhase === 4) {
            phaseText = 'Dragão Supremo Aparece!';
        }
        ctx.strokeText(phaseText, canvas.width / 2, canvas.height / 2);
        ctx.fillText(phaseText, canvas.width / 2, canvas.height / 2);

        ctx.font = '24px Arial';
        ctx.fillStyle = '#cccccc';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        let warningText = '';
        if (nextPhase === 3) {
            warningText = 'A batalha está ficando difícil!';
        } else if (nextPhase === 4) {
            warningText = 'A batalha final! Dificuldade máxima!';
        } else {
            warningText = 'Prepare-se para a batalha!';
        }
        ctx.strokeText(warningText, canvas.width / 2, canvas.height / 2 + 60);
        ctx.fillText(warningText, canvas.width / 2, canvas.height / 2 + 60);
        ctx.globalAlpha = 1;
    }

    if (isPaused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.font = 'bold 64px Arial';
        ctx.fillStyle = '#ffff00';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.textAlign = 'center';
        ctx.strokeText('PAUSADO', canvas.width / 2, canvas.height / 2 - 50);
        ctx.fillText('PAUSADO', canvas.width / 2, canvas.height / 2 - 50);

        ctx.font = '24px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeText('Pressione P para continuar', canvas.width / 2, canvas.height / 2 + 30);
        ctx.fillText('Pressione P para continuar', canvas.width / 2, canvas.height / 2 + 30);
    }

}

function drawGameOverScreen() {

    if (winner !== dragon1.name) {

        if (gameOverBackgroundImage.complete && gameOverBackgroundImage.naturalWidth > 0) {

            ctx.drawImage(gameOverBackgroundImage, 0, 0, canvas.width, canvas.height);

            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else {

            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    } else {

        if (victoryBackgroundImage.complete && victoryBackgroundImage.naturalWidth > 0) {

            ctx.drawImage(victoryBackgroundImage, 0, 0, canvas.width, canvas.height);

            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else {

            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    }

    ctx.font = 'bold 72px Arial';
    ctx.fillStyle = winner === dragon1.name ? '#ffd700' : '#ff0000';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 5;
    ctx.textAlign = 'center';
    const titleText = winner === dragon1.name ? 'VITÓRIA!' : 'DERROTA!';
    ctx.strokeText(titleText, canvas.width / 2, 120);
    ctx.fillText(titleText, canvas.width / 2, 120);

    ctx.font = 'bold 32px Arial';
    ctx.fillStyle = 'white';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.strokeText(`${winner} venceu!`, canvas.width / 2, 180);
    ctx.fillText(`${winner} venceu!`, canvas.width / 2, 180);

    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.textAlign = 'left';

    const statsY = 250;
    const statsSpacing = 35;
    ctx.strokeText(`Pontuação: ${score.toLocaleString()}`, canvas.width / 2 - 200, statsY);
    ctx.fillText(`Pontuação: ${score.toLocaleString()}`, canvas.width / 2 - 200, statsY);

    ctx.strokeText(`Melhor Pontuação: ${bestScore.toLocaleString()}`, canvas.width / 2 - 200, statsY + statsSpacing);
    ctx.fillText(`Melhor Pontuação: ${bestScore.toLocaleString()}`, canvas.width / 2 - 200, statsY + statsSpacing);

    ctx.strokeText(`Tempo: ${Math.floor(gameTime / 60)}:${String(Math.floor(gameTime % 60)).padStart(2, '0')}`, canvas.width / 2 - 200, statsY + statsSpacing * 2);
    ctx.fillText(`Tempo: ${Math.floor(gameTime / 60)}:${String(Math.floor(gameTime % 60)).padStart(2, '0')}`, canvas.width / 2 - 200, statsY + statsSpacing * 2);

    ctx.strokeText(`Dano Causado: ${totalDamageDealt}`, canvas.width / 2 - 200, statsY + statsSpacing * 3);
    ctx.fillText(`Dano Causado: ${totalDamageDealt}`, canvas.width / 2 - 200, statsY + statsSpacing * 3);

    ctx.strokeText(`Dano Recebido: ${totalDamageTaken}`, canvas.width / 2 - 200, statsY + statsSpacing * 4);
    ctx.fillText(`Dano Recebido: ${totalDamageTaken}`, canvas.width / 2 - 200, statsY + statsSpacing * 4);

    ctx.strokeText(`Dragões Derrotados: ${totalKills}`, canvas.width / 2 - 200, statsY + statsSpacing * 5);
    ctx.fillText(`Dragões Derrotados: ${totalKills}`, canvas.width / 2 - 200, statsY + statsSpacing * 5);

    ctx.strokeText(`Fase Alcançada: ${currentPhase}`, canvas.width / 2 - 200, statsY + statsSpacing * 6);
    ctx.fillText(`Fase Alcançada: ${currentPhase}`, canvas.width / 2 - 200, statsY + statsSpacing * 6);

    ctx.textAlign = 'center';
    ctx.font = 'bold 28px Arial';
    ctx.fillStyle = '#ffff00';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.strokeText('Pressione R para reiniciar', canvas.width / 2, canvas.height - 50);
    ctx.fillText('Pressione R para reiniciar', canvas.width / 2, canvas.height - 50);
}

function drawMenu() {

    let currentBackground = backgroundImage;
    if (currentPhase === 2 && backgroundPhase2.complete && backgroundPhase2.naturalWidth > 0) {
        currentBackground = backgroundPhase2;
    } else if (currentPhase === 3 && backgroundPhase3.complete && backgroundPhase3.naturalWidth > 0) {
        currentBackground = backgroundPhase3;
    } else if (currentPhase === 4 && backgroundPhase4.complete && backgroundPhase4.naturalWidth > 0) {
        currentBackground = backgroundPhase4;
    }

    if (currentBackground.complete && currentBackground.naturalWidth > 0) {
        ctx.drawImage(currentBackground, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = '#1e1e3e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = 'bold 96px Arial';
    ctx.fillStyle = '#ffd700';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 6;
    ctx.textAlign = 'center';
    ctx.strokeText('PIXEL WINGS', canvas.width / 2, 150);
    ctx.fillText('PIXEL WINGS', canvas.width / 2, 150);

    ctx.font = 'bold 32px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.strokeText('Pressione ESPAÇO para começar', canvas.width / 2, 220);
    ctx.fillText('Pressione ESPAÇO para começar', canvas.width / 2, 220);

    ctx.font = 'bold 28px Arial';
    ctx.fillStyle = '#ffff00';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeText(`Melhor Pontuação: ${bestScore.toLocaleString()}`, canvas.width / 2, 280);
    ctx.fillText(`Melhor Pontuação: ${bestScore.toLocaleString()}`, canvas.width / 2, 280);

    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#cccccc';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.textAlign = 'left';

    const controlsY = 380;
    const controlsSpacing = 35;
    ctx.strokeText('Controles:', canvas.width / 2 - 300, controlsY);
    ctx.fillText('Controles:', canvas.width / 2 - 300, controlsY);

    ctx.font = '20px Arial';
    ctx.strokeText('Setas (↑↓←→) - Mover', canvas.width / 2 - 300, controlsY + controlsSpacing);
    ctx.fillText('Setas (↑↓←→) - Mover', canvas.width / 2 - 300, controlsY + controlsSpacing);

    ctx.strokeText('Espaço - Ataque Normal', canvas.width / 2 - 300, controlsY + controlsSpacing * 2);
    ctx.fillText('Espaço - Ataque Normal', canvas.width / 2 - 300, controlsY + controlsSpacing * 2);

    ctx.strokeText('Shift + Espaço - Ataque Forte', canvas.width / 2 - 300, controlsY + controlsSpacing * 3);
    ctx.fillText('Shift + Espaço - Ataque Forte', canvas.width / 2 - 300, controlsY + controlsSpacing * 3);

    ctx.strokeText('Shift - Bloquear (consome stamina)', canvas.width / 2 - 300, controlsY + controlsSpacing * 4);
    ctx.fillText('Shift - Bloquear (consome stamina)', canvas.width / 2 - 300, controlsY + controlsSpacing * 4);

    ctx.strokeText('P - Pausar', canvas.width / 2 - 300, controlsY + controlsSpacing * 5);
    ctx.fillText('P - Pausar', canvas.width / 2 - 300, controlsY + controlsSpacing * 5);

    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = '#ffaa00';
    ctx.textAlign = 'center';
    ctx.strokeText('Derrote todos os dragões para vencer!', canvas.width / 2, canvas.height - 100);
    ctx.fillText('Derrote todos os dragões para vencer!', canvas.width / 2, canvas.height - 100);
}

function drawHUD() {

    ctx.font = '14px Arial';
    ctx.fillStyle = '#00ff00';
    ctx.textAlign = 'left';
    ctx.fillText(`FPS: ${fps}`, 10, canvas.height - 10);

    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = '#ffd700';
    ctx.textAlign = 'right';
    ctx.fillText(`FASE ${currentPhase}`, canvas.width - 10, 30);

    ctx.font = 'bold 18px Arial';
    ctx.fillStyle = '#ffff00';
    ctx.fillText(`Pontuação: ${score.toLocaleString()}`, canvas.width - 10, 60);

    ctx.font = '12px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.textAlign = 'left';
    ctx.fillText('Setas: Mover | Espaço: Ataque | Shift+Espaço: Ataque Forte | Shift: Bloquear', 10, canvas.height - 50);
    ctx.fillText('P: Pausar', 10, canvas.height - 30);
}

function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', (e) => {

    if (inMenu) {
        if (e.code === 'Space') {
            inMenu = false;
            gameStartTime = performance.now();
            score = 0;
            totalDamageDealt = 0;
            totalDamageTaken = 0;
            totalKills = 0;
            gameTime = 0;
            e.preventDefault();
        }
        return;
    }

    pressedKeys.add(e.code);

    if (e.code === 'KeyP' && !gameOver && !inMenu) {
        isPaused = !isPaused;
        e.preventDefault();
    }

    if (e.code === 'KeyR' && gameOver) {
        restart();
    }

    if (upgradeScreen) {
        if (e.code === 'Digit1' && availableUpgrades.length > 0) {
            applyUpgrade(availableUpgrades[0].type);
            e.preventDefault();
        } else if (e.code === 'Digit2' && availableUpgrades.length > 1) {
            applyUpgrade(availableUpgrades[1].type);
            e.preventDefault();
        } else if (e.code === 'Digit3' && availableUpgrades.length > 2) {
            applyUpgrade(availableUpgrades[2].type);
            e.preventDefault();
        }
    }

    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE', 'KeyP', 'KeyX', 'ArrowUp', 'ArrowDown',
         'ArrowLeft', 'ArrowRight', 'Space', 'ShiftLeft', 'ShiftRight', 'Digit1', 'Digit2', 'Digit3'].includes(e.code)) {
        e.preventDefault();
    }
});

document.addEventListener('keyup', (e) => {
    pressedKeys.delete(e.code);
});

function drawUpgradeScreen() {

    ctx.setTransform(1, 0, 0, 1, 0, 0);

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const bgGradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 2
    );
    bgGradient.addColorStop(0, 'rgba(255, 215, 0, 0.3)');
    bgGradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.1)');
    bgGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = 'bold 48px Arial';
    ctx.fillStyle = '#ffd700';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.strokeText('ESCOLHA SEU UPGRADE', canvas.width / 2, 120);
    ctx.fillText('ESCOLHA SEU UPGRADE', canvas.width / 2, 120);

    const upgradeY = 380;
    const upgradeSpacing = 220;
    const upgradeStartX = canvas.width / 2 - (upgradeSpacing * 1);

    availableUpgrades.forEach((upgrade, index) => {
        const x = upgradeStartX + index * upgradeSpacing;
        const y = upgradeY;
        const width = 200;
        const height = 250;

        ctx.fillStyle = 'rgba(30, 30, 50, 0.95)';
        ctx.fillRect(x - width / 2, y - height / 2, width, height);

        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 4;
        ctx.strokeRect(x - width / 2, y - height / 2, width, height);

        ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - width / 2 + 2, y - height / 2 + 2, width - 4, height - 4);

        ctx.font = 'bold 48px Arial';
        ctx.fillStyle = '#ffff00';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        const numberX = x - width / 2 + 15;
        const numberY = y - height / 2 + 15;
        ctx.strokeText(`${index + 1}`, numberX, numberY);
        ctx.fillText(`${index + 1}`, numberX, numberY);

        ctx.font = 'bold 22px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        const nameY = y - height / 2 + 50;
        ctx.strokeText(upgrade.name, x, nameY);
        ctx.fillText(upgrade.name, x, nameY);

        ctx.font = '16px Arial';
        ctx.fillStyle = '#cccccc';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        const descLines = upgrade.description.split(' ');
        let currentLine = '';
        let lineY = nameY + 35;
        const maxLineWidth = width - 40;
        descLines.forEach(word => {
            const testLine = currentLine + word + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxLineWidth && currentLine !== '') {
                ctx.strokeText(currentLine.trim(), x, lineY);
                ctx.fillText(currentLine.trim(), x, lineY);
                lineY += 24;
                currentLine = word + ' ';
            } else {
                currentLine = testLine;
            }
        });
        if (currentLine !== '') {
            ctx.strokeText(currentLine.trim(), x, lineY);
            ctx.fillText(currentLine.trim(), x, lineY);
        }
    });

    ctx.font = 'bold 28px Arial';
    ctx.fillStyle = '#ffff00';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.strokeText('Pressione 1, 2 ou 3 para escolher', canvas.width / 2, canvas.height - 80);
    ctx.fillText('Pressione 1, 2 ou 3 para escolher', canvas.width / 2, canvas.height - 80);
}

function startPhase2() {
    currentPhase = 2;
    dragon2Defeated = false;

    dragon1.statusEffects = [];
    dragon1.speedMultiplier = 1.0;

    const healAmount = dragon1.maxHealth * HEALTH_REGEN_BETWEEN_PHASES;
    dragon1.health = Math.min(dragon1.maxHealth, dragon1.health + healAmount);
    dragon1.x = 100;
    dragon1.y = 500;
    dragon1.facingRight = true;

    enemyDragons = [
        new Dragon(1000, 500, 'assets/sprites/flying orange dragon.png', 'Dragão Lendário 1', false),
        new Dragon(1200, 400, 'assets/sprites/flying orange dragon.png', 'Dragão Lendário 2', false)
    ];
    enemyDragons.forEach(enemy => {
        enemy.maxHealth = 150;
        enemy.health = 150;
        enemy.isFlying = true;
        enemy.statusEffects = [];
        enemy.speedMultiplier = 1.0;
        enemy.facingRight = false;
    });

    particles = [];
    damageNumbers = [];
    fireProjectiles = [];
    screenShake = { x: 0, y: 0, intensity: 0 };

    console.log('Fase 2 iniciada!');
}

function startPhase3() {
    currentPhase = 3;
    dragon2Defeated = false;

    dragon1.statusEffects = [];
    dragon1.speedMultiplier = 1.0;

    const healAmount = dragon1.maxHealth * HEALTH_REGEN_BETWEEN_PHASES;
    dragon1.health = Math.min(dragon1.maxHealth, dragon1.health + healAmount);
    dragon1.x = 100;
    dragon1.y = 500;
    dragon1.facingRight = true;

    enemyDragons = [
        new Dragon(1000, 500, 'assets/sprites/blue dragon fly (1).png', 'Dragão Épico 1', false),
        new Dragon(1200, 400, 'assets/sprites/blue dragon fly (1).png', 'Dragão Épico 2', false),
        new Dragon(1000, 600, 'assets/sprites/blue dragon fly (1).png', 'Dragão Épico 3', false)
    ];
    enemyDragons.forEach(enemy => {
        enemy.maxHealth = 200;
        enemy.health = 200;
        enemy.statusEffects = [];
        enemy.speedMultiplier = 1.0;
        enemy.facingRight = false;
        enemy.isFlying = true;
    });

    particles = [];
    damageNumbers = [];
    fireProjectiles = [];
    screenShake = { x: 0, y: 0, intensity: 0 };

    console.log('Fase 3 iniciada!');
}

function startPhase4() {
    currentPhase = 4;
    dragon2Defeated = false;

    dragon1.statusEffects = [];
    dragon1.speedMultiplier = 1.0;

    const healAmount = dragon1.maxHealth * HEALTH_REGEN_BETWEEN_PHASES;
    dragon1.health = Math.min(dragon1.maxHealth, dragon1.health + healAmount);
    dragon1.x = 100;
    dragon1.y = 500;
    dragon1.facingRight = true;

    enemyDragons = [
        new Dragon(1000, 500, 'assets/sprites/flying clean green dragon.png', 'Dragão Supremo 1', false),
        new Dragon(1200, 400, 'assets/sprites/flying clean green dragon.png', 'Dragão Supremo 2', false),
        new Dragon(1000, 600, 'assets/sprites/flying clean green dragon.png', 'Dragão Supremo 3', false),
        new Dragon(1200, 500, 'assets/sprites/flying clean green dragon.png', 'Dragão Supremo 4', false)
    ];
    enemyDragons.forEach(enemy => {
        enemy.maxHealth = 250;
        enemy.health = 250;
        enemy.isFlying = true;
        enemy.statusEffects = [];
        enemy.speedMultiplier = 1.0;
        enemy.facingRight = false;
    });

    particles = [];
    damageNumbers = [];
    fireProjectiles = [];
    screenShake = { x: 0, y: 0, intensity: 0 };

    console.log('Fase 4 iniciada! Dificuldade máxima!');
}

function restart() {

    if (upgradeTimeoutId !== null) {
        clearTimeout(upgradeTimeoutId);
        upgradeTimeoutId = null;
    }

    currentPhase = 1;
    phaseTransition = false;
    phaseTransitionTimer = 0;
    aiDecisionTimer = 0;
    dragon1 = new Dragon(100, 500, 'assets/sprites/image.png', 'Dragão Roxo', true);
    enemyDragons = [
        new Dragon(1000, 500, 'assets/sprites/dragon green flying.png', 'Dragão Verde 1', false),
        new Dragon(1200, 400, 'assets/sprites/dragon green flying.png', 'Dragão Verde 2', false)
    ];
    enemyDragons.forEach(enemy => {
        enemy.facingRight = true;
        enemy.isFlying = true;
    });
    gameOver = false;
    winner = null;
    inMenu = true;
    upgradeScreen = false;
    availableUpgrades = [];
    dragon2Defeated = false;
    particles = [];
    damageNumbers = [];
    fireProjectiles = [];
    screenShake = { x: 0, y: 0, intensity: 0 };
    score = 0;
    totalDamageDealt = 0;
    totalDamageTaken = 0;
    totalKills = 0;
    gameStartTime = 0;
    gameTime = 0;
}

console.log('Jogo iniciado!');
gameLoop();
