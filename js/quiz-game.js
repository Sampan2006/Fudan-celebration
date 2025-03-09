// 游戏基础配置
const GAME_BASE_CONFIG = {
    DAILY_CHALLENGE: {
        enabled: true,
        attempts: 10,
        streakBonus: [5, 10, 20]
    },
    COMBO_SYSTEM: {
        baseScore: 2,
        maxMultiplier: 5,
        decayTime: 5000,
        multipliers: [1.2, 1.5, 2.0],
        colors: ['#ffd700', '#ff6b6b', '#4caf50']
    },
    DYNAMIC_DIFFICULTY: {
        correctBoost: 0.2,
        wrongPenalty: -0.3,
        minDifficulty: 0.5,
        maxDifficulty: 2.5
    },
    TIME_LIMIT: 60000,
    TIME_PER_QUESTION: 15000
};

// 关卡配置
const GAME_LEVELS = {
    BASIC: {
        id: 1,
        name: "基础校史",
        description: "了解复旦的基本历史",
        requiredScore: 0,
        minCorrectRate: 0.6,
        questions: []
    },
    EVENTS: {
        id: 2,
        name: "学校事件",
        description: "探索复旦的重要历史事件",
        requiredScore: 100,
        minCorrectRate: 0.7,
        questions: []
    },
    ACHIEVEMENTS: {
        id: 3,
        name: "复旦成就",
        description: "了解复旦的杰出校友与科研成果",
        requiredScore: 200,
        minCorrectRate: 0.8,
        questions: []
    },
    CHALLENGE: {
        id: 4,
        name: "挑战模式",
        description: "终极校史挑战",
        requiredScore: 300,
        minCorrectRate: 0.9,
        questions: []
    }
};

// 成就系统配置
const GAME_ACHIEVEMENTS = {
    RANKS: [
        { name: "初学者", minScore: 0, icon: "🌱" },
        { name: "勤学者", minScore: 50, icon: "📚" },
        { name: "优等生", minScore: 100, icon: "🎓" },
        { name: "学霸", minScore: 150, icon: "🏆" },
        { name: "校史通", minScore: 200, icon: "👑" }
    ],
    SPECIAL: [
        { name: "完美答题", condition: "全部正确", icon: "✨" },
        { name: "神速答题", condition: "平均答题时间<3秒", icon: "⚡" },
        { name: "连击大师", condition: "达成5连击", icon: "🔥" },
        { name: "百分百完成", condition: "完成所有题目", icon: "🌟" }
    ]
};

// 合并所有配置
const GAME_CONFIG = Object.assign({}, GAME_BASE_CONFIG, {
    LEVELS: GAME_LEVELS,
    ACHIEVEMENTS: GAME_ACHIEVEMENTS
});

// 游戏状态
let gameState = {
    currentCombo: 0,
    comboTimeout: null,
    difficultyFactor: 1,
    timeAttackMode: false,
    score: 0,
    correctAnswers: 0,
    totalAnswers: 0,
    streakMultiplier: 1,
    maxCombo: 0,
    startTime: null,
    endTime: null,
    currentLevel: null,
    unlockedLevels: new Set([1]),
    levelProgress: {},
    dailyChallenge: {
        currentStreak: 0,
        remainingAttempts: GAME_CONFIG.DAILY_CHALLENGE.attempts
    },
    lastQuestionIndex: null,
    usedQuestions: new Set(),
    achievements: []
};

// 初始化题库
function initQuestions() {
    const questions = {
        BASIC: [
            {
                type: "text",
                question: "复旦大学创建于哪一年？",
                options: ["1900年", "1905年", "1910年", "1915年"],
                correct: 1,
                difficulty: 1,
                category: "校史基础"
            }
        ],
        EVENTS: [
            {
                type: "text",
                question: "复旦大学在哪一年正式合并上海医科大学？",
                options: ["2000年", "2002年", "2005年", "2010年"],
                correct: 0,
                difficulty: 2,
                category: "历史事件"
            }
        ],
        ACHIEVEMENTS: [
            {
                type: "text",
                question: "复旦大学的第一位诺贝尔奖校友是谁？",
                options: ["屠呦呦", "杨振宁", "朱棣文", "李政道"],
                correct: 1,
                difficulty: 3,
                category: "杰出校友"
            }
        ],
        CHALLENGE: [
            {
                type: "text",
                question: '复旦大学校徽中的"复旦"二字，源于哪本经典古籍？',
                options: ["《大学》", "《尚书大传》", "《论语》", "《春秋》"],
                correct: 1,
                difficulty: 4,
                category: "终极挑战"
            }
        ]
    };
    
    // 初始化各关卡题库
    Object.keys(questions).forEach(level => {
        if (GAME_CONFIG.LEVELS && GAME_CONFIG.LEVELS[level]) {
            GAME_CONFIG.LEVELS[level].questions = questions[level];
        }
    });
}

// 初始化游戏
function initGame() {
    initQuestions();
    initAudio();
    loadGameState();
    loadLevelProgress();
    updateStats();
    updateLevelDisplay();
}

// 加载游戏状态
function loadGameState() {
    const savedState = localStorage.getItem('quizGameState');
    if (savedState) {
        gameState = { ...gameState, ...JSON.parse(savedState) };
    }
    updateStats();
}

// 更新统计数据显示
function updateStats() {
    document.getElementById('scoreValue').textContent = gameState.score;
    document.getElementById('streakValue').textContent = gameState.currentCombo;
    document.getElementById('accuracyValue').textContent = 
        gameState.totalAnswers ? 
        Math.round((gameState.correctAnswers / gameState.totalAnswers) * 100) + '%' : 
        '0%';
}

// 连击系统
function updateCombo(isCorrect) {
    if (isCorrect) {
        gameState.currentCombo++;
        gameState.maxCombo = Math.max(gameState.maxCombo, gameState.currentCombo);
        
        // 更新连击倍率
        const multiplierIndex = Math.min(gameState.currentCombo - 1, GAME_CONFIG.COMBO_SYSTEM.multipliers.length - 1);
        gameState.streakMultiplier = GAME_CONFIG.COMBO_SYSTEM.multipliers[multiplierIndex] || 1;
        
        // 更新连击显示
        const comboDisplay = document.getElementById('comboDisplay');
        comboDisplay.style.display = 'block';
        comboDisplay.querySelector('span').textContent = gameState.currentCombo;
        
        // 设置连击颜色
        const colorIndex = Math.min(
            Math.floor((gameState.currentCombo - 1) / 2),
            GAME_CONFIG.COMBO_SYSTEM.colors.length - 1
        );
        comboDisplay.style.color = GAME_CONFIG.COMBO_SYSTEM.colors[colorIndex];
        
        // 连击特效
        if (gameState.currentCombo >= 3) {
            comboDisplay.style.transform = `scale(${1 + gameState.currentCombo*0.1})`;
            showComboPopup();
        }
        
        // 更新分数倍率显示
        const multiplierDisplay = document.getElementById('scoreMultiplier');
        multiplierDisplay.style.display = 'block';
        multiplierDisplay.textContent = `x${gameState.streakMultiplier.toFixed(1)}`;
        multiplierDisplay.style.background = GAME_CONFIG.COMBO_SYSTEM.colors[colorIndex];
        
        clearTimeout(gameState.comboTimeout);
        gameState.comboTimeout = setTimeout(() => {
            gameState.currentCombo = 0;
            gameState.streakMultiplier = 1;
            comboDisplay.style.display = 'none';
            multiplierDisplay.style.display = 'none';
        }, GAME_CONFIG.COMBO_SYSTEM.decayTime);
    } else {
        gameState.currentCombo = 0;
        gameState.streakMultiplier = 1;
        document.getElementById('comboDisplay').style.display = 'none';
        document.getElementById('scoreMultiplier').style.display = 'none';
    }
}

// 显示连击弹出效果
function showComboPopup() {
    const popup = document.getElementById('comboPopup');
    const bonus = Math.round((gameState.streakMultiplier - 1) * 100);
    
    popup.textContent = `连击 x${gameState.currentCombo}! (+${bonus}%)`;
    popup.style.display = 'block';
    
    // 设置颜色
    const colorIndex = Math.min(
        Math.floor((gameState.currentCombo - 1) / 2),
        GAME_CONFIG.COMBO_SYSTEM.colors.length - 1
    );
    popup.style.color = GAME_CONFIG.COMBO_SYSTEM.colors[colorIndex];
    
    // 重置动画
    popup.style.animation = 'none';
    popup.offsetHeight; // 触发重排
    popup.style.animation = 'comboFloat 1s ease-out';
    
    setTimeout(() => {
        popup.style.display = 'none';
    }, 1000);
}

// 动态难度调整
function adjustDifficulty(isCorrect) {
    const delta = isCorrect ? 
        GAME_CONFIG.DYNAMIC_DIFFICULTY.correctBoost : 
        GAME_CONFIG.DYNAMIC_DIFFICULTY.wrongPenalty;
    
    gameState.difficultyFactor = Math.max(
        GAME_CONFIG.DYNAMIC_DIFFICULTY.minDifficulty,
        Math.min(
            GAME_CONFIG.DYNAMIC_DIFFICULTY.maxDifficulty,
            gameState.difficultyFactor + delta
        )
    );
    
    // 移除题干模糊效果,只调整字体大小
    const questionEl = document.getElementById('questionText');
    questionEl.style.fontSize = `${Math.max(16, 24 - gameState.difficultyFactor*2)}px`;
}

// 显示问题
function showQuestion(question) {
    if (!question) return;
    
    // 设置题目类型标签
    const questionType = document.getElementById('questionType');
    if (Array.isArray(question.correct)) {
        const selectCount = question.correct.length;
        const selectType = ['单选', '双选', '三选', '四选'][selectCount - 1] || `${selectCount}选`;
        questionType.textContent = `${selectType}题`;
    } else {
        questionType.textContent = getQuestionTypeLabel(question.type);
    }
    
    // 设置题目文本
    const questionText = document.getElementById('questionText');
    if (Array.isArray(question.correct)) {
        questionText.textContent = `(请选择${question.correct.length}个正确答案) ${question.question}`;
    } else {
        questionText.textContent = question.question;
    }
    
    // 处理多媒体内容
    const mediaContainer = document.getElementById('mediaContainer');
    const questionImage = document.getElementById('questionImage');
    
    if (question.type === "image" && question.media) {
        mediaContainer.style.display = 'block';
        // 预加载图片
        const img = new Image();
        img.onload = () => {
            questionImage.src = question.media;
            questionImage.style.display = 'block';
            // 调整图片大小以适应容器
            if (img.width > img.height) {
                questionImage.style.width = '100%';
                questionImage.style.height = 'auto';
            } else {
                questionImage.style.width = 'auto';
                questionImage.style.height = '300px';
            }
        };
        img.src = question.media;
    } else {
        mediaContainer.style.display = 'none';
        questionImage.style.display = 'none';
        questionImage.src = '';
    }
    
    // 生成选项
    const optionsContainer = document.getElementById('optionsContainer');
    optionsContainer.innerHTML = '';
    
    question.options.forEach((option, index) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        if (Array.isArray(question.correct)) {
            btn.classList.add('multi-select');
        }
        btn.textContent = option;
        btn.dataset.index = index;
        btn.onclick = () => handleAnswer(index, question);
        optionsContainer.appendChild(btn);
    });
}

// 处理答案选择
function handleAnswer(index, question) {
    const isCorrect = Array.isArray(question.correct) ? 
        question.correct.includes(index) : 
        index === question.correct;
    
    // 更新游戏状态
    gameState.totalAnswers++;
    if (isCorrect) {
        gameState.correctAnswers++;
        gameState.score += calculateScore(question.difficulty);
    }
    
    // 更新UI
    updateCombo(isCorrect);
    adjustDifficulty(isCorrect);
    showAnswerFeedback(index, question);
    updateStats();
    saveGameState();
    
    // 播放音效
    playSound(isCorrect ? 'correct' : 'wrong');
}

// 计算得分
function calculateScore(difficulty) {
    const baseScore = GAME_CONFIG.COMBO_SYSTEM.baseScore;
    return Math.round(baseScore * difficulty * gameState.streakMultiplier);
}

// 显示答案反馈
function showAnswerFeedback(selectedIndex, question) {
    const options = document.querySelectorAll('.option-btn');
    
    // 处理多选题
    if (Array.isArray(question.correct)) {
        const selectedBtn = options[selectedIndex];
        const isCorrectChoice = question.correct.includes(selectedIndex);
        
        // 如果选错了,直接显示所有正确答案并结束
        if (!isCorrectChoice) {
            options.forEach(btn => {
                const index = parseInt(btn.dataset.index);
                if (question.correct.includes(index)) {
                    btn.classList.add('correct');
                } else if (index === selectedIndex) {
                    btn.classList.add('wrong');
                }
                btn.disabled = true;
            });
            setTimeout(() => loadNextQuestion(), 1500);
            return;
        }
        
        // 选对了,继续作答
        selectedBtn.classList.add('correct');
        selectedBtn.disabled = true;
        
        // 检查是否已经选择了所有正确答案
        const selectedCorrectAnswers = Array.from(options)
            .filter(btn => btn.classList.contains('correct'))
            .length;
            
        if (selectedCorrectAnswers === question.correct.length) {
            // 全部选对了,进入下一题
            setTimeout(() => loadNextQuestion(), 1500);
        }
    } else {
        // 单选题逻辑保持不变
        options.forEach(btn => {
            const index = parseInt(btn.dataset.index);
            if (index === question.correct) {
                btn.classList.add('correct');
            } else if (index === selectedIndex) {
                btn.classList.add('wrong');
            }
            btn.disabled = true;
        });
        setTimeout(() => loadNextQuestion(), 1500);
    }
    
    // 播放音效
    playSound(Array.isArray(question.correct) ? 
        (question.correct.includes(selectedIndex) ? 'correct' : 'wrong') :
        (selectedIndex === question.correct ? 'correct' : 'wrong'));
}

// 加载下一题
function loadNextQuestion() {
    // 从当前关卡的题库中选择题目
    if (!gameState.currentLevel || !gameState.currentLevel.questions) {
        return;
    }
    
    const levelQuestions = gameState.currentLevel.questions;
    const unusedQuestions = levelQuestions.filter((_, index) => !gameState.usedQuestions.has(index));
    
    if (unusedQuestions.length > 0) {
        const randomIndex = Math.floor(Math.random() * unusedQuestions.length);
        const nextQuestion = unusedQuestions[randomIndex];
        const originalIndex = levelQuestions.indexOf(nextQuestion);
        gameState.usedQuestions.add(originalIndex);
        showQuestion(nextQuestion);
    } else {
        endGame();
    }
}

// 根据难度选择题目
function selectQuestion() {
    // 如果当前关卡未设置或没有题目，返回null
    if (!gameState.currentLevel || !gameState.currentLevel.questions) {
        return null;
    }
    
    const questions = gameState.currentLevel.questions;
    
    // 如果所有题目都已回答完,进入结算
    if (gameState.usedQuestions.size === questions.length) {
        return null;
    }
    
    // 获取未使用的题目
    const unusedQuestions = questions.filter((_, index) => !gameState.usedQuestions.has(index));
    
    // 如果没有可用题目,进入结算
    if (unusedQuestions.length === 0) {
        return null;
    }
    
    // 随机选择一个未使用的题目
    const randomIndex = Math.floor(Math.random() * unusedQuestions.length);
    const selectedQuestion = unusedQuestions[randomIndex];
    const originalIndex = questions.indexOf(selectedQuestion);
    
    // 记录题目使用情况
    gameState.usedQuestions.add(originalIndex);
    
    return selectedQuestion;
}

// 获取题目类型标签
function getQuestionTypeLabel(type) {
    switch(type) {
        case "text":
            return "文字题";
        case "image":
            return "图片题";
        case "sequence":
            return "排序题";
        case "multi_select":
            return "多选题";
        default:
            return "未知类型";
    }
}

// 每日挑战系统
function initDailyChallenge() {
    const lastPlayed = localStorage.getItem('dailyChallengeDate');
    const today = new Date().toDateString();
    
    if (lastPlayed !== today) {
        gameState.dailyChallenge = {
            currentStreak: 0,
            remainingAttempts: GAME_CONFIG.DAILY_CHALLENGE.attempts
        };
        localStorage.setItem('dailyChallengeDate', today);
    }
    
    document.getElementById('streakCount').textContent = gameState.dailyChallenge.currentStreak;
    document.getElementById('dailyModal').style.display = 'flex';
}

// 开始每日挑战
function startDailyChallenge() {
    gameState.timeAttackMode = true;
    document.getElementById('dailyModal').style.display = 'none';
    document.getElementById('timerBox').style.display = 'block';
    
    // 重置游戏状态
    resetGameState();
    
    let timeLeft = 60;
    const timer = setInterval(() => {
        timeLeft--;
        document.getElementById('timer').textContent = timeLeft;
        document.getElementById('timerFill').style.width = `${(timeLeft/60)*100}%`;
        
        if (timeLeft <= 0) {
            clearInterval(timer);
            endDailyChallenge();
        }
    }, 1000);
    
    loadNextQuestion();
}

// 结束每日挑战
function endDailyChallenge() {
    gameState.timeAttackMode = false;
    document.getElementById('timerBox').style.display = 'none';
    
    if (gameState.score >= 100) {
        gameState.dailyChallenge.currentStreak++;
        showAchievementNotification('每日挑战完成！');
    } else {
        gameState.dailyChallenge.remainingAttempts--;
        if (gameState.dailyChallenge.remainingAttempts <= 0) {
            gameState.dailyChallenge.currentStreak = 0;
        }
    }
    
    saveGameState();
    showResult();
}

// 显示成就通知
function showAchievementNotification(message) {
    // 实现成就通知显示逻辑
}

// 保存游戏状态
function saveGameState() {
    localStorage.setItem('quizGameState', JSON.stringify(gameState));
}

// 音频系统
const audioClips = {
    correct: null,
    wrong: null,
    combo: null
};

// 初始化音频
function initAudio() {
    const audioFiles = {
        correct: 'assets/audio/correct.mp3',
        wrong: 'assets/audio/wrong.mp3',
        combo: 'assets/audio/combo.mp3'
    };

    let hasAudioSupport = false;

    // 检查音频支持
    try {
        const audio = new Audio();
        hasAudioSupport = audio && typeof audio.play === 'function';
    } catch (error) {
        console.warn('浏览器不支持音频播放');
        return;
    }

    if (!hasAudioSupport) {
        console.warn('浏览器不支持音频播放，游戏将在静音模式下运行');
        return;
    }

    Object.entries(audioFiles).forEach(([key, path]) => {
        const audio = new Audio();
        
        audio.addEventListener('error', (e) => {
            console.warn(`音频文件 ${path} 加载失败（错误代码: ${e.target.error.code}），将在静音模式下继续`);
            audioClips[key] = null;
        });

        audio.addEventListener('canplaythrough', () => {
            console.log(`音频文件 ${path} 加载成功`);
            audioClips[key] = audio;
        });

        try {
            audio.src = path;
            audio.load();
        } catch (error) {
            console.warn(`音频系统初始化失败: ${error.message}`);
            audioClips[key] = null;
        }
    });
}

function playSound(key) {
    const audio = audioClips[key];
    if (!audio) return;

    try {
        // 创建新的音频实例以支持重叠播放
        const soundInstance = audio.cloneNode();
        const playPromise = soundInstance.play();
        
        if (playPromise) {
            playPromise.catch((error) => {
                console.warn(`音效 ${key} 播放失败:`, error);
            });
        }
        
        // 连击音效
        if (key === 'correct' && gameState.currentCombo >= 3 && audioClips.combo) {
            const comboInstance = audioClips.combo.cloneNode();
            comboInstance.play().catch(() => {});
        }
    } catch (error) {
        console.warn(`音效 ${key} 播放出错:`, error);
    }
}

// 注册服务工作者
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker
            .register('/sw.js')
            .then(() => console.log('Service Worker 已注册'))
            .catch(err => console.log('Service Worker 注册失败:', err));
    }
}

// 结束游戏
function endGame() {
    gameState.endTime = new Date();
    const achievements = checkAchievements();
    const totalTime = Math.round((gameState.endTime - gameState.startTime) / 1000);
    const finalScore = gameState.score;
    const accuracy = Math.round((gameState.correctAnswers / gameState.totalAnswers) * 100);
    
    // 获取最高等级成就
    const highestRank = achievements.find(a => GAME_CONFIG.ACHIEVEMENTS.RANKS.includes(a)) || GAME_CONFIG.ACHIEVEMENTS.RANKS[0];
    
    // 创建结算界面
    const resultHtml = `
        <div class="quiz-card result-card">
            <h2>${highestRank.icon} 游戏结束! ${highestRank.icon}</h2>
            <div class="rank-title">
                <h3>${highestRank.name}</h3>
            </div>
            <div class="result-stats">
                <p>最终得分: ${finalScore}</p>
                <p>正确率: ${accuracy}%</p>
                <p>答题数量: ${gameState.totalAnswers}/${gameState.currentLevel.questions.length}</p>
                <p>用时: ${totalTime}秒</p>
                <p>最大连击: ${gameState.maxCombo}</p>
            </div>
            <div class="achievements-container">
                <h4>获得成就:</h4>
                <div class="achievements-list">
                    ${achievements.map(a => `
                        <div class="achievement">
                            <span class="achievement-icon">${a.icon}</span>
                            <span class="achievement-name">${a.name}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            <button onclick="resetAndReload()" class="option-btn">再来一次</button>
            <button onclick="shareResult()" class="option-btn share-btn">分享成绩</button>
        </div>
    `;
    
    document.getElementById('questionCard').innerHTML = resultHtml;
    
    // 保存成就记录
    gameState.achievements = achievements;
    saveGameState();
}

// 分享结果
function shareResult() {
    const highestRank = gameState.achievements.find(a => GAME_CONFIG.ACHIEVEMENTS.RANKS.includes(a)) || GAME_CONFIG.ACHIEVEMENTS.RANKS[0];
    const shareText = `
我在复旦校史问答中获得了"${highestRank.name}"称号！
得分：${gameState.score}
正确率：${Math.round((gameState.correctAnswers / gameState.totalAnswers) * 100)}%
最大连击：${gameState.maxCombo}
获得成就：${gameState.achievements.map(a => a.name).join('、')}
快来挑战吧！
    `.trim();
    
    if (navigator.share) {
        navigator.share({
            title: '复旦校史问答成绩分享',
            text: shareText
        }).catch(console.error);
    } else {
        // 如果不支持原生分享,复制到剪贴板
        const textarea = document.createElement('textarea');
        textarea.value = shareText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        alert('成绩已复制到剪贴板！');
    }
}

// 重置并重新加载游戏
function resetAndReload() {
    resetGameState();
    location.reload();
}

// 开始普通游戏
function startNormalGame() {
    resetGameState();
    gameState.startTime = new Date();
    
    // 隐藏每日挑战模态框
    const dailyModal = document.getElementById('dailyModal');
    if (dailyModal) {
        dailyModal.style.display = 'none';
    }
    
    // 立即加载第一道题目
    loadNextQuestion();
}

// 重置游戏状态
function resetGameState() {
    gameState = {
        currentCombo: 0,
        comboTimeout: null,
        difficultyFactor: 1,
        timeAttackMode: false,
        score: 0,
        correctAnswers: 0,
        totalAnswers: 0,
        streakMultiplier: 1,
        maxCombo: 0,
        startTime: null,
        endTime: null,
        currentLevel: GAME_CONFIG.LEVELS.BASIC,
        unlockedLevels: new Set([1]),
        levelProgress: {},
        dailyChallenge: {
            currentStreak: 0,
            remainingAttempts: GAME_CONFIG.DAILY_CHALLENGE.attempts
        },
        lastQuestionIndex: null,
        usedQuestions: new Set(),
        achievements: []
    };
    saveGameState();
}

// 检查成就
function checkAchievements() {
    const achievements = [];
    const totalTime = (gameState.endTime - gameState.startTime) / 1000;
    const averageTime = totalTime / gameState.totalAnswers;
    
    // 检查排名成就
    for (const rank of GAME_CONFIG.ACHIEVEMENTS.RANKS) {
        if (gameState.score >= rank.minScore) {
            achievements.push(rank);
        }
    }
    
    // 检查特殊成就
    if (gameState.correctAnswers === gameState.totalAnswers) {
        achievements.push(GAME_CONFIG.ACHIEVEMENTS.SPECIAL[0]); // 完美答题
    }
    if (averageTime < 3) {
        achievements.push(GAME_CONFIG.ACHIEVEMENTS.SPECIAL[1]); // 神速答题
    }
    if (gameState.maxCombo >= 5) {
        achievements.push(GAME_CONFIG.ACHIEVEMENTS.SPECIAL[2]); // 连击大师
    }
    if (gameState.currentLevel && gameState.currentLevel.questions && 
        gameState.usedQuestions.size === gameState.currentLevel.questions.length) {
        achievements.push(GAME_CONFIG.ACHIEVEMENTS.SPECIAL[3]); // 百分百完成
    }
    
    return achievements;
}

// 检查关卡解锁条件
function checkLevelUnlock() {
    const currentProgress = gameState.levelProgress[gameState.currentLevel.id] || {
        score: 0,
        correctRate: 0
    };
    
    // 检查每个关卡
    Object.values(GAME_CONFIG.LEVELS).forEach(level => {
        if (!gameState.unlockedLevels.has(level.id) && 
            currentProgress.score >= level.requiredScore && 
            currentProgress.correctRate >= level.minCorrectRate) {
            // 解锁新关卡
            gameState.unlockedLevels.add(level.id);
            showLevelUnlockNotification(level);
        }
    });
}

// 显示关卡解锁通知
function showLevelUnlockNotification(level) {
    const notification = document.createElement('div');
    notification.className = 'level-unlock-notification';
    notification.innerHTML = `
        <h3>🎉 新关卡解锁！</h3>
        <p>${level.name}</p>
        <p>${level.description}</p>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// 更新关卡进度
function updateLevelProgress() {
    const levelId = gameState.currentLevel.id;
    const correctRate = gameState.correctAnswers / gameState.totalAnswers;
    
    gameState.levelProgress[levelId] = {
        score: gameState.score,
        correctRate: correctRate
    };
    
    checkLevelUnlock();
    saveLevelProgress();
}

// 加载关卡进度
function loadLevelProgress() {
    const savedProgress = localStorage.getItem('quizLevelProgress');
    if (savedProgress) {
        try {
            const { progress, unlockedLevels } = JSON.parse(savedProgress);
            gameState.levelProgress = progress || {};
            // 确保 unlockedLevels 是一个 Set 对象
            gameState.unlockedLevels = new Set(Array.isArray(unlockedLevels) ? unlockedLevels : [1]);
        } catch (error) {
            console.warn('加载关卡进度失败:', error);
            gameState.levelProgress = {};
            gameState.unlockedLevels = new Set([1]);
        }
    } else {
        gameState.levelProgress = {};
        gameState.unlockedLevels = new Set([1]);
    }
}

// 保存关卡进度
function saveLevelProgress() {
    try {
        localStorage.setItem('quizLevelProgress', JSON.stringify({
            progress: gameState.levelProgress,
            unlockedLevels: Array.from(gameState.unlockedLevels)
        }));
    } catch (error) {
        console.warn('保存关卡进度失败:', error);
    }
}

// 选择关卡
function selectLevel(levelId) {
    if (gameState.unlockedLevels.has(levelId)) {
        const selectedLevel = Object.values(GAME_CONFIG.LEVELS).find(function(l) {
            return l.id === levelId;
        });
        if (selectedLevel) {
            gameState.currentLevel = selectedLevel;
            resetGameState();
            // 隐藏关卡选择界面，显示答题界面
            const levelSelect = document.getElementById('levelSelect');
            const quizContainer = document.getElementById('quizContainer');
            if (levelSelect && quizContainer) {
                levelSelect.style.display = 'none';
                quizContainer.style.display = 'block';
                startLevel();
            }
        }
    }
}

// 开始关卡
function startLevel() {
    gameState.startTime = new Date();
    gameState.usedQuestions = new Set();
    gameState.score = 0;
    gameState.correctAnswers = 0;
    gameState.totalAnswers = 0;
    gameState.currentCombo = 0;
    
    // 更新统计显示
    updateStats();
    
    // 从当前关卡的题库中加载第一道题
    if (gameState.currentLevel && gameState.currentLevel.questions) {
        const levelQuestions = gameState.currentLevel.questions;
        if (levelQuestions.length > 0) {
            const randomIndex = Math.floor(Math.random() * levelQuestions.length);
            const firstQuestion = levelQuestions[randomIndex];
            if (firstQuestion) {
                gameState.usedQuestions.add(randomIndex);
                showQuestion(firstQuestion);
            }
        }
    }
}

// 更新关卡显示
function updateLevelDisplay() {
    const levelSelect = document.getElementById('levelSelect');
    if (!levelSelect) return;

    const levelsContainer = document.getElementById('levelsContainer');
    if (!levelsContainer) return;

    levelsContainer.innerHTML = '';
    
    Object.values(GAME_CONFIG.LEVELS).forEach(level => {
        const levelCard = document.createElement('div');
        levelCard.className = 'level-card';
        if (!gameState.unlockedLevels.has(level.id)) {
            levelCard.classList.add('locked');
        }
        
        levelCard.innerHTML = `
            <h3>${level.name}</h3>
            <p>${level.description}</p>
            <div class="level-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${calculateLevelProgress(level.id)}%"></div>
                </div>
                <span class="progress-text">${calculateLevelProgress(level.id)}%</span>
            </div>
            ${gameState.unlockedLevels.has(level.id) ? 
                `<button onclick="selectLevel(${level.id})" class="level-btn">开始</button>` :
                `<div class="lock-info">
                    <span>🔒 需要分数: ${level.requiredScore}</span>
                    <span>正确率: ${level.minCorrectRate * 100}%</span>
                </div>`
            }
        `;
        
        levelsContainer.appendChild(levelCard);
    });
}

// 计算关卡进度
function calculateLevelProgress(levelId) {
    const progress = gameState.levelProgress[levelId];
    if (!progress) return 0;
    return Math.round((progress.correctRate || 0) * 100);
}

// 初始化游戏
window.addEventListener('load', initGame); 