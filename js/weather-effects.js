/**
 * 天气效果系统
 * 包含雪花、雨滴和风力效果
 */

class WeatherSystem {
    constructor() {
        // 创建画布层
        this.snowCanvas = document.createElement('canvas');
        this.rainCanvas = document.createElement('canvas');
        
        // 设置画布样式
        [this.snowCanvas, this.rainCanvas].forEach(canvas => {
            canvas.style.position = 'fixed';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.pointerEvents = 'none';
            canvas.style.zIndex = '1000';
            document.body.appendChild(canvas);
        });

        // 获取上下文
        this.sctx = this.snowCanvas.getContext('2d');
        this.rctx = this.rainCanvas.getContext('2d');

        // 配置参数
        this.WIND_FORCE = 0.5;
        this.windForce = this.WIND_FORCE;
        
        // 初始化
        this.resize();
        this.initParticles();
        this.bindEvents();
        this.animate();
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        [this.snowCanvas, this.rainCanvas].forEach(canvas => {
            canvas.width = this.width;
            canvas.height = this.height;
        });
    }

    initParticles() {
        // 创建雪花和雨滴粒子
        this.snowflakes = Array(80).fill().map(() => new Snowflake(this));
        this.raindrops = Array(150).fill().map(() => new Raindrop(this));
    }

    bindEvents() {
        // 窗口大小改变事件
        window.addEventListener('resize', () => this.resize());

        // 键盘控制风力
        document.addEventListener('keydown', (e) => {
            if(e.key === 'ArrowLeft') this.windForce = -this.WIND_FORCE * 2;
            if(e.key === 'ArrowRight') this.windForce = this.WIND_FORCE * 2;
        });
        
        document.addEventListener('keyup', () => {
            this.windForce = this.WIND_FORCE;
        });
    }

    animate() {
        // 清除画布
        this.sctx.clearRect(0, 0, this.width, this.height);
        this.rctx.clearRect(0, 0, this.width, this.height);

        // 更新并绘制粒子
        this.snowflakes.forEach(flake => {
            flake.update();
            flake.draw();
        });

        this.raindrops.forEach(drop => {
            drop.update();
            drop.draw();
        });

        requestAnimationFrame(() => this.animate());
    }
}

class Snowflake {
    constructor(system) {
        this.system = system;
        this.reset(true);
    }
    
    reset(initial) {
        this.x = initial ? Math.random() * this.system.width : -10;
        this.y = initial ? -Math.random() * 100 : Math.random() * this.system.height;
        this.size = Math.random() * 4 + 2;
        this.speedY = Math.random() * 2 + 1;
        this.speedX = (Math.random() - 0.5) * this.system.windForce * 2;
        this.alpha = Math.random() * 0.5 + 0.5;
    }

    update() {
        this.x += this.speedX + this.system.windForce;
        this.y += this.speedY;
        if(this.y > this.system.height || this.x > this.system.width) {
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

class Raindrop {
    constructor(system) {
        this.system = system;
        this.reset(true);
    }

    reset(initial) {
        this.x = initial ? Math.random() * this.system.width : -10;
        this.y = initial ? -Math.random() * 100 : Math.random() * this.system.height;
        this.length = Math.random() * 15 + 10;
        this.speed = Math.random() * 5 + 8;
        this.trail = [];
    }

    update() {
        this.trail.push({x: this.x, y: this.y});
        if(this.trail.length > 5) this.trail.shift();
        
        this.x += this.system.windForce * 2;
        this.y += this.speed;
        
        if(this.y > this.system.height) {
            this.reset(false);
        }
    }

    draw() {
        const ctx = this.system.rctx;
        
        // 绘制雨滴拖尾
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - this.system.windForce * 5, this.y - this.length);
        ctx.strokeStyle = `rgba(100, 150, 255, ${0.3 + this.system.windForce/2})`;
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

// 导出天气系统
window.WeatherSystem = WeatherSystem; 