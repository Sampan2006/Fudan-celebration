// 游戏配置
const config = {
    type: Phaser.AUTO,
    parent: 'gameContainer',
    width: 800,
    height: 600,
    backgroundColor: '#87CEEB',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false,
            debugShowBody: false,
            debugShowStaticBody: false,
            debugShowVelocity: false
        }
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    render: {
        pixelArt: false,
        antialias: true,
        roundPixels: true
    },
    dom: {
        createContainer: true
    },
    transparent: true
};

// 游戏变量
let player;
let platforms;
let badges;
let books;
let scarves;
let papers;
let winds;
let score = 0;
let scoreText;
let gameOver = false;
let currentBackground;
let buildingLayer;
let highestScore = 0;
let isJumping = false;
let jumpTimer = 0;
let playerInvincible = false;
let academicLight = false;
let knowledgeAura = false;
let leaderboard = [];
let loadingText;
let cursors;

// 创建游戏实例
const game = new Phaser.Game(config);

// 预加载资源
function preload() {
    // 显示加载进度
    const loadingDiv = document.getElementById('loading');
    if (loadingDiv) {
        loadingDiv.style.display = 'block';
        this.load.on('progress', function (value) {
            loadingDiv.innerHTML = '加载中... ' + Math.round(value * 100) + '%';
        });
        this.load.on('complete', function () {
            loadingDiv.style.display = 'none';
        });
    }

    // 加载游戏资源
    if (window.gameAssets) {
        this.load.image('player', window.gameAssets.player);
        this.load.image('platform', window.gameAssets.platform);
        this.load.image('badge', window.gameAssets.badge);
        this.load.image('bg_day', window.gameAssets.bg_day);
        this.load.image('building', window.gameAssets.building);
    }
}

// 创建游戏场景
function create() {
    try {
        console.log('Creating game scene...');
        
        // 创建背景
        currentBackground = this.add.image(400, 300, 'bg_day');
        currentBackground.setDisplaySize(800, 600);
        console.log('Background created');
        
        // 创建建筑物
        buildingLayer = this.add.image(400, 450, 'building');
        buildingLayer.setScale(0.8);
        console.log('Building created');

        // 创建玩家
        player = this.physics.add.sprite(100, 450, 'player');
        player.setBounce(0.2);
        player.setCollideWorldBounds(true);
        player.setSize(30, 48);
        console.log('Player created');
        
        // 生成平台
        platforms = this.physics.add.staticGroup();
        // 创建底部平台
        const bottomPlatform = platforms.create(400, 568, 'platform');
        bottomPlatform.setScale(2).refreshBody();
        console.log('Bottom platform created');
        
        // 生成初始平台
        const initialPlatforms = [
            { x: 600, y: 400 },
            { x: 50, y: 250 },
            { x: 750, y: 220 },
            { x: 400, y: 320 },
            { x: 200, y: 180 }
        ];
        
        initialPlatforms.forEach(pos => {
            platforms.create(pos.x, pos.y, 'platform');
        });
        console.log('Initial platforms created');
        
        // 生成初始校徽
        badges = this.physics.add.group();
        const initialBadges = [
            { x: 300, y: 200 },
            { x: 500, y: 300 },
            { x: 700, y: 150 }
        ];
        
        initialBadges.forEach(pos => {
            const badge = badges.create(pos.x, pos.y, 'badge');
            badge.setBounceY(0.4);
            badge.setCollideWorldBounds(true);
        });
        console.log('Initial badges created');
        
        // 设置碰撞
        this.physics.add.collider(player, platforms);
        this.physics.add.overlap(player, badges, collectBadge, null, this);
        console.log('Collisions set up');
        
        // 创建分数文本
        scoreText = this.add.text(16, 16, '分数: 0', { 
            fontSize: '32px', 
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 4
        });
        console.log('Score text created');
        
        // 设置控制器
        cursors = this.input.keyboard.createCursorKeys();
        setupControls.call(this);
        console.log('Controls set up');
        
    } catch (error) {
        console.error('Error in create function:', error);
    }
}

// 设置控制
function setupControls() {
    // 键盘控制
    this.input.keyboard.on('keydown-LEFT', function() {
        player.setVelocityX(-200);
    });
    
    this.input.keyboard.on('keydown-RIGHT', function() {
        player.setVelocityX(200);
    });
    
    this.input.keyboard.on('keydown-A', function() {
        player.setVelocityX(-200);
    });
    
    this.input.keyboard.on('keydown-D', function() {
        player.setVelocityX(200);
    });
    
    this.input.keyboard.on('keyup', function(event) {
        if (event.keyCode === 37 || event.keyCode === 39 || event.keyCode === 65 || event.keyCode === 68) {
            player.setVelocityX(0);
        }
    });
    
    // 触摸/鼠标控制
    this.input.on('pointermove', function(pointer) {
        if (pointer.isDown) {
            const moveThreshold = 50;
            const centerX = config.width / 2;
            const diff = pointer.x - centerX;
            
            if (Math.abs(diff) > moveThreshold) {
                const speed = (diff > 0) ? 200 : -200;
                player.setVelocityX(speed);
            } else {
                player.setVelocityX(0);
            }
        }
    });
}

// 更新函数
function update() {
    if (gameOver) {
        return;
    }
    
    // 更新分数和最高层
    let height = Math.floor((550 - player.y) / 50);
    if (height > highestScore) {
        highestScore = height;
        score = height * 10;
        scoreText.setText('分数: ' + score + '\n最高层: ' + highestScore);
        
        // 更新背景和建筑
        updateBackground(height);
        updateBuilding(height);
    }
    
    // 检查游戏结束
    if (player.y > 580) {
        endGame.call(this);
    }
    
    // 更新特殊效果
    updateEffects();
}

// 自动跳跃系统
function autoJump() {
    if (player.body.touching.down && !isJumping) {
        player.setVelocityY(-500);
        isJumping = true;
        this.time.delayedCall(500, () => {
            isJumping = false;
        });
    }
}

// 平台着陆检测
function landOnPlatform(player, platform) {
    if (platform.texture.key === 'platform_break' && player.body.touching.down) {
        this.time.delayedCall(200, () => {
            platform.destroy();
        });
    }
}

// 生成平台和物品
function generatePlatforms(scene) {
    // 底部平台
    platforms.create(400, 568, 'platform').setScale(2).refreshBody();
    
    // 生成随机平台
    const platformPositions = [
        { x: 600, y: 400 },
        { x: 50, y: 250 },
        { x: 750, y: 220 },
        { x: 400, y: 320 },
        { x: 200, y: 180 }
    ];
    
    platformPositions.forEach(pos => {
        platforms.create(pos.x, pos.y, 'platform');
    });
}

function generateBadges(scene) {
    const badgePositions = [
        { x: 300, y: 200 },
        { x: 500, y: 300 },
        { x: 700, y: 150 },
        { x: 100, y: 350 },
        { x: 400, y: 250 }
    ];
    
    badgePositions.forEach(pos => {
        const badge = badges.create(pos.x, pos.y, 'badge');
        badge.setBounceY(0.4);
        badge.setCollideWorldBounds(true);
    });
    
    scene.physics.add.collider(badges, platforms);
}

// 更新背景
function updateBackground(height) {
    if (!currentBackground) return;
    
    if (height > 20 && currentBackground.texture.key !== 'bg_sunset') {
        currentBackground.setTexture('bg_sunset');
    } else if (height > 40 && currentBackground.texture.key !== 'bg_night') {
        currentBackground.setTexture('bg_night');
    }
}

// 更新建筑
function updateBuilding(height) {
    if (!buildingLayer) return;
    
    const scale = Math.max(0.3, 1 - (height / 100));
    buildingLayer.setScale(scale);
}

// 特殊效果更新
function updateEffects() {
    if (academicLight) {
        player.setTint(0xffff00);
    } else if (knowledgeAura) {
        player.setTint(0x00ffff);
    } else if (playerInvincible) {
        player.setTint(0xff0000);
    } else {
        player.clearTint();
    }
}

// 收集物品函数
function collectBadge(player, badge) {
    badge.destroy();
    score += 50;
    updateScore();
}

function collectScarf(player, scarf) {
    scarf.destroy();
    score += 100;
    playerInvincible = true;
    updateScore();
    
    this.time.delayedCall(5000, () => {
        playerInvincible = false;
    });
}

function collectAcademicLight(player, light) {
    light.destroy();
    academicLight = true;
    player.setVelocityY(-1000);
    
    this.time.delayedCall(3000, () => {
        academicLight = false;
    });
}

function collectKnowledgeAura(player, aura) {
    aura.destroy();
    knowledgeAura = true;
    player.setVelocityX(player.body.velocity.x * 1.5);
    
    this.time.delayedCall(5000, () => {
        knowledgeAura = false;
    });
}

// 障碍物碰撞函数
function hitObstacle(player, obstacle) {
    if (playerInvincible) {
        obstacle.destroy();
        return;
    }
    
    obstacle.destroy();
    player.setVelocityY(200);
    score -= 30;
    if (score < 0) score = 0;
    updateScore();
}

function hitWind(player, wind) {
    if (playerInvincible) {
        wind.destroy();
        return;
    }
    
    wind.destroy();
    if (!knowledgeAura) {
        player.setVelocityX(Phaser.Math.Between(-300, 300));
    }
}

// 分数更新
function updateScore() {
    scoreText.setText('分数: ' + score + '\n最高层: ' + highestScore);
}

// 游戏结束
function endGame() {
    gameOver = true;
    
    // 显示结束界面
    const gameOverText = this.add.text(400, 250, '游戏结束', {
        fontSize: '48px',
        fill: '#fff',
        stroke: '#000',
        strokeThickness: 6,
        align: 'center'
    }).setOrigin(0.5);
    
    const finalScore = this.add.text(400, 320, 
        '最终分数: ' + score + '\n最高层数: ' + highestScore, {
        fontSize: '32px',
        fill: '#fff',
        stroke: '#000',
        strokeThickness: 4,
        align: 'center'
    }).setOrigin(0.5);
    
    // 更新排行榜
    updateLeaderboard(score, highestScore);
    
    // 显示重新开始按钮
    const restartButton = this.add.text(400, 400, '点击重新开始', {
        fontSize: '36px',
        fill: '#fff',
        backgroundColor: '#000',
        padding: { x: 20, y: 10 },
        stroke: '#000',
        strokeThickness: 4
    }).setOrigin(0.5).setInteractive();
    
    restartButton.on('pointerdown', () => {
        gameOver = false;
        score = 0;
        highestScore = 0;
        this.scene.restart();
    });
}

// 排行榜功能
function loadLeaderboard() {
    const savedLeaderboard = localStorage.getItem('leaderboard');
    if (savedLeaderboard) {
        leaderboard = JSON.parse(savedLeaderboard);
    }
}

function updateLeaderboard(score, height) {
    leaderboard.push({
        score: score,
        height: height,
        date: new Date().toISOString()
    });
    
    // 按分数排序
    leaderboard.sort((a, b) => b.score - a.score);
    
    // 只保留前10名
    leaderboard = leaderboard.slice(0, 10);
    
    // 保存到本地存储
    localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
}

// 问答系统
const questions = [
    { q: "复旦大学创办于哪一年？", a: "1905" },
    { q: "复旦校训是什么？", a: "博学而笃志，切问而近思" },
    { q: "复旦大学的校歌是谁作词的？", a: "李叔同" },
    { q: "复旦大学的第一任校长是谁？", a: "马相伯" },
    { q: "复旦大学的校名出自哪里？", a: "《尚书大传》" },
    { q: "复旦大学现任校长是谁？", a: "金力" },
    { q: "复旦大学的校色是什么？", a: "复旦红" }
];

function showQuestion(player, paper) {
    if (playerInvincible) {
        paper.destroy();
        return;
    }
    
    paper.destroy();
    let qIndex = Phaser.Math.Between(0, questions.length - 1);
    let question = questions[qIndex];
    
    // 创建半透明背景
    let questionBox = this.add.rectangle(400, 300, 600, 200, 0x000000, 0.8);
    
    // 创建问题文本
    let questionText = this.add.text(100, 250, question.q, {
        fontSize: '24px',
        fill: '#fff',
        wordWrap: { width: 600 }
    });
    
    // 创建输入框
    let input = document.createElement('input');
    input.style.position = 'absolute';
    input.style.left = '300px';
    input.style.top = '350px';
    input.style.width = '200px';
    input.style.fontSize = '18px';
    input.style.padding = '5px';
    document.body.appendChild(input);
    input.focus();
    
    // 处理答案提交
    input.onkeydown = (e) => {
        if (e.key === 'Enter') {
            const isCorrect = input.value === question.a;
            
            if (isCorrect) {
                score += 100;
                player.setTint(0x00ff00);
                player.setVelocityY(-600);
            } else {
                score -= 50;
                if (score < 0) score = 0;
                player.setTint(0xff0000);
                player.setVelocityY(200);
            }
            
            updateScore();
            
            // 清理UI
            questionBox.destroy();
            questionText.destroy();
            document.body.removeChild(input);
            
            // 清除着色效果
            this.time.delayedCall(1000, () => {
                player.clearTint();
            });
        }
    };
} 