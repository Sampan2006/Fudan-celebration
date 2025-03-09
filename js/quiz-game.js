// 游戏基础配置
const GAME_BASE_CONFIG = {
    QUESTIONS_COUNT: 10,  // 总共10道题
    COMBO_SYSTEM: {
        baseScore: 2,
        maxMultiplier: 5,
        decayTime: 5000,
        multipliers: [1.2, 1.5, 2.0],
        colors: ['#ffd700', '#ff6b6b', '#4caf50']
    },
    DAILY_STREAK: {
        MIN_SCORE: 70,    // 获得日连胜需要的最低分数
        KEY: 'dailyStreak' // localStorage中存储日连胜的键名
    }
};

// 荣誉称号配置
const GAME_ACHIEVEMENTS = {
    RANKS: [
        { name: "初涉校史", minScore: 0, icon: "🌱", description: "开始了解复旦历史" },
        { name: "校史学童", minScore: 40, icon: "📚", description: "对复旦历史有了基本认识" },
        { name: "校史达人", minScore: 70, icon: "🎓", description: "熟悉复旦重要历史" },
        { name: "校史大师", minScore: 90, icon: "🏆", description: "深入了解复旦历史" },
        { name: "校史通家", minScore: 100, icon: "👑", description: "完美精通复旦校史" }
    ],
    SPECIAL: [
        { name: "完美答题", condition: "全部正确", icon: "✨", description: "答对所有题目" },
        { name: "神速答题", condition: "平均答题时间<3秒", icon: "⚡", description: "以惊人的速度完成答题" },
        { name: "连击大师", condition: "达成5连击", icon: "🔥", description: "连续答对5题" }
    ]
};

// 合并配置
window.GAME_CONFIG = Object.freeze({
    ...GAME_BASE_CONFIG,
    ACHIEVEMENTS: GAME_ACHIEVEMENTS
});

// 游戏状态
let gameState = {
    questions: [],           // 所有可用题目
    currentQuestion: null,   // 当前题目
    answeredQuestions: new Set(),  // 已答题目
    score: 0,               // 得分
    correctAnswers: 0,      // 正确答题数
    totalAnswers: 0,        // 总答题数
    streakCount: 0,         // 当前连击数
    maxCombo: 0,            // 最大连击数
    startTime: null,        // 开始时间
    endTime: null,          // 结束时间
    achievements: []        // 获得的成就
};

// 检查DOM元素是否存在
function checkRequiredElements() {
    const requiredElements = {
        startScreen: document.getElementById('startScreen'),
        quizContainer: document.getElementById('quizContainer'),
        scoreValue: document.getElementById('scoreValue'),
        streakValue: document.getElementById('streakValue'),
        accuracyValue: document.getElementById('accuracyValue'),
        questionText: document.getElementById('questionText'),
        questionType: document.getElementById('questionType'),
        optionsContainer: document.getElementById('optionsContainer'),
        mediaContainer: document.getElementById('mediaContainer'),
        questionImage: document.getElementById('questionImage'),
        comboDisplay: document.getElementById('comboDisplay'),
        comboPopup: document.getElementById('comboPopup')
    };

    const missingElements = Object.entries(requiredElements)
        .filter(([_, element]) => !element)
        .map(([id]) => id);

    if (missingElements.length > 0) {
        console.error('缺少必要的DOM元素:', missingElements.join(', '));
        return false;
    }

    return requiredElements;
}

// 获取所有题目
function getAllQuestions() {
    // 直接使用 questions 对象中的所有题目
    const allQuestions = [
        ...questions.BASIC,
        ...questions.EVENTS,
        ...questions.ACHIEVEMENTS,
        ...questions.CHALLENGE
    ];
    
    // 随机打乱题目顺序
    return allQuestions.sort(() => Math.random() - 0.5);
}

// 初始化题库
function initQuestions() {
    // questions 对象已经在函数内定义，不需要额外的初始化
    gameState.questions = getAllQuestions();
}

// 开始游戏
function startGame() {
    // 重置游戏状态
    gameState.questions = getAllQuestions();
    gameState.currentQuestion = null;
    gameState.answeredQuestions.clear();
    gameState.score = 0;
    gameState.correctAnswers = 0;
    gameState.totalAnswers = 0;
    gameState.streakCount = 0;
    gameState.maxCombo = 0;
    gameState.startTime = new Date();
    gameState.endTime = null;
    gameState.achievements = [];
    
    // 更新界面显示
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('quizContainer').style.display = 'block';
    
    // 更新统计显示
    updateStats();
    
    // 初始化时更新日连胜显示
    updateDailyStreakDisplay();
    
    // 加载第一道题目
    loadNextQuestion();
}

// 加载下一题
function loadNextQuestion() {
    // 检查是否已完成所有题目
    if (gameState.totalAnswers >= GAME_BASE_CONFIG.QUESTIONS_COUNT) {
        // 确保在延迟后调用endGame，给最后一题的反馈动画时间显示
        setTimeout(() => {
            const quizContainer = document.getElementById('quizContainer');
            if (quizContainer) {
                quizContainer.style.opacity = '0';
                setTimeout(() => {
                    quizContainer.style.opacity = '1';
                    endGame();
                }, 300);
            } else {
                endGame();
            }
        }, 1500);
        return;
    }
    
    // 从未答过的题目中随机选择
    const availableQuestions = gameState.questions.filter(
        (_, index) => !gameState.answeredQuestions.has(index)
    );
    
    if (availableQuestions.length === 0) {
        endGame();
        return;
    }
    
    // 随机选择一道题
    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    gameState.currentQuestion = availableQuestions[randomIndex];
    
    // 记录这道题已被回答
    const originalIndex = gameState.questions.indexOf(gameState.currentQuestion);
    gameState.answeredQuestions.add(originalIndex);
    
    // 显示题目
    showQuestion(gameState.currentQuestion);
}

// 显示问题
function showQuestion(question) {
    if (!question) return;
    
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
        gameState.streakCount++;
        gameState.maxCombo = Math.max(gameState.maxCombo, gameState.streakCount);
        // 基础分数 * 难度系数 * 连击加成
        const baseScore = 10;
        const comboBonus = Math.min(1 + (gameState.streakCount * 0.1), 2.0);
        gameState.score += Math.round(baseScore * (question.difficulty || 1) * comboBonus);
    } else {
        gameState.streakCount = 0;
    }
    
    // 立即更新统计显示
    updateStats();
    
    // 显示答案反馈
    showAnswerFeedback(index, question);
}

// 计算得分
function calculateScore(difficulty) {
    const baseScore = GAME_CONFIG.COMBO_SYSTEM.baseScore || 2;
    const multiplier = gameState.streakCount > 0 ? 
        Math.min(gameState.streakCount * 0.1 + 1, GAME_CONFIG.COMBO_SYSTEM.maxMultiplier) : 1;
    return Math.round(baseScore * (difficulty || 1) * multiplier);
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
}

// 更新统计数据显示
function updateStats() {
    try {
        // 更新得分
        document.getElementById('scoreValue').textContent = gameState.score;
        
        // 更新连击数
        document.getElementById('streakValue').textContent = gameState.streakCount;
        
        // 更新正确率
        const accuracy = gameState.totalAnswers > 0 
            ? Math.round((gameState.correctAnswers / gameState.totalAnswers) * 100) 
            : 0;
        document.getElementById('accuracyValue').textContent = `${accuracy}%`;
    } catch (error) {
        console.error('更新统计数据失败:', error);
    }
}

// 更新连击系统
function updateCombo(isCorrect) {
    const elements = checkRequiredElements();
    if (!elements) return;

    try {
        if (isCorrect) {
            gameState.streakCount++;
            gameState.maxCombo = Math.max(gameState.maxCombo, gameState.streakCount);
            
            // 更新连击显示
            const comboSpan = elements.comboDisplay.querySelector('span');
            if (comboSpan) {
                comboSpan.textContent = gameState.streakCount;
            }
            elements.comboDisplay.style.display = 'block';
            
            // 显示连击弹出效果
            elements.comboPopup.textContent = `${gameState.streakCount} 连击！`;
            elements.comboPopup.style.display = 'block';
            setTimeout(() => {
                if (elements.comboPopup) {
                    elements.comboPopup.style.display = 'none';
                }
            }, 1000);
        } else {
            gameState.streakCount = 0;
            elements.comboDisplay.style.display = 'none';
        }
    } catch (error) {
        console.error('更新连击显示失败:', error);
    }
}

// 动态难度调整
function adjustDifficulty(isCorrect) {
    const elements = checkRequiredElements();
    if (!elements) return;

    try {
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
        
        elements.questionText.style.fontSize = `${Math.max(16, 24 - gameState.difficultyFactor*2)}px`;
    } catch (error) {
        console.error('调整难度失败:', error);
    }
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

// 结束游戏
function endGame() {
    // 计算最终数据
    const accuracy = Math.round((gameState.correctAnswers / GAME_BASE_CONFIG.QUESTIONS_COUNT) * 100) || 0;
    const rank = calculateRank(gameState.score, accuracy);
    
    // 清理当前问题界面
    const quizContainer = document.getElementById('quizContainer');
    if (!quizContainer) return;
    
    // 创建结算页面HTML
    const resultHTML = `
        <div class="result-card">
            <div class="result-header">
                <div class="result-icon">🎓</div>
                <h2>测试完成！</h2>
                <div class="rank-badge">
                    <span class="rank-name">${rank.name}</span>
                    <span class="rank-desc">${rank.description}</span>
                </div>
            </div>
            
            <div class="result-stats">
                <div class="stat-row">
                    <div class="stat-item">
                        <div class="stat-label">总分</div>
                        <div class="stat-value highlight">${gameState.score}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">正确率</div>
                        <div class="stat-value">${accuracy}%</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">最高连击</div>
                        <div class="stat-value">${gameState.maxCombo}</div>
                    </div>
                </div>
                <div class="stat-row">
                    <div class="stat-item">
                        <div class="stat-label">答题数</div>
                        <div class="stat-value">${GAME_BASE_CONFIG.QUESTIONS_COUNT}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">正确数</div>
                        <div class="stat-value">${gameState.correctAnswers}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">错误数</div>
                        <div class="stat-value">${GAME_BASE_CONFIG.QUESTIONS_COUNT - gameState.correctAnswers}</div>
                    </div>
                </div>
            </div>
            
            <div class="achievements-section">
                <h3>获得成就</h3>
                <div class="achievements-grid">
                    ${generateAchievements(gameState.score, accuracy, gameState.maxCombo)}
                </div>
            </div>
            
            <div class="result-actions">
                <button class="action-btn primary" onclick="restartGame()">再次挑战</button>
                <button class="action-btn secondary" onclick="shareResults()">分享成绩</button>
            </div>
        </div>
    `;

    // 使用Promise确保DOM更新完成
    Promise.resolve().then(() => {
        // 清空容器
        quizContainer.innerHTML = '';
        
        // 创建一个临时容器
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = resultHTML;
        
        // 将新内容添加到页面
        while (tempContainer.firstChild) {
            quizContainer.appendChild(tempContainer.firstChild);
        }
        
        // 确保结算页面可见
        quizContainer.style.display = 'block';
        
        // 触发重排以确保动画效果正常显示
        quizContainer.offsetHeight;
        
        // 添加淡入动画
        quizContainer.style.opacity = '0';
        requestAnimationFrame(() => {
            quizContainer.style.transition = 'opacity 0.3s ease';
            quizContainer.style.opacity = '1';
        });
    });

    // 更新日连胜
    updateDailyStreak(gameState.score);
}

function calculateRank(score, accuracy) {
    if (score >= 900 && accuracy >= 90) {
        return {
            name: "校史大师",
            description: "你对复旦的历史了如指掌！"
        };
    } else if (score >= 700 && accuracy >= 80) {
        return {
            name: "优秀校友",
            description: "你对复旦历史有很深的了解"
        };
    } else if (score >= 500 && accuracy >= 70) {
        return {
            name: "求知者",
            description: "继续努力，你已经很棒了"
        };
    } else {
        return {
            name: "初学者",
            description: "这是一个良好的开始"
        };
    }
}

function generateAchievements(score, accuracy, maxStreak) {
    const achievements = [];
    
    if (accuracy === 100) {
        achievements.push({
            icon: "🎯",
            name: "完美解答",
            desc: "获得100%的正确率"
        });
    }
    
    if (maxStreak >= 5) {
        achievements.push({
            icon: "🔥",
            name: "连击大师",
            desc: `达成${maxStreak}连击`
        });
    }
    
    if (score >= 800) {
        achievements.push({
            icon: "👑",
            name: "分数之王",
            desc: "总分超过800分"
        });
    }
    
    if (achievements.length === 0) {
        achievements.push({
            icon: "🌟",
            name: "初次尝试",
            desc: "完成第一次测试"
        });
    }
    
    return achievements.map(a => `
        <div class="achievement-card">
            <div class="achievement-icon">${a.icon}</div>
            <div class="achievement-info">
                <div class="achievement-name">${a.name}</div>
                <div class="achievement-desc">${a.desc}</div>
            </div>
        </div>
    `).join('');
}

function shareResults() {
    const accuracy = Math.round((gameState.correctAnswers / GAME_BASE_CONFIG.QUESTIONS_COUNT) * 100);
    const text = `我在复旦校史知识测试中获得了${gameState.score}分，正确率${accuracy}%！快来挑战吧！`;
    
    if (navigator.share) {
        navigator.share({
            title: '复旦校史知识测试',
            text: text,
            url: window.location.href
        }).catch(console.error);
    } else {
        // 如果不支持原生分享，则复制到剪贴板
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        alert('分享文本已复制到剪贴板！');
    }
}

// 重新开始游戏
function restartGame() {
    // 清理当前状态
    const quizContainer = document.getElementById('quizContainer');
    if (quizContainer) {
        quizContainer.innerHTML = `
            <div class="stats-bar">
                <div class="stat-item">
                    <div class="stat-value" id="scoreValue">0</div>
                    <div class="stat-label">得分</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value" id="streakValue">0</div>
                    <div class="stat-label">连续答对</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value" id="accuracyValue">0%</div>
                    <div class="stat-label">正确率</div>
                </div>
            </div>

            <div class="quiz-card" id="questionCard">
                <div class="question-text" id="questionText">
                    准备开始答题...
                </div>
                <div class="media-question" id="mediaContainer" style="display: none;">
                    <img class="media-image" id="questionImage" src="" alt="">
                </div>
                <div class="options-grid" id="optionsContainer">
                </div>
            </div>
        `;
    }
    
    // 重新开始游戏
    startGame();
}

// 保存游戏状态
function saveGameState() {
    const state = {
        score: gameState.score,
        answeredQuestions: Array.from(gameState.answeredQuestions),
        levelProgress: gameState.levelProgress
    };
    localStorage.setItem('quizGameState', JSON.stringify(state));
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

// 获取日连胜数据
function getDailyStreak() {
    const streakData = localStorage.getItem(GAME_BASE_CONFIG.DAILY_STREAK.KEY);
    if (!streakData) return { streak: 0, lastPlayed: null };
    
    try {
        return JSON.parse(streakData);
    } catch (e) {
        console.error('解析日连胜数据失败:', e);
        return { streak: 0, lastPlayed: null };
    }
}

// 更新日连胜
function updateDailyStreak(score) {
    const today = new Date().toDateString();
    const streakData = getDailyStreak();
    
    // 如果今天已经玩过了，不更新连胜
    if (streakData.lastPlayed === today) return;
    
    // 检查是否是连续的下一天
    const lastPlayed = streakData.lastPlayed ? new Date(streakData.lastPlayed) : null;
    const isNextDay = lastPlayed ? 
        (new Date(today) - lastPlayed) <= (24 * 60 * 60 * 1000) : 
        true;
    
    // 如果分数达到要求且是连续的下一天，增加连胜
    if (score >= GAME_BASE_CONFIG.DAILY_STREAK.MIN_SCORE) {
        if (isNextDay) {
            streakData.streak++;
        } else {
            // 如果不是连续的，重置连胜
            streakData.streak = 1;
        }
    } else {
        // 分数不达标，重置连胜
        streakData.streak = 0;
    }
    
    // 更新最后游戏日期
    streakData.lastPlayed = today;
    
    // 保存数据
    localStorage.setItem(GAME_BASE_CONFIG.DAILY_STREAK.KEY, JSON.stringify(streakData));
    
    // 更新显示
    updateDailyStreakDisplay();
}

// 更新日连胜显示
function updateDailyStreakDisplay() {
    const streakData = getDailyStreak();
    const streakElement = document.querySelector('.challenge-stat .stat-value');
    if (streakElement) {
        streakElement.textContent = streakData.streak;
    }
}

// 确保在页面加载时显示日连胜
document.addEventListener('DOMContentLoaded', () => {
    initQuestions();
    updateDailyStreakDisplay();
}); 