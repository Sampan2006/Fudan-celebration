// 确保 Three.js 和 Tween.js 已加载
if (typeof THREE === 'undefined' || typeof TWEEN === 'undefined') {
    console.error('Three.js 或 Tween.js 未加载，请检查脚本引用');
    document.body.innerHTML = '<div style="color: red; text-align: center; margin-top: 50px;">加载失败：Three.js 或 Tween.js 未加载，请检查网络连接</div>';
} else {
    console.log('Three.js 和 Tween.js 已成功加载');
    
    // 复旦大学历史时间轴类
    class Timeline3D {
        constructor() {
            // 初始化属性
            this.scene = new THREE.Scene();
            this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            this.renderer = new THREE.WebGLRenderer({ antialias: true });
            this.events = [];
            this.nodes = [];
            this.currentIndex = 0;
            this.isAnimating = false;
            
            // 设置背景色为浅灰色
            this.scene.background = new THREE.Color(0xf0f0f0);
            
            // 历史事件数据
            this.eventData = [
                { year: 1905, title: "复旦公学创立", description: "由马相伯先生创办于上海" },
                { year: 1917, title: "改名为私立复旦大学", description: "学校发展成为著名学府" },
                { year: 1937, title: "抗日战争爆发", description: "复旦大学内迁重庆北碚" },
                { year: 1946, title: "抗战胜利", description: "复旦大学迁回上海" },
                { year: 1952, title: "院系调整", description: "全国高校院系调整，复旦成为文理综合性大学" },
                { year: 1959, title: "被确定为全国重点大学", description: "成为新中国首批16所全国重点大学之一" },
                { year: 1978, title: "恢复研究生招生", description: "改革开放后恢复研究生教育" },
                { year: 2000, title: "与上海医科大学合并", description: "组建新的复旦大学" },
                { year: 2005, title: "百年校庆", description: "复旦大学迎来百年华诞" },
                { year: 2020, title: "复旦大学现代化建设", description: "推进世界一流大学建设" }
            ];
        }
        
        // 初始化时间轴
        init() {
            try {
                console.log('初始化时间轴');
                
                // 设置渲染器
                this.renderer.setSize(window.innerWidth, window.innerHeight);
                document.getElementById('container').appendChild(this.renderer.domElement);
                
                // 设置相机位置
                this.camera.position.z = 15;
                
                // 添加光源
                this.addLights();
                
                // 创建时间轴节点
                this.createTimelineNodes();
                
                // 显示第一个事件信息
                this.showEventInfo(0);
                
                // 添加控制按钮事件监听
                this.setupControls();
                
                // 开始动画循环
                this.animate();
                
                // 添加窗口大小变化监听
                window.addEventListener('resize', () => this.onWindowResize());
                
                console.log('时间轴初始化完成');
            } catch (error) {
                console.error('初始化失败:', error);
            }
        }
        
        // 添加光源
        addLights() {
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
            this.scene.add(ambientLight);
            
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(1, 1, 1);
            this.scene.add(directionalLight);
        }
        
        // 创建时间轴节点
        createTimelineNodes() {
            const radius = 8; // 时间轴半径
            const nodeCount = this.eventData.length;
            
            for (let i = 0; i < nodeCount; i++) {
                // 计算节点位置（圆形排列）
                const angle = (i / nodeCount) * Math.PI * 2;
                const x = radius * Math.cos(angle);
                const y = radius * Math.sin(angle);
                
                // 创建节点几何体和材质
                const geometry = new THREE.SphereGeometry(0.5, 32, 32);
                const material = new THREE.MeshStandardMaterial({ 
                    color: 0x1a73e8,
                    emissive: 0x072540,
                    metalness: 0.2,
                    roughness: 0.5
                });
                
                // 创建节点网格
                const node = new THREE.Mesh(geometry, material);
                node.position.set(x, y, 0);
                this.scene.add(node);
                this.nodes.push(node);
                
                // 创建年份标签
                const event = this.eventData[i];
                const yearText = this.createTextSprite(event.year.toString());
                yearText.position.set(x * 1.2, y * 1.2, 0);
                this.scene.add(yearText);
            }
            
            // 创建连接线
            const lineGeometry = new THREE.BufferGeometry();
            const points = [];
            
            for (let i = 0; i <= nodeCount; i++) {
                const angle = (i % nodeCount / nodeCount) * Math.PI * 2;
                const x = radius * Math.cos(angle);
                const y = radius * Math.sin(angle);
                points.push(new THREE.Vector3(x, y, 0));
            }
            
            lineGeometry.setFromPoints(points);
            const lineMaterial = new THREE.LineBasicMaterial({ color: 0x666666 });
            const timelineLine = new THREE.Line(lineGeometry, lineMaterial);
            this.scene.add(timelineLine);
        }
        
        // 创建文本精灵
        createTextSprite(text) {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = 256;
            canvas.height = 128;
            
            context.font = '48px Arial';
            context.fillStyle = 'rgba(0, 0, 0, 1.0)';
            context.textAlign = 'center';
            context.fillText(text, 128, 64);
            
            const texture = new THREE.CanvasTexture(canvas);
            const material = new THREE.SpriteMaterial({ map: texture });
            const sprite = new THREE.Sprite(material);
            sprite.scale.set(2, 1, 1);
            
            return sprite;
        }
        
        // 显示事件信息
        showEventInfo(index) {
            if (index < 0 || index >= this.eventData.length) return;
            
            const event = this.eventData[index];
            
            // 创建或更新事件信息面板
            if (!this.eventInfoPanel) {
                this.eventInfoPanel = document.createElement('div');
                this.eventInfoPanel.className = 'event-info-panel';
                this.eventInfoPanel.style.position = 'fixed';
                this.eventInfoPanel.style.bottom = '80px';
                this.eventInfoPanel.style.left = '50%';
                this.eventInfoPanel.style.transform = 'translateX(-50%)';
                this.eventInfoPanel.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                this.eventInfoPanel.style.padding = '20px';
                this.eventInfoPanel.style.borderRadius = '8px';
                this.eventInfoPanel.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
                this.eventInfoPanel.style.zIndex = '10';
                this.eventInfoPanel.style.textAlign = 'center';
                this.eventInfoPanel.style.minWidth = '300px';
                document.body.appendChild(this.eventInfoPanel);
            }
            
            this.eventInfoPanel.innerHTML = `
                <div style="font-size: 32px; font-weight: bold; margin-bottom: 10px;">${event.year}</div>
                <div style="font-size: 24px; color: #666; margin-bottom: 8px;">${event.title}</div>
                <div style="font-size: 16px; line-height: 1.5;">${event.description}</div>
            `;
            
            // 高亮当前节点
            this.nodes.forEach((node, i) => {
                if (i === index) {
                    node.material.color.set(0xff4500); // 高亮颜色
                    node.scale.set(1.5, 1.5, 1.5);
                } else {
                    node.material.color.set(0x1a73e8); // 默认颜色
                    node.scale.set(1, 1, 1);
                }
            });
            
            this.currentIndex = index;
        }
        
        // 设置控制按钮
        setupControls() {
            // 创建控制按钮容器
            const controlsContainer = document.createElement('div');
            controlsContainer.style.position = 'fixed';
            controlsContainer.style.bottom = '20px';
            controlsContainer.style.left = '50%';
            controlsContainer.style.transform = 'translateX(-50%)';
            controlsContainer.style.zIndex = '10';
            controlsContainer.style.display = 'flex';
            controlsContainer.style.gap = '10px';
            document.body.appendChild(controlsContainer);
            
            // 上一个按钮
            const prevButton = document.createElement('button');
            prevButton.textContent = '上一个';
            prevButton.style.padding = '10px 20px';
            prevButton.style.fontSize = '18px';
            prevButton.style.backgroundColor = '#1a73e8';
            prevButton.style.color = 'white';
            prevButton.style.border = 'none';
            prevButton.style.borderRadius = '4px';
            prevButton.style.cursor = 'pointer';
            prevButton.onclick = () => this.navigateToPrev();
            controlsContainer.appendChild(prevButton);
            
            // 下一个按钮
            const nextButton = document.createElement('button');
            nextButton.textContent = '下一个';
            nextButton.style.padding = '10px 20px';
            nextButton.style.fontSize = '18px';
            nextButton.style.backgroundColor = '#1a73e8';
            nextButton.style.color = 'white';
            nextButton.style.border = 'none';
            nextButton.style.borderRadius = '4px';
            nextButton.style.cursor = 'pointer';
            nextButton.onclick = () => this.navigateToNext();
            controlsContainer.appendChild(nextButton);
        }
        
        // 导航到上一个事件
        navigateToPrev() {
            if (this.isAnimating) return;
            
            const newIndex = (this.currentIndex - 1 + this.nodes.length) % this.nodes.length;
            this.navigateToNode(newIndex);
        }
        
        // 导航到下一个事件
        navigateToNext() {
            if (this.isAnimating) return;
            
            const newIndex = (this.currentIndex + 1) % this.nodes.length;
            this.navigateToNode(newIndex);
        }
        
        // 导航到指定节点
        navigateToNode(index) {
            if (this.isAnimating || index === this.currentIndex) return;
            
            this.isAnimating = true;
            
            // 计算目标角度
            const nodeCount = this.nodes.length;
            const targetAngle = (index / nodeCount) * Math.PI * 2;
            
            // 计算相机目标位置
            const radius = 15; // 相机距离
            const targetX = radius * Math.cos(targetAngle);
            const targetY = radius * Math.sin(targetAngle);
            
            // 使用 Tween.js 创建相机动画
            new TWEEN.Tween(this.camera.position)
                .to({ x: targetX, y: targetY, z: radius }, 1000)
                .easing(TWEEN.Easing.Quadratic.InOut)
                .onUpdate(() => {
                    this.camera.lookAt(0, 0, 0);
                })
                .onComplete(() => {
                    this.isAnimating = false;
                    this.showEventInfo(index);
                })
                .start();
        }
        
        // 窗口大小变化处理
        onWindowResize() {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        }
        
        // 动画循环
        animate() {
            requestAnimationFrame(() => this.animate());
            TWEEN.update();
            this.renderer.render(this.scene, this.camera);
        }
    }
    
    // 页面加载完成后初始化时间轴
    window.addEventListener('DOMContentLoaded', () => {
        console.log('DOM 内容加载完成');
        const timeline = new Timeline3D();
        timeline.init();
    });
}
