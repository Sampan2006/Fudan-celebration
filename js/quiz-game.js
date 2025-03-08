// 增强型游戏配置
const ENHANCED_CONFIG = {
    DAILY_CHALLENGE: {
        enabled: true,
        attempts: 3,
        streakBonus: [5, 10, 20] // 连续完成奖励
    },
    COMBO_SYSTEM: {
        baseScore: 2,
        maxMultiplier: 5,
        decayTime: 3000, // 连击维持时间(ms)
        multipliers: [1.2, 1.5, 2.0], // 连击加成倍率
        colors: [ // 连击数对应的颜色
            '#ffd700', // 1-2连击
            '#ff6b6b', // 3-4连击
            '#4caf50'  // 5+连击
        ]
    },
    DYNAMIC_DIFFICULTY: {
        correctBoost: 0.2,
        wrongPenalty: -0.3,
        minDifficulty: 0.5,
        maxDifficulty: 2.5
    },
    QUESTION_TYPES: {
        TEXT: 1,
        IMAGE: 2,
        SEQUENCE: 3,
        MULTI_SELECT: 4
    }
};

// 游戏状态管理
let gameState = {
    currentCombo: 0,
    comboTimeout: null,
    difficultyFactor: 1,
    timeAttackMode: false,
    score: 0,
    correctAnswers: 0,
    totalAnswers: 0,
    streakMultiplier: 1,
    maxCombo: 0, // 记录最大连击数
    startTime: null, // 记录开始时间
    endTime: null, // 记录结束时间
    dailyChallenge: {
        currentStreak: 0,
        remainingAttempts: 3
    },
    lastQuestionIndex: null,
    usedQuestions: new Set(), // 记录已使用的题目
    achievements: [] // 记录获得的成就
};

// 成就系统配置
const ACHIEVEMENTS = {
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

// 题库数据
const QUESTIONS = [
    {
        type: ENHANCED_CONFIG.QUESTION_TYPES.TEXT,
        question: "复旦大学创建于哪一年？",
        options: ["1900年", "1905年", "1910年", "1915年"],
        correct: 1,
        difficulty: 1,
        category: "校史基础"
    },
    {
        type: ENHANCED_CONFIG.QUESTION_TYPES.TEXT,
        question: "复旦校名的含义是什么？",
        options: [
            "取自《尚书大传》日月光华，旦复旦兮",
            "创始人的名字",
            "地名",
            "英文翻译"
        ],
        correct: 0,
        difficulty: 1,
        category: "校史基础"
    },
    {
        type: ENHANCED_CONFIG.QUESTION_TYPES.IMAGE,
        question: "下图是复旦大学的哪栋标志性建筑？",
        media: "assets/images/buildings/guanghua.png",
        options: ["光华楼", "相辉堂", "第一教学楼", "图书馆"],
        correct: 0,
        difficulty: 1.5,
        category: "校园建筑"
    },
    {
        type: ENHANCED_CONFIG.QUESTION_TYPES.TEXT,
        question: "复旦大学的校训是什么？",
        options: [
            "明德格物",
            "博学而笃志，切问而近思",
            "自强不息，厚德载物",
            "求实创新"
        ],
        correct: 1,
        difficulty: 1,
        category: "校史基础"
    },
    {
        type: ENHANCED_CONFIG.QUESTION_TYPES.MULTI_SELECT,
        question: "以下哪些是复旦大学的校色？（多选）",
        options: ["红色", "蓝色", "金色", "白色"],
        correct: [0, 1],
        difficulty: 2,
        category: "校史基础"
    }
];

// 初始化游戏
function initGame() {
    loadGameState();
    
    // 检查是否显示每日挑战
    const lastPlayed = localStorage.getItem('dailyChallengeDate');
    const today = new Date().toDateString();
    
    if (lastPlayed !== today && ENHANCED_CONFIG.DAILY_CHALLENGE.enabled) {
        initDailyChallenge();
    } else {
        // 如果不显示每日挑战，直接开始普通游戏
        startNormalGame();
    }
    
    loadAudioAssets();
    registerServiceWorker();
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
        const multiplierIndex = Math.min(gameState.currentCombo - 1, ENHANCED_CONFIG.COMBO_SYSTEM.multipliers.length - 1);
        gameState.streakMultiplier = ENHANCED_CONFIG.COMBO_SYSTEM.multipliers[multiplierIndex] || 1;
        
        // 更新连击显示
        const comboDisplay = document.getElementById('comboDisplay');
        comboDisplay.style.display = 'block';
        comboDisplay.querySelector('span').textContent = gameState.currentCombo;
        
        // 设置连击颜色
        const colorIndex = Math.min(
            Math.floor((gameState.currentCombo - 1) / 2),
            ENHANCED_CONFIG.COMBO_SYSTEM.colors.length - 1
        );
        comboDisplay.style.color = ENHANCED_CONFIG.COMBO_SYSTEM.colors[colorIndex];
        
        // 连击特效
        if (gameState.currentCombo >= 3) {
            comboDisplay.style.transform = `scale(${1 + gameState.currentCombo*0.1})`;
            showComboPopup();
        }
        
        // 更新分数倍率显示
        const multiplierDisplay = document.getElementById('scoreMultiplier');
        multiplierDisplay.style.display = 'block';
        multiplierDisplay.textContent = `x${gameState.streakMultiplier.toFixed(1)}`;
        multiplierDisplay.style.background = ENHANCED_CONFIG.COMBO_SYSTEM.colors[colorIndex];
        
        clearTimeout(gameState.comboTimeout);
        gameState.comboTimeout = setTimeout(() => {
            gameState.currentCombo = 0;
            gameState.streakMultiplier = 1;
            comboDisplay.style.display = 'none';
            multiplierDisplay.style.display = 'none';
        }, ENHANCED_CONFIG.COMBO_SYSTEM.decayTime);
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
        ENHANCED_CONFIG.COMBO_SYSTEM.colors.length - 1
    );
    popup.style.color = ENHANCED_CONFIG.COMBO_SYSTEM.colors[colorIndex];
    
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
        ENHANCED_CONFIG.DYNAMIC_DIFFICULTY.correctBoost : 
        ENHANCED_CONFIG.DYNAMIC_DIFFICULTY.wrongPenalty;
    
    gameState.difficultyFactor = Math.max(
        ENHANCED_CONFIG.DYNAMIC_DIFFICULTY.minDifficulty,
        Math.min(
            ENHANCED_CONFIG.DYNAMIC_DIFFICULTY.maxDifficulty,
            gameState.difficultyFactor + delta
        )
    );
    
    // 移除题干模糊效果,只调整字体大小
    const questionEl = document.getElementById('questionText');
    questionEl.style.fontSize = `${Math.max(16, 24 - gameState.difficultyFactor*2)}px`;
}

// 显示问题
function showQuestion(question) {
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
    
    if (question.type === ENHANCED_CONFIG.QUESTION_TYPES.IMAGE && question.media) {
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
    const baseScore = ENHANCED_CONFIG.COMBO_SYSTEM.baseScore;
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
    const question = selectQuestion();
    if (question) {
        showQuestion(question);
    } else {
        endGame();
    }
}

// 根据难度选择题目
function selectQuestion() {
    // 如果所有题目都已回答完,进入结算
    if (gameState.usedQuestions.size === QUESTIONS.length) {
        return null;
    }
    
    // 获取未使用的题目
    const unusedQuestions = QUESTIONS.filter((_, index) => !gameState.usedQuestions.has(index));
    
    // 如果没有可用题目,进入结算
    if (unusedQuestions.length === 0) {
        return null;
    }
    
    // 随机选择一个未使用的题目
    const randomIndex = Math.floor(Math.random() * unusedQuestions.length);
    const selectedQuestion = unusedQuestions[randomIndex];
    const originalIndex = QUESTIONS.indexOf(selectedQuestion);
    
    // 记录题目使用情况
    gameState.usedQuestions.add(originalIndex);
    
    return selectedQuestion;
}

// 获取题目类型标签
function getQuestionTypeLabel(type) {
    switch(type) {
        case ENHANCED_CONFIG.QUESTION_TYPES.TEXT:
            return "文字题";
        case ENHANCED_CONFIG.QUESTION_TYPES.IMAGE:
            return "图片题";
        case ENHANCED_CONFIG.QUESTION_TYPES.SEQUENCE:
            return "排序题";
        case ENHANCED_CONFIG.QUESTION_TYPES.MULTI_SELECT:
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
            remainingAttempts: ENHANCED_CONFIG.DAILY_CHALLENGE.attempts
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
    correct: new Audio('assets/audio/correct.mp3'),
    wrong: new Audio('assets/audio/wrong.mp3'),
    combo: new Audio('assets/audio/combo.mp3')
};

function playSound(key) {
    if (audioClips[key]) {
        audioClips[key].currentTime = 0;
        audioClips[key].play().catch(() => {});
        
        // 连击音效
        if (key === 'correct' && gameState.currentCombo >= 3) {
            audioClips.combo.currentTime = 0;
            audioClips.combo.play().catch(() => {});
        }
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
    const highestRank = achievements.find(a => ACHIEVEMENTS.RANKS.includes(a)) || ACHIEVEMENTS.RANKS[0];
    
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
                <p>答题数量: ${gameState.totalAnswers}/${QUESTIONS.length}</p>
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
    const highestRank = gameState.achievements.find(a => ACHIEVEMENTS.RANKS.includes(a)) || ACHIEVEMENTS.RANKS[0];
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
        dailyChallenge: {
            currentStreak: 0,
            remainingAttempts: ENHANCED_CONFIG.DAILY_CHALLENGE.attempts
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
    const totalTime = (gameState.endTime - gameState.startTime) / 1000; // 总用时(秒)
    const averageTime = totalTime / gameState.totalAnswers; // 平均每题用时
    
    // 检查排名成就
    for (const rank of ACHIEVEMENTS.RANKS) {
        if (gameState.score >= rank.minScore) {
            achievements.push(rank);
        }
    }
    
    // 检查特殊成就
    if (gameState.correctAnswers === gameState.totalAnswers) {
        achievements.push(ACHIEVEMENTS.SPECIAL[0]); // 完美答题
    }
    if (averageTime < 3) {
        achievements.push(ACHIEVEMENTS.SPECIAL[1]); // 神速答题
    }
    if (gameState.maxCombo >= 5) {
        achievements.push(ACHIEVEMENTS.SPECIAL[2]); // 连击大师
    }
    if (gameState.usedQuestions.size === QUESTIONS.length) {
        achievements.push(ACHIEVEMENTS.SPECIAL[3]); // 百分百完成
    }
    
    return achievements;
}

// 初始化游戏
window.addEventListener('load', initGame); 