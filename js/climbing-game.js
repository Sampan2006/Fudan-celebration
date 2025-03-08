// 游戏核心配置
const gameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'gameContainer',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

// 游戏状态
let gameState = {
    score: 0,
    currentHeight: 0,
    difficultyLevel: 1,
    weatherEffects: [],
    platforms: null,
    player: null,
    obstacles: null,
    badges: null,
    cursors: null,
    quizActive: false
};

// 预加载资源
function preload() {
    // 加载角色资源
    this.load.image('student', 'assets/images/student.png');
    this.load.image('cat', 'assets/images/academic-cat.png');
    this.load.image('platform', 'assets/images/platform.png');
    this.load.image('badge', 'assets/images/badge.png');
    this.load.image('obstacle', 'assets/images/obstacle.png');
    
    // 加载天气效果
    this.load.image('rain', 'assets/images/rain.png');
    this.load.image('snow', 'assets/images/snow.png');
    this.load.image('wind', 'assets/images/wind.png');
}

// 创建游戏场景
function create() {
    // 初始化对象池
    this.objectPools = new ObjectPool(this, [
        { key: 'platform', classType: Platform, size: 30 },
        { key: 'obstacle', classType: Obstacle, size: 20 },
        { key: 'badge', classType: Badge, size: 10 }
    ]);

    // 初始化玩家
    const character = localStorage.getItem('selectedCharacter') || 'student';
    const abilities = characterAbilities[character];
    this.player = this.physics.add.sprite(400, 500, character);
    this.player.setData('abilities', abilities);
    
    // 初始化平台
    this.platforms = this.physics.add.staticGroup();
    this.generateInitialPlatforms();
    
    // 初始化障碍物和徽章
    this.obstacles = this.physics.add.group();
    this.badges = this.physics.add.group();
    
    // 设置碰撞
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.overlap(this.player, this.badges, collectBadge, null, this);
    this.physics.add.overlap(this.player, this.obstacles, hitObstacle, null, this);
    
    // 初始化控制器
    this.cursors = this.input.keyboard.createCursorKeys();
    this.initTouchControls();
    
    // 初始化天气系统
    this.initWeatherSystem();
    
    // 初始化问答系统
    this.initQuizSystem();
}

// 更新游戏状态
function update() {
    // 更新玩家移动
    this.updatePlayerMovement();
    
    // 更新相机位置
    this.updateCamera();
    
    // 生成新平台
    this.generatePlatforms();
    
    // 更新难度
    this.updateDifficulty();
    
    // 更新天气效果
    this.updateWeatherEffects();
}

// 玩家移动控制
function updatePlayerMovement() {
    const abilities = this.player.getData('abilities');
    
    if (this.cursors.left.isDown) {
        this.player.setVelocityX(-160);
        this.player.flipX = true;
    } else if (this.cursors.right.isDown) {
        this.player.setVelocityX(160);
        this.player.flipX = false;
    } else {
        this.player.setVelocityX(0);
    }
    
    // 跳跃逻辑
    if (this.cursors.up.isDown && this.player.body.touching.down) {
        this.player.setVelocityY(abilities.jumpForce);
    }
    
    // 双跳能力
    if (abilities.doubleJump && this.cursors.up.isDown && !this.player.body.touching.down && !this.player.hasDoubleJumped) {
        this.player.setVelocityY(abilities.jumpForce * 0.7);
        this.player.hasDoubleJumped = true;
    }
    
    // 墙壁跳跃能力
    if (abilities.special === 'wallJump' && this.player.body.touching.left || this.player.body.touching.right) {
        if (this.cursors.up.isDown) {
            this.player.setVelocityY(abilities.jumpForce);
            this.player.setVelocityX(this.player.body.touching.left ? 300 : -300);
        }
    }
    
    // 重置双跳状态
    if (this.player.body.touching.down) {
        this.player.hasDoubleJumped = false;
    }
}

// 平台生成系统
function generatePlatforms() {
    const strategy = this.platformGenerationStrategy;
    const spacing = strategy.dynamicAdjust(gameState.currentHeight);
    
    // 移除屏幕外的平台
    this.platforms.children.each(platform => {
        if (platform.y > this.cameras.main.scrollY + 800) {
            platform.destroy();
        }
    });
    
    // 生成新平台
    while (this.getHighestPlatformY() > this.cameras.main.scrollY - 300) {
        const x = Phaser.Math.Between(100, 700);
        const y = this.getHighestPlatformY() - spacing;
        const platform = this.objectPools.acquire('platform');
        platform.setPosition(x, y);
        
        // 根据难度设置平台特性
        if (Math.random() < 0.2 * gameState.difficultyLevel) {
            platform.setData('type', 'moving');
            platform.setData('moveSpeed', 100 * gameState.difficultyLevel);
        }
    }
}

// 问答系统
class QuizSystem {
    constructor(scene) {
        this.scene = scene;
        this.questions = [
            {
                question: "复旦校训中的下半句是？",
                options: ["博学而笃志", "切问而近思", "自强不息", "厚德载物"],
                correct: 1
            },
            {
                question: "复旦大学创建于哪一年？",
                options: ["1905年", "1915年", "1925年", "1935年"],
                correct: 0
            },
            // 更多问题...
        ];
    }
    
    showQuiz() {
        if (gameState.quizActive) return;
        
        gameState.quizActive = true;
        const question = Phaser.Utils.Array.GetRandom(this.questions);
        
        // 创建问答界面
        const modal = this.scene.add.container(400, 300);
        const bg = this.scene.add.rectangle(0, 0, 600, 400, 0x000000, 0.8);
        const text = this.scene.add.text(0, -150, question.question, {
            fontSize: '24px',
            fill: '#ffffff',
            align: 'center'
        });
        
        // 创建选项按钮
        const buttons = question.options.map((option, index) => {
            const button = this.scene.add.text(0, -50 + index * 50, option, {
                fontSize: '20px',
                fill: '#ffffff',
                backgroundColor: '#b71c1c',
                padding: { x: 20, y: 10 }
            }).setInteractive();
            
            button.on('pointerdown', () => {
                this.handleAnswer(index === question.correct, modal);
            });
            
            return button;
        });
        
        modal.add([bg, text, ...buttons]);
        this.scene.physics.pause();
    }
    
    handleAnswer(correct, modal) {
        gameState.quizActive = false;
        this.scene.physics.resume();
        
        if (correct) {
            gameState.score += 500;
            this.scene.player.setVelocityY(-600);
        }
        
        modal.destroy();
    }
}

// 天气系统
class WeatherSystem {
    constructor(scene) {
        this.scene = scene;
        this.currentEffect = null;
        this.effectDuration = 0;
    }
    
    update() {
        if (this.effectDuration > 0) {
            this.effectDuration--;
        } else if (Math.random() < 0.001 * gameState.difficultyLevel) {
            this.startRandomEffect();
        }
    }
    
    startRandomEffect() {
        const effects = ['rain', 'snow', 'wind'];
        const effect = Phaser.Utils.Array.GetRandom(effects);
        
        switch (effect) {
            case 'rain':
                this.startRain();
                break;
            case 'snow':
                this.startSnow();
                break;
            case 'wind':
                this.startWind();
                break;
        }
        
        this.effectDuration = 300;
    }
    
    startRain() {
        this.currentEffect = this.scene.add.particles('rain');
        this.currentEffect.createEmitter({
            x: { min: 0, max: 800 },
            y: 0,
            lifespan: 2000,
            speedY: { min: 200, max: 400 },
            scale: { start: 0.1, end: 0.4 },
            quantity: 4,
            blendMode: 'ADD'
        });
    }
    
    startSnow() {
        this.currentEffect = this.scene.add.particles('snow');
        this.currentEffect.createEmitter({
            x: { min: 0, max: 800 },
            y: 0,
            lifespan: 3000,
            speedY: { min: 50, max: 100 },
            scale: { start: 0.1, end: 0 },
            quantity: 2,
            blendMode: 'ADD'
        });
    }
    
    startWind() {
        const direction = Math.random() < 0.5 ? -1 : 1;
        this.scene.player.setData('windForce', direction * 50);
        
        this.currentEffect = this.scene.add.particles('wind');
        this.currentEffect.createEmitter({
            x: direction > 0 ? 0 : 800,
            y: { min: 0, max: 600 },
            lifespan: 2000,
            speedX: direction * 400,
            scale: { start: 0.2, end: 0 },
            quantity: 2,
            blendMode: 'ADD'
        });
    }
    
    stopEffect() {
        if (this.currentEffect) {
            this.currentEffect.destroy();
            this.currentEffect = null;
        }
        this.scene.player.setData('windForce', 0);
    }
}

// 初始化游戏
let game = new Phaser.Game(gameConfig); 