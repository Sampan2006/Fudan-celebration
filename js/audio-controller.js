// 添加脚本加载检测
console.log('音频控制器脚本开始加载...');

class AudioController {
    constructor() {
        console.log('音频控制器开始初始化...');
        
        // 确保 DOM 已经加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        console.log('音频控制器初始化...');
        
        // 获取网站根目录的绝对路径
        const rootPath = this.getRootPath();
        console.log('网站根目录:', rootPath);
        console.log('当前完整URL:', window.location.href);
        console.log('当前路径名:', window.location.pathname);
        console.log('当前主机名:', window.location.hostname);
        
        // 根据页面选择音频文件
        const currentPath = window.location.pathname;
        let audioFile = 'Bandari - Annie\'s Wonderland.mp3'; // 默认音乐

        // 判断当前页面
        if (currentPath.includes('index.html') || currentPath.endsWith('/') || 
            currentPath.endsWith('\\') || currentPath === '') {
            audioFile = 'FuDan School Song.mp3'; // 主页使用校歌
            console.log('当前页面使用校歌');
        } else {
            // 其他所有功能区都使用 Bandari 的音乐
            audioFile = 'Bandari - Annie\'s Wonderland.mp3';
            console.log('当前页面使用 Bandari 音乐');
        }

        // 构建完整的音频文件路径
        const audioPath = this.getAudioPath(audioFile, rootPath);
        console.log('尝试加载音频:', audioPath);

        // 创建音频实例
        this.bgm = new Audio();
        console.log('创建音频实例完成');
        
        // 音频加载错误处理
        this.bgm.onerror = (e) => {
            console.error('音频加载失败:', e);
            console.error('错误详情:', {
                error: e,
                src: this.bgm.src,
                networkState: this.bgm.networkState,
                readyState: this.bgm.readyState
            });
            this.showError('音频加载失败，请检查文件是否存在');
            // 尝试使用备用路径
            this.tryBackupPath(audioFile);
        };

        // 音频加载成功处理
        this.bgm.oncanplaythrough = () => {
            console.log('音频加载完成，可以播放');
            if (!this.hasInteracted) {
                this.showStartPrompt();
            }
        };

        // 添加更多音频事件监听
        this.bgm.onloadstart = () => console.log('开始加载音频...');
        this.bgm.onprogress = () => console.log('音频加载中...');
        this.bgm.onstalled = () => console.log('音频加载暂停...');
        this.bgm.onsuspend = () => console.log('音频加载挂起...');
        this.bgm.onabort = () => console.log('音频加载中止...');

        // 设置音频属性
        console.log('设置音频属性...');
        this.bgm.src = audioPath;
        this.bgm.loop = true;
        this.volume = 0.5;
        this.bgm.volume = this.volume;
        this.isPlaying = true;
        this.hasInteracted = false;

        // 设置其他事件监听
        this.setupEventListeners();
        
        // 设置初始状态
        this.setupInitialState();
        
        console.log('音频控制器初始化完成');
    }

    setupEventListeners() {
        console.log('设置事件监听器...');
        
        // 监听页面可见性变化
        document.addEventListener('visibilitychange', () => {
            console.log('页面可见性变化:', document.hidden);
            if (document.hidden) {
                if (this.isPlaying) {
                    this.bgm.pause();
                }
            } else {
                if (this.isPlaying && this.hasInteracted) {
                    this.bgm.play().catch(error => {
                        console.error('恢复播放失败:', error);
                    });
                }
            }
        });

        // 添加键盘事件监听
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                if (this.hasInteracted) {
                    this.toggle();
                } else {
                    this.startPlayback();
                }
            }
        });
    }

    getRootPath() {
        const fullPath = window.location.href;
        const lastSlashIndex = fullPath.lastIndexOf('/');
        let rootPath = fullPath.substring(0, lastSlashIndex + 1);
        
        // 如果当前在子目录中，需要回到根目录
        if (rootPath.includes('/pages/') || rootPath.includes('/html/')) {
            rootPath = rootPath.substring(0, rootPath.lastIndexOf('/', rootPath.length - 2) + 1);
        }
        
        console.log('计算的根路径:', rootPath);
        return rootPath;
    }

    getAudioPath(filename, rootPath) {
        // 移除文件名中的特殊字符
        const encodedFilename = encodeURIComponent(filename);
        
        // 获取当前页面的目录深度
        const depth = window.location.pathname.split('/').length - 2;
        console.log('当前页面目录深度:', depth);
        
        // 根据目录深度构建相对路径
        let relativePath = '';
        for (let i = 0; i < depth; i++) {
            relativePath += '../';
        }
        
        // 尝试不同的路径组合
        const paths = [
            `${rootPath}assets/audio/${encodedFilename}`,
            `${relativePath}assets/audio/${encodedFilename}`,
            `./assets/audio/${encodedFilename}`,
            `../assets/audio/${encodedFilename}`,
            `../../assets/audio/${encodedFilename}`
        ];
        
        console.log('所有可能的音频路径:', paths);
        
        // 返回第一个路径，如果加载失败会在 onerror 中尝试其他路径
        this.backupPaths = paths.slice(1);
        return paths[0];
    }

    tryBackupPath(filename) {
        if (this.backupPaths && this.backupPaths.length > 0) {
            const nextPath = this.backupPaths.shift();
            console.log('尝试备用路径:', nextPath);
            this.bgm.src = nextPath;
        } else {
            console.log('所有路径都已尝试完毕');
        }
    }

    setupInitialState() {
        // 创建并显示开始提示
        this.showStartPrompt();
        
        // 添加全局点击监听
        const handleFirstInteraction = () => {
            if (!this.hasInteracted) {
                this.startPlayback();
                // 移除提示
                this.removeStartPrompt();
                // 移除所有事件监听器
                ['click', 'touchstart'].forEach(event => {
                    document.removeEventListener(event, handleFirstInteraction);
                });
            }
        };

        ['click', 'touchstart'].forEach(event => {
            document.addEventListener(event, handleFirstInteraction);
        });
    }

    showStartPrompt() {
        // 移除已存在的提示（如果有）
        this.removeStartPrompt();

        // 创建提示元素
        const prompt = document.createElement('div');
        prompt.id = 'start-prompt';
        prompt.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 20px 40px;
            border-radius: 10px;
            font-size: 18px;
            text-align: center;
            z-index: 9999;
            cursor: pointer;
            animation: fadeIn 0.5s ease-in-out;
        `;
        prompt.innerHTML = '点击任意位置开始播放背景音乐';
        
        // 添加动画样式
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(prompt);
    }

    removeStartPrompt() {
        const prompt = document.getElementById('start-prompt');
        if (prompt) {
            prompt.remove();
        }
    }

    async startPlayback() {
        try {
            await this.bgm.play();
            this.hasInteracted = true;
            this.isPlaying = true;
            this.updateMusicControl();
            console.log('音乐开始播放');
        } catch (error) {
            console.error('播放失败:', error);
            this.showError('播放失败: ' + error.message);
        }
    }

    pause() {
        if (!this.bgm) return;
        this.bgm.pause();
        this.isPlaying = false;
        this.updateMusicControl();
    }

    toggle() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.startPlayback();
        }
    }

    setVolume(value) {
        if (!this.bgm) return;
        this.volume = Math.max(0, Math.min(1, value));
        this.bgm.volume = this.volume;
    }

    updateMusicControl() {
        const musicControl = document.querySelector('.music-control');
        if (musicControl) {
            musicControl.classList.toggle('playing', this.isPlaying);
        }
    }

    showError(message) {
        console.error(message);
        const musicControl = document.querySelector('.music-control');
        if (musicControl) {
            musicControl.style.opacity = '0.5';
            musicControl.title = message;
        }
    }
}

// 创建全局音频控制器实例
console.log('创建音频控制器实例...');
window.audioController = new AudioController();
console.log('音频控制器脚本加载完成');

// 添加音乐控制按钮事件监听
document.addEventListener('DOMContentLoaded', () => {
    const musicControl = document.querySelector('.music-control');
    if (musicControl) {
        // 更新初始状态
        musicControl.classList.toggle('playing', window.audioController.isPlaying);
        
        musicControl.addEventListener('click', () => {
            if (window.audioController.hasInteracted) {
                window.audioController.toggle();
            } else {
                window.audioController.startPlayback();
                window.audioController.removeStartPrompt();
            }
        });
    }
}); 