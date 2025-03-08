// 平台类
class Platform extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'platform');
        this.setOrigin(0.5);
        this.displayWidth = 100;
        this.displayHeight = 20;
    }

    update() {
        if (this.getData('type') === 'moving') {
            const moveSpeed = this.getData('moveSpeed');
            this.x += moveSpeed * (this.getData('direction') || 1) * 0.02;
            
            if (this.x > 700) {
                this.setData('direction', -1);
            } else if (this.x < 100) {
                this.setData('direction', 1);
            }
        }
    }
}

// 障碍物类
class Obstacle extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'obstacle');
        this.setOrigin(0.5);
        this.displayWidth = 32;
        this.displayHeight = 32;
    }
}

// 徽章类
class Badge extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'badge');
        this.setOrigin(0.5);
        this.displayWidth = 32;
        this.displayHeight = 32;
    }
}

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
        update: update,
        extend: {
            generateInitialPlatforms: generateInitialPlatforms,
            collectBadge: collectBadge,
            hitObstacle: hitObstacle,
            updatePlayerMovement: updatePlayerMovement,
            getHighestPlatformY: getHighestPlatformY,
            updateCamera: updateCamera,
            updateDifficulty: updateDifficulty,
            initTouchControls: initTouchControls,
            gameOver: gameOver,
            initQuizSystem: function() {
                if (this.quizSystem) return; // 防止重复初始化

                this.quizSystem = {
                    questions: [
                        {
                            question: "复旦校训是什么？",
                            options: ["博学而笃志", "自强不息", "厚德载物"],
                            answer: 0
                        },
                        {
                            question: "光华楼建成时间？",
                            options: ["2005", "2010", "2015"],
                            answer: 0
                        },
                        {
                            question: "复旦大学创建于哪一年？",
                            options: ["1905", "1911", "1925"],
                            answer: 0
                        }
                    ],
                    currentQuestion: null,
                    correctAnswers: 0,
                    totalAnswered: 0,
                    
                    showQuestion: () => {
                        if (this.gameState.isGameOver || this.quizSystem.currentQuestion) return;
                        
                        const randomIndex = Math.floor(Math.random() * this.quizSystem.questions.length);
                        this.quizSystem.currentQuestion = this.quizSystem.questions[randomIndex];
                        
                        // 创建问题界面
                        const questionContainer = document.createElement('div');
                        questionContainer.className = 'quiz-container';
                        questionContainer.innerHTML = `
                            <div class="quiz-content">
                                <h3>${this.quizSystem.currentQuestion.question}</h3>
                                <div class="quiz-options">
                                    ${this.quizSystem.currentQuestion.options.map((option, index) => `
                                        <button class="quiz-option" data-index="${index}">${option}</button>
                                    `).join('')}
                                </div>
                            </div>
                        `;
                        
                        // 添加到游戏容器
                        document.getElementById('gameContainer').appendChild(questionContainer);
                        
                        // 暂停游戏
                        this.scene.pause();
                        
                        // 添加选项点击事件
                        questionContainer.querySelectorAll('.quiz-option').forEach(button => {
                            button.addEventListener('click', (e) => {
                                const selectedIndex = parseInt(e.target.dataset.index);
                                this.quizSystem.checkAnswer(selectedIndex);
                                questionContainer.remove();
                                this.scene.resume();
                            });
                        });
                    },
                    
                    checkAnswer: (selectedIndex) => {
                        const correct = selectedIndex === this.quizSystem.currentQuestion.answer;
                        this.quizSystem.totalAnswered++;
                        
                        if (correct) {
                            this.quizSystem.correctAnswers++;
                            this.gameState.score += 100;
                            this.addReward();
                        }
                        
                        this.showAnswerResult(correct);
                        this.quizSystem.currentQuestion = null;
                    }
                };
                
                // 每隔一定时间触发问答
                this.time.addEvent({
                    delay: 30000,
                    callback: () => this.quizSystem.showQuestion(),
                    loop: true
                });
            },
            showAnswerResult: function(correct) {
                const resultContainer = document.createElement('div');
                resultContainer.className = `quiz-result ${correct ? 'correct' : 'incorrect'}`;
                resultContainer.innerHTML = `
                    <div class="result-content">
                        <h3>${correct ? '回答正确！' : '回答错误'}</h3>
                        <p>${correct ? '获得特殊能力加成！' : '继续努力！'}</p>
                    </div>
                `;
                
                document.getElementById('gameContainer').appendChild(resultContainer);
                
                // 3秒后移除结果显示
                setTimeout(() => {
                    resultContainer.remove();
                }, 3000);
            },
            addReward: function() {
                // 根据角色类型给予不同奖励
                const character = localStorage.getItem('selectedCharacter');
                if (character === 'student') {
                    // 学生角色获得临时无敌
                    this.player.setInvincible(5000); // 5秒无敌
                } else if (character === 'cat') {
                    // 猫咪角色获得额外跳跃力
                    this.player.setJumpBoost(1.5, 5000); // 1.5倍跳跃力，持续5秒
                }
            }
        }
    }
};

// 游戏状态
let gameState = {
    score: 0,
    currentHeight: 0,
    difficultyLevel: 1,
    weatherEffects: {
        snow: false,
        rain: false,
        wind: false,
        windForce: 0.5
    },
    platforms: null,
    player: null,
    obstacles: null,
    badges: null,
    cursors: null,
    quizActive: false,
    weatherSystem: null
};

// 预加载资源
function preload() {
    console.log('开始加载游戏资源...');
    
    // 显示加载状态
    const loadingText = this.add.text(400, 300, '加载中...', {
        fontSize: '24px',
        fill: '#ffffff'
    }).setOrigin(0.5);

    // 添加加载进度监听
    this.load.on('progress', (value) => {
        console.log(`加载进度: ${Math.round(value * 100)}%`);
        loadingText.setText(`加载中... ${Math.round(value * 100)}%`);
    });

    // 添加加载完成监听
    this.load.on('complete', () => {
        console.log('所有资源加载完成');
        loadingText.destroy();
    });

    // 加载失败时使用SVG备用图
    this.load.on('loaderror', (file) => {
        console.warn(`无法加载图片: ${file.src}，使用SVG备用图`);
        const svgId = file.key + 'Svg';
        const svgElement = document.getElementById(svgId);
        if (svgElement) {
            const svgString = new XMLSerializer().serializeToString(svgElement);
            const svgUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
            this.textures.addBase64(file.key, svgUrl);
        }
    });

    // 加载图片资源
    this.load.image('student', 'assets/images/climbing-game/characters/student.png');
    this.load.image('cat', 'assets/images/climbing-game/characters/academic-cat.png');
    this.load.image('platform', 'assets/images/climbing-game/items/platform.png');
    this.load.image('badge', 'assets/images/climbing-game/items/badge.png');
    this.load.image('obstacle', 'assets/images/climbing-game/items/obstacle.png');
    this.load.image('background', 'assets/images/climbing-game/building-silhouette.png');
}

// 创建游戏场景
function create() {
    console.log('开始创建游戏场景...');
    
    // 创建背景
    this.add.image(400, 300, 'background').setScale(2);
    
    // 初始化游戏对象组
    this.platforms = this.add.group();
    this.obstacles = this.add.group();
    this.badges = this.add.group();
    
    // 创建玩家角色
    const selectedCharacter = localStorage.getItem('selectedCharacter') || 'student';
    console.log(`创建角色: ${selectedCharacter}`);
    const abilities = characterAbilities[selectedCharacter];
    this.player = this.physics.add.sprite(400, 500, selectedCharacter);
    this.player.setData('abilities', abilities);
    this.player.setCollideWorldBounds(true);
    this.player.setBounce(0.2);
    this.player.setGravityY(300);

    // 添加玩家特殊能力方法
    this.player.setInvincible = (duration) => {
        this.player.setData('invincible', true);
        this.player.setAlpha(0.7);
        this.time.delayedCall(duration, () => {
            this.player.setData('invincible', false);
            this.player.setAlpha(1);
        });
    };

    this.player.setJumpBoost = (multiplier, duration) => {
        const originalJumpForce = this.player.getData('abilities').jumpForce;
        this.player.getData('abilities').jumpForce *= multiplier;
        this.time.delayedCall(duration, () => {
            this.player.getData('abilities').jumpForce = originalJumpForce;
        });
    };
    
    console.log('玩家角色已创建:', selectedCharacter);
    
    // 设置碰撞
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.overlap(this.player, this.badges, this.collectBadge, null, this);
    this.physics.add.overlap(this.player, this.obstacles, this.hitObstacle, null, this);
    
    // 初始化控制
    this.cursors = this.input.keyboard.createCursorKeys();
    this.initTouchControls();
    
    // 初始化分数显示
    this.scoreText = this.add.text(16, 16, '分数: 0', { 
        fontSize: '32px', 
        fill: '#fff',
        stroke: '#000',
        strokeThickness: 4
    });
    
    // 初始化游戏状态
    this.gameState = {
        score: 0,
        isGameOver: false,
        highestY: 0
    };
    
    // 初始化天气系统
    this.weatherSystem = new WeatherSystem(this);
    gameState.weatherSystem = this.weatherSystem;
    
    // 生成初始平台
    this.generateInitialPlatforms();
    
    // 初始化问答系统
    this.initQuizSystem();
    
    console.log('游戏场景创建完成');
}

// 更新游戏状态
function update() {
    if (this.gameState.isGameOver) return;
    
    // 更新天气效果
    this.weatherSystem.update();
    
    // 更新平台
    this.platforms.getChildren().forEach(platform => {
        if (platform.update) platform.update();
    });
    
    // 更新玩家移动
    if (this.cursors.left.isDown) {
        this.player.setVelocityX(-160);
    } else if (this.cursors.right.isDown) {
        this.player.setVelocityX(160);
    } else {
        this.player.setVelocityX(0);
    }
    
    // 跳跃
    if (this.cursors.up.isDown && this.player.body.touching.down) {
        this.player.setVelocityY(-330);
    }
    
    // 更新分数显示
    this.scoreText.setText('分数: ' + this.gameState.score);
    
    // 检查游戏结束条件
    if (this.player.y > 600) {
        this.gameOver();
    }
}

// 游戏结束
function gameOver() {
    console.log('游戏结束');
    this.gameState.isGameOver = true;
    
    // 显示游戏结束文本
    const gameOverText = this.add.text(400, 300, '游戏结束\n点击重新开始', {
        fontSize: '48px',
        fill: '#fff',
        stroke: '#000',
        strokeThickness: 6,
        align: 'center'
    }).setOrigin(0.5);
    
    // 添加点击事件监听器
    this.input.on('pointerdown', () => {
        this.scene.restart();
    });
}

// 玩家移动控制
function updatePlayerMovement() {
    const abilities = this.player.getData('abilities');
    let moveSpeed = 160;
    
    // 应用风力效果
    if (gameState.weatherEffects.wind) {
        moveSpeed += gameState.weatherEffects.windForce * 30;
    }
    
    if (this.cursors.left.isDown) {
        this.player.setVelocityX(-moveSpeed);
        this.player.flipX = true;
    } else if (this.cursors.right.isDown) {
        this.player.setVelocityX(moveSpeed);
        this.player.flipX = false;
    } else {
        // 只有风力效果时的移动
        if (gameState.weatherEffects.wind) {
            this.player.setVelocityX(gameState.weatherEffects.windForce * 30);
        } else {
            this.player.setVelocityX(0);
        }
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
    if (abilities.special === 'wallJump' && (this.player.body.touching.left || this.player.body.touching.right)) {
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

// 天气系统类
class WeatherSystem {
    constructor(scene) {
        this.scene = scene;
        this.snowCanvas = document.createElement('canvas');
        this.rainCanvas = document.createElement('canvas');
        
        // 设置画布样式
        [this.snowCanvas, this.rainCanvas].forEach(canvas => {
            canvas.style.position = 'absolute';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.pointerEvents = 'none';
            canvas.width = gameConfig.width;
            canvas.height = gameConfig.height;
            document.getElementById('gameContainer').appendChild(canvas);
        });

        // 获取上下文并设置willReadFrequently属性
        this.sctx = this.snowCanvas.getContext('2d', { willReadFrequently: true });
        this.rctx = this.rainCanvas.getContext('2d', { willReadFrequently: true });

        // 初始化粒子
        this.snowflakes = Array(80).fill().map(() => new Snowflake(this));
        this.raindrops = Array(150).fill().map(() => new Raindrop(this));

        // 设置初始显示状态
        this.snowCanvas.style.display = 'none';
        this.rainCanvas.style.display = 'none';
    }

    update() {
        // 清除画布
        this.sctx.clearRect(0, 0, gameConfig.width, gameConfig.height);
        this.rctx.clearRect(0, 0, gameConfig.width, gameConfig.height);

        // 更新雪花
        if (gameState.weatherEffects.snow) {
            this.snowflakes.forEach(flake => {
                flake.update();
                flake.draw();
            });
        }

        // 更新雨滴
        if (gameState.weatherEffects.rain) {
            this.raindrops.forEach(drop => {
                drop.update();
                drop.draw();
            });
        }

        // 更新风力
        if (gameState.weatherEffects.wind) {
            // 风力效果会直接影响玩家移动，在updatePlayerMovement中处理
        }
    }

    toggleEffect(effect) {
        switch(effect) {
            case 'snow':
                gameState.weatherEffects.snow = !gameState.weatherEffects.snow;
                this.snowCanvas.style.display = gameState.weatherEffects.snow ? 'block' : 'none';
                break;
            case 'rain':
                gameState.weatherEffects.rain = !gameState.weatherEffects.rain;
                this.rainCanvas.style.display = gameState.weatherEffects.rain ? 'block' : 'none';
                break;
            case 'wind':
                gameState.weatherEffects.wind = !gameState.weatherEffects.wind;
                break;
        }
    }

    setWindForce(direction) {
        if (gameState.weatherEffects.wind) {
            gameState.weatherEffects.windForce = direction;
        }
    }
}

// 雪花类
class Snowflake {
    constructor(system) {
        this.system = system;
        this.reset(true);
    }
    
    reset(initial) {
        this.x = initial ? Math.random() * gameConfig.width : -10;
        this.y = initial ? -Math.random() * 100 : Math.random() * gameConfig.height;
        this.size = Math.random() * 4 + 2;
        this.speedY = Math.random() * 2 + 1;
        this.speedX = (Math.random() - 0.5) * gameState.weatherEffects.windForce * 2;
        this.alpha = Math.random() * 0.5 + 0.5;
    }

    update() {
        this.x += this.speedX + gameState.weatherEffects.windForce;
        this.y += this.speedY;
        if(this.y > gameConfig.height || this.x > gameConfig.width) {
            this.reset(false);
        }
    }

    draw() {
        const ctx = this.system.sctx;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
        ctx.fill();
    }
}

// 雨滴类
class Raindrop {
    constructor(system) {
        this.system = system;
        this.reset(true);
    }

    reset(initial) {
        this.x = initial ? Math.random() * gameConfig.width : -10;
        this.y = initial ? -Math.random() * 100 : Math.random() * gameConfig.height;
        this.length = Math.random() * 15 + 10;
        this.speed = Math.random() * 5 + 8;
        this.trail = [];
    }

    update() {
        this.trail.push({x: this.x, y: this.y});
        if(this.trail.length > 5) this.trail.shift();
        
        this.x += gameState.weatherEffects.windForce * 2;
        this.y += this.speed;
        
        if(this.y > gameConfig.height) {
            this.reset(false);
        }
    }

    draw() {
        const ctx = this.system.rctx;
        
        // 绘制雨滴拖尾
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - gameState.weatherEffects.windForce * 5, this.y - this.length);
        ctx.strokeStyle = `rgba(100, 150, 255, ${0.3 + Math.abs(gameState.weatherEffects.windForce)/2})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        // 绘制雨滴尾迹
        this.trail.forEach((pos, i) => {
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 1, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(100, 150, 255, ${0.2 * (i/this.trail.length)})`;
            ctx.fill();
        });
    }
}

// 收集徽章的函数
function collectBadge(player, badge) {
    badge.destroy();
    gameState.score += 100;
    // TODO: 添加收集动画和音效
}

// 碰到障碍物的函数
function hitObstacle(player, obstacle) {
    gameState.score = Math.max(0, gameState.score - 50);
    obstacle.destroy();
    // TODO: 添加受伤动画和音效
}

// 生成初始平台
function generateInitialPlatforms() {
    console.log('生成初始平台...');
    
    // 创建起始平台
    const startPlatform = new Platform(this, 400, 550);
    this.add.existing(startPlatform);
    this.platforms.add(startPlatform);
    
    // 生成初始平台
    for (let i = 0; i < 5; i++) {
        const x = Phaser.Math.Between(100, 700);
        const y = 550 - (i + 1) * 100;
        const platform = new Platform(this, x, y);
        
        // 随机设置一些平台为移动平台
        if (Math.random() > 0.7) {
            platform.setData('type', 'moving');
            platform.setData('moveSpeed', Phaser.Math.Between(1, 3));
            platform.setData('direction', 1);
        }
        
        this.add.existing(platform);
        this.platforms.add(platform);
    }
    
    console.log('初始平台生成完成');
}

// 获取最高平台的Y坐标
function getHighestPlatformY() {
    let highest = 600;
    this.platforms.children.each(platform => {
        highest = Math.min(highest, platform.y);
    });
    return highest;
}

// 更新相机位置
function updateCamera() {
    if (this.player.y < this.cameras.main.scrollY + 300) {
        this.cameras.main.scrollY = this.player.y - 300;
        gameState.currentHeight = Math.max(0, Math.floor((-this.cameras.main.scrollY + 600) / 100));
    }
}

// 更新难度
function updateDifficulty() {
    gameState.difficultyLevel = 1 + Math.floor(gameState.currentHeight / 10) * 0.1;
}

// 初始化触控控制
function initTouchControls() {
    // 添加触控区域
    const touchArea = this.add.rectangle(0, 0, gameConfig.width, gameConfig.height, 0x000000, 0);
    touchArea.setOrigin(0);
    touchArea.setAlpha(0.001);
    touchArea.setInteractive();

    let touchStartX = 0;
    touchArea.on('pointerdown', (pointer) => {
        touchStartX = pointer.x;
    });

    touchArea.on('pointermove', (pointer) => {
        if (pointer.isDown) {
            const deltaX = pointer.x - touchStartX;
            if (Math.abs(deltaX) > 30) {
                this.player.setVelocityX(Math.sign(deltaX) * 160);
            }
        }
    });

    touchArea.on('pointerup', () => {
        this.player.setVelocityX(0);
    });

    // 添加跳跃按钮
    const jumpButton = this.add.circle(700, 500, 40, 0xffffff, 0.5);
    jumpButton.setInteractive();
    jumpButton.on('pointerdown', () => {
        if (this.player.body.touching.down) {
            this.player.setVelocityY(this.player.getData('abilities').jumpForce);
        }
    });
}

// 初始化游戏
let game = new Phaser.Game(gameConfig);

// 导出游戏状态供外部访问
window.gameState = gameState; 